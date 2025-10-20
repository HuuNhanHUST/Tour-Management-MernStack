import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import { io } from '../index.js';
import { sendSuccessEmail } from '../utils/emailSender.js';

dotenv.config();
const router = express.Router();

router.all('*', (req, res, next) => {
  console.log("📢 Đã truy cập:", req.method, req.originalUrl);
  next();
});


// ✅ OPTION A: Simplified Cash payment endpoint
// Create Booking first (single source of truth), then minimal Payment record
router.post('/cash', async (req, res) => {
  const {
    userId, userEmail, fullName, phone,
    tourId, tourName, guestSize,
    guests, singleRoomCount,
    totalAmount, basePrice,
    appliedDiscounts, appliedSurcharges,
    province, district, ward, addressDetail,
    bookAt
  } = req.body;

  try {
    console.log("💵 [OPTION A] Cash payment request received:", {
      userId, tourId, guestSize, totalAmount
    });

    // Validate tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: "Tour không tồn tại" 
      });
    }

    // Check slots availability
    const availableSlots = tour.maxGroupSize - tour.currentBookings;
    if (guestSize > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn lại ${availableSlots} chỗ trống.`
      });
    }

    // Validate required fields
    if (!province?.code || !district?.code || !ward?.code || !addressDetail) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin địa chỉ."
      });
    }

    if (!guests || guests.length === 0 || guests.length !== guestSize) {
      return res.status(400).json({
        success: false,
        message: "Thông tin khách không đầy đủ hoặc không khớp với số lượng khách."
      });
    }

    // ✅ OPTION A STEP 1: Create Booking FIRST (single source of truth)
    const newBooking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail,
      tourId: tour._id,
      tourName: tourName || tour.title,
      fullName,
      phone,
      guestSize,
      guests,
      singleRoomCount: singleRoomCount || 0,
      totalAmount,
      basePrice,
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      paymentMethod: "Cash",
      paymentStatus: "Confirmed", // ✅ Cash is auto-confirmed
      bookAt: bookAt || new Date(),
      province,
      district,
      ward,
      addressDetail
    });

    await newBooking.save();
    console.log("✅ [OPTION A] Booking created (single source):", newBooking._id);

    // ✅ OPTION A STEP 2: Create minimal Payment record (tracking only)
    const orderId = `CASH_${Date.now()}_${newBooking._id}`;
    
    const newPayment = new Payment({
      bookingId: newBooking._id,
      orderId,
      amount: totalAmount,
      payType: "Cash",
      status: "Confirmed",
      paidAt: new Date()
    });

    await newPayment.save();
    console.log("✅ [OPTION A] Payment tracking created:", newPayment._id);

    // ✅ OPTION A STEP 3: Update tour slots
    tour.currentBookings += guestSize;
    await tour.save();
    console.log("✅ Tour slots updated:", tour.currentBookings);

    // ✅ OPTION A STEP 4: Send email confirmation
    try {
      await sendSuccessEmail(
        userEmail,
        orderId,
        totalAmount,
        fullName
      );
      console.log("✅ Email sent to:", userEmail);
    } catch (emailError) {
      console.error("⚠️ Email failed but booking successful:", emailError.message);
    }

    console.log("✅ Cash payment complete:", {
      paymentId: newPayment._id,
      bookingId: newBooking._id
    });

    res.status(200).json({
      success: true,
      message: "Đặt tour thành công! Vui lòng thanh toán tiền mặt khi nhận tour.",
      data: {
        payment: newPayment,
        booking: newBooking
      }
    });

  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán Cash:', error);
    res.status(500).json({ 
      success: false,
      message: 'Tạo thanh toán thất bại',
      error: error.message 
    });
  }
});


// ✅ OPTION A: MoMo payment endpoint - Create Booking immediately, Payment for tracking
router.post('/momo', async (req, res) => {
  const {
    amount, orderId, orderInfo,
    userId, tourId, email,
    fullName, phone, tourName,
    guestSize, guests, singleRoomCount,
    basePrice, appliedDiscounts, appliedSurcharges,
    province, district, ward, addressDetail
  } = req.body;

  try {
    console.log("💳 [OPTION A] MoMo payment request received:", {
      userId, tourId, guestSize, amount
    });

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour không tồn tại" 
      });
    }

    // Check slots (including pending bookings)
    const pendingBookings = await Booking.aggregate([
      {
        $match: {
          tourId: new mongoose.Types.ObjectId(tourId),
          paymentStatus: "Pending",
          paymentMethod: "MoMo"
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$guestSize" }
        }
      }
    ]);
    
    const pendingQuantity = pendingBookings[0]?.totalPending || 0;
    const availableSlots = tour.maxGroupSize - tour.currentBookings - pendingQuantity;

    if (guestSize > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Tour đã hết chỗ hoặc chỉ còn lại ${availableSlots} chỗ do đang chờ thanh toán.`
      });
    }

    // Validate required fields
    if (!province?.code || !district?.code || !ward?.code || !addressDetail) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin địa chỉ."
      });
    }

    if (!guests || guests.length === 0 || guests.length !== guestSize) {
      return res.status(400).json({
        success: false,
        message: "Thông tin khách không đầy đủ hoặc không khớp với số lượng khách."
      });
    }

    let finalEmail = email;
    if (!finalEmail) {
      const user = await User.findById(userId);
      finalEmail = user?.email || "";
    }

    // ✅ OPTION A STEP 1: Create Booking FIRST (even before payment confirmation)
    const newBooking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: finalEmail,
      tourId: tour._id,
      tourName: tour.title || tourName,
      fullName,
      phone,
      guestSize,
      guests,
      singleRoomCount: singleRoomCount || 0,
      totalAmount: amount,
      basePrice,
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      paymentMethod: "MoMo",
      paymentStatus: "Pending", // ✅ Will be updated by IPN
      bookAt: new Date(),
      province,
      district,
      ward,
      addressDetail
    });

    await newBooking.save();
    console.log("✅ [OPTION A] Booking created with Pending status:", newBooking._id);

    // Generate MoMo request
    const requestId = `${process.env.MOMO_PARTNER_CODE}${Date.now()}`;
    const rawAmount = amount.toString();
    const rawSignature =
      `partnerCode=${process.env.MOMO_PARTNER_CODE}&accessKey=${process.env.MOMO_ACCESS_KEY}&requestId=${requestId}` +
      `&amount=${rawAmount}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&returnUrl=${process.env.MOMO_RETURN_URL}&notifyUrl=${process.env.MOMO_NOTIFY_URL}&extraData=`;

    const signature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      requestId,
      amount: rawAmount,
      orderId,
      orderInfo,
      returnUrl: process.env.MOMO_RETURN_URL,
      notifyUrl: process.env.MOMO_NOTIFY_URL,
      extraData: '',
      requestType: process.env.MOMO_REQUEST_TYPE,
      signature,
      lang: 'vi'
    };

    const momoRes = await axios.post(process.env.MOMO_API_URL, requestBody);
    console.log("✅ MoMo API response:", momoRes.data);

    // ✅ OPTION A STEP 2: Create minimal Payment tracking
    const newPayment = new Payment({
      bookingId: newBooking._id,
      orderId,
      amount: Number(amount),
      status: 'Pending',
      payType: 'MoMo',
      momoRequestId: requestId
    });

    await newPayment.save();
    console.log("✅ [OPTION A] Payment tracking created with Pending status");

    res.status(200).json(momoRes.data);
    
  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán MoMo:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Tạo thanh toán thất bại',
      error: error.message 
    });
  }
});


// ✅ OPTION A: MoMo IPN handler - Update Booking & Payment status
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 [OPTION A] IPN từ MoMo:", JSON.stringify(data, null, 2));

  try {
    // Find payment by orderId
    const payment = await Payment.findOne({ orderId: data.orderId });
    
    if (!payment) {
      console.error("❌ Payment not found for orderId:", data.orderId);
      return res.status(404).json({ message: "Payment not found" });
    }

    // Find associated booking
    const booking = await Booking.findById(payment.bookingId);
    
    if (!booking) {
      console.error("❌ Booking not found for payment:", payment._id);
      return res.status(404).json({ message: "Booking not found" });
    }

    if (data.resultCode === 0) {
      // ✅ PAYMENT SUCCESS
      console.log("✅ Payment successful, updating records...");

      // Update Payment status
      payment.status = "Confirmed";
      payment.momoTransId = data.transId;
      payment.paidAt = new Date();
      await payment.save();
      console.log("✅ [OPTION A] Payment status updated to Confirmed");

      // Update Booking status
      booking.paymentStatus = "Confirmed";
      await booking.save();
      console.log("✅ [OPTION A] Booking status updated to Confirmed");

      // Update tour slots
      const tour = await Tour.findById(booking.tourId);
      if (tour) {
        tour.currentBookings += booking.guestSize;
        await tour.save();
        console.log("✅ Tour slots updated:", tour.currentBookings);
      }

      // Send success email
      try {
        await sendSuccessEmail(
          booking.userEmail,
          payment.orderId,
          payment.amount,
          booking.fullName
        );
        console.log("✅ Email sent to:", booking.userEmail);
      } catch (emailError) {
        console.error("⚠️ Email failed:", emailError.message);
      }

      // Notify via Socket.IO
      if (io) {
        io.emit("newBooking", {
          message: `Booking mới từ ${booking.fullName}`,
          booking: booking
        });
      }

      return res.status(200).json({ message: "IPN processed successfully" });

    } else {
      // ❌ PAYMENT FAILED
      console.log("❌ Payment failed, updating status...");
      
      payment.status = "Failed";
      await payment.save();
      
      booking.paymentStatus = "Failed";
      await booking.save();
      
      console.log("✅ [OPTION A] Payment & Booking marked as Failed");
      return res.status(200).json({ message: "Payment failed, statuses updated" });
    }

  } catch (err) {
    console.error("❌ Lỗi xử lý IPN:", err.message);
    res.status(500).json({ message: 'Xử lý IPN thất bại', error: err.message });
  }
});


// ✅ OPTION A: Lịch sử thanh toán của user (populate booking data)
router.get('/user/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({
      bookingId: { $exists: true }
    })
      .populate({
        path: 'bookingId',
        match: { userId: new mongoose.Types.ObjectId(req.params.userId) },
        select: 'fullName tourName guestSize totalAmount paymentStatus bookAt'
      })
      .sort({ createdAt: -1 });

    // Filter out payments where booking doesn't match userId
    const userPayments = payments.filter(p => p.bookingId != null);

    res.status(200).json(userPayments);
  } catch (err) {
    console.error("❌ Error getting user payments:", err);
    res.status(500).json({ message: 'Lỗi lấy lịch sử thanh toán' });
  }
});

// ✅ OPTION A: Admin xem tất cả thanh toán (populate booking details)
router.get('/all', async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false });

    const payments = await Payment.find()
      .populate({
        path: 'bookingId',
        select: 'userId userEmail fullName phone tourId tourName guestSize totalAmount paymentStatus bookAt',
        populate: {
          path: 'userId',
          select: 'username email'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    console.error("❌ Error getting all payments:", err);
    res.status(500).json({ message: "Lỗi xác thực hoặc truy vấn" });
  }
});

// ✅ OPTION A: Admin update payment status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false });
    }

    if (!["Pending", "Confirmed", "Failed", "Cancelled"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status không hợp lệ" 
      });
    }

    const payment = await Payment.findById(id).populate('bookingId');
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy payment" 
      });
    }

    const booking = payment.bookingId;
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking liên kết với payment này"
      });
    }

    const oldStatus = payment.status;
    console.log(`📝 [OPTION A] Admin updating payment ${id}: ${oldStatus} → ${status}`);
    
    // Update both Payment and Booking status
    payment.status = status;
    booking.paymentStatus = status;
    
    if (status === "Confirmed" && oldStatus !== "Confirmed") {
      payment.paidAt = new Date();
      
      // Send confirmation email if needed
      if (booking.userEmail) {
        try {
          await sendSuccessEmail(
            booking.userEmail,
            payment.orderId,
            payment.amount,
            booking.fullName
          );
          console.log("✅ Confirmation email sent");
        } catch (emailError) {
          console.error("⚠️ Email failed:", emailError.message);
        }
      }
      
      console.log("✅ Payment & Booking confirmed by admin");
    }
    
    // ✅ OPTION A: If rejecting/cancelling payment
    if ((status === "Failed" || status === "Cancelled") && oldStatus === "Confirmed") {
      console.log("⚠️ [OPTION A] Rolling back confirmed payment to", status);
      
      // Rollback tour slots
      const tour = await Tour.findById(booking.tourId);
      if (tour) {
        tour.currentBookings -= booking.guestSize;
        await tour.save();
        console.log("✅ Restored tour slots:", tour.currentBookings);
      }
    }
    
    // Save both records
    await payment.save();
    await booking.save();
    
    console.log("✅ [OPTION A] Payment & Booking status updated successfully");
    
    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái thành công: ${oldStatus} → ${status}`,
      payment,
      booking
    });
    
  } catch (err) {
    console.error("❌ Error updating payment status:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi cập nhật trạng thái",
      error: err.message 
    });
  }
});

// ✅ OPTION A: Get single payment with booking details
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'bookingId',
        populate: {
          path: 'userId',
          select: 'username email'
        }
      });
      
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payment"
      });
    }
    
    res.status(200).json(payment);
  } catch (err) {
    console.error("❌ Error getting payment:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi truy vấn payment" 
    });
  }
});

// ✅ OPTION A: Get payment by orderId
router.get('/order/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId })
      .populate('bookingId');
      
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy payment"
      });
    }
    
    res.status(200).json(payment);
  } catch (err) {
    console.error("❌ Error getting payment by orderId:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi truy vấn payment"
    });
  }
});


// ✅ Test email endpoint
router.get('/test-email', async (req, res) => {
  try {
    const payment = await Payment.findOne({ status: "Confirmed" })
      .sort({ createdAt: -1 })
      .populate('bookingId');

    if (!payment || !payment.bookingId || !payment.bookingId.userEmail) {
      return res.send("❌ Không có payment/booking hợp lệ để gửi email.");
    }

    await sendSuccessEmail(
      payment.bookingId.userEmail,
      payment.orderId,
      payment.amount,
      payment.bookingId.fullName
    );

    res.send("✅ Đã gửi email test thành công");
  } catch (err) {
    console.error("❌ Lỗi gửi test email:", err);
    res.status(500).send("❌ Lỗi gửi");
  }
});

export default router;
