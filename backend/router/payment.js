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
import {
  createBookingFromPayment,
  updateBookingPaymentStatus,
  updateTourSlots,
  rollbackTourSlots
} from '../controllers/bookingController.js';

dotenv.config();
const router = express.Router();

// ✅ SECURITY IMPROVEMENTS:
// - FIX #1: Idempotency guard in IPN handler (prevents duplicate processing)
// - FIX #2: IPN signature verification (prevents fake/malicious IPNs)

router.all('*', (req, res, next) => {
  console.log("📢 Đã truy cập:", req.method, req.originalUrl);
  next();
});


// ✅ OPTION A: Simplified Cash payment endpoint
// Uses bookingController to create Booking, then creates Payment
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
    console.log("💵 [Payment Router] Cash payment request:", {
      userId, tourId, guestSize, totalAmount
    });

    // ✅ STEP 1: Use bookingController to create Booking
    const { booking, tour } = await createBookingFromPayment({
      userId,
      userEmail,
      fullName,
      phone,
      tourId,
      tourName,
      guestSize,
      guests,
      singleRoomCount,
      totalAmount,
      basePrice,
      appliedDiscounts,
      appliedSurcharges,
      paymentMethod: "Cash",
      paymentStatus: "Confirmed", // Cash is auto-confirmed
      province,
      district,
      ward,
      addressDetail,
      bookAt
    });

    // ✅ STEP 2: Create minimal Payment tracking
    const orderId = `CASH_${Date.now()}_${booking._id}`;
    
    const newPayment = new Payment({
      bookingId: booking._id,
      orderId,
      amount: totalAmount,
      payType: "Cash",
      status: "Confirmed",
      paidAt: new Date()
    });

    await newPayment.save();
    console.log("✅ [Payment Router] Payment tracking created:", newPayment._id);

    // ✅ STEP 3: Update tour slots using bookingController
    await updateTourSlots(tourId, guestSize);

    // ✅ STEP 4: Send email confirmation
    try {
      await sendSuccessEmail(userEmail, orderId, totalAmount, fullName);
      console.log("✅ Email sent to:", userEmail);
    } catch (emailError) {
      console.error("⚠️ Email failed but booking successful:", emailError.message);
    }

    console.log("✅ Cash payment complete:", {
      paymentId: newPayment._id,
      bookingId: booking._id
    });

    res.status(200).json({
      success: true,
      message: "Đặt tour thành công! Vui lòng thanh toán tiền mặt khi nhận tour.",
      data: {
        payment: newPayment,
        booking: booking
      }
    });

  } catch (error) {
    console.error('❌ [Payment Router] Cash payment error:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Tạo thanh toán thất bại',
      error: error.message 
    });
  }
});


// ✅ OPTION A: MoMo payment endpoint - Uses bookingController
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
    console.log("💳 [Payment Router] MoMo payment request:", {
      userId, tourId, guestSize, amount
    });

    // Check pending bookings for this tour
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
    console.log(`📊 Pending MoMo bookings for tour: ${pendingQuantity}`);

    // Get user email if not provided
    let finalEmail = email;
    if (!finalEmail) {
      const user = await User.findById(userId);
      finalEmail = user?.email || "";
    }

    // ✅ STEP 1: Use bookingController to create Booking with Pending status
    const { booking, tour } = await createBookingFromPayment({
      userId,
      userEmail: finalEmail,
      fullName,
      phone,
      tourId,
      tourName,
      guestSize,
      guests,
      singleRoomCount,
      totalAmount: amount,
      basePrice,
      appliedDiscounts,
      appliedSurcharges,
      paymentMethod: "MoMo",
      paymentStatus: "Pending", // Will be updated by IPN
      province,
      district,
      ward,
      addressDetail,
      bookAt: new Date()
    });

    // ✅ STEP 2: Generate MoMo payment request
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

    // ✅ STEP 3: Create minimal Payment tracking
    const newPayment = new Payment({
      bookingId: booking._id,
      orderId,
      amount: Number(amount),
      status: 'Pending',
      payType: 'MoMo',
      momoRequestId: requestId
    });

    await newPayment.save();
    console.log("✅ [Payment Router] Payment tracking created with Pending status");

    res.status(200).json(momoRes.data);
    
  } catch (error) {
    console.error('❌ [Payment Router] MoMo payment error:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Tạo thanh toán thất bại',
      error: error.message 
    });
  }
});


// ✅ MoMo Return URL handler - Xử lý khi user quay về từ MoMo
router.get('/momo-return', async (req, res) => {
  const data = req.query;
  console.log("🔙 [Payment Router] User returned from MoMo:", JSON.stringify(data, null, 2));

  try {
    // Verify signature from MoMo return URL
    const rawSignature = 
      `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${data.amount}&extraData=${data.extraData || ''}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
    
    const expectedSignature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');
    
    if (expectedSignature !== data.signature) {
      console.error("❌ Return URL signature không hợp lệ!");
      // Redirect với error
      return res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=false&message=invalid_signature`);
    }
    console.log("✅ Return URL signature verified successfully");

    const resultCode = parseInt(data.resultCode);
    const orderId = data.orderId;
    const message = data.message;

    // Find payment and booking to update status
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      console.error("❌ Payment not found for orderId:", orderId);
      return res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=false&message=payment_not_found`);
    }

    const booking = await Booking.findById(payment.bookingId);
    
    if (!booking) {
      console.error("❌ Booking not found for payment:", payment._id);
      return res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=false&message=booking_not_found`);
    }

    // Handle based on result code
    if (resultCode === 0) {
      // ✅ SUCCESS - Payment will be confirmed by IPN
      console.log("✅ User completed payment successfully for orderId:", orderId);
      res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=true&orderId=${orderId}&message=payment_success`);
      
    } else {
      // ❌ FAILED or CANCELLED
      console.log(`❌ Payment failed/cancelled for orderId: ${orderId}, resultCode: ${resultCode}`);
      
      // Update Payment status to Cancelled/Failed
      const newStatus = resultCode === 1006 ? 'Cancelled' : 'Failed';
      payment.status = newStatus;
      await payment.save();
      console.log(`✅ Payment ${payment._id} status updated to ${newStatus}`);
      
      // Update Booking status to Cancelled/Failed
      await updateBookingPaymentStatus(booking._id, newStatus);
      console.log(`✅ Booking ${booking._id} status updated to ${newStatus}`);
      
      // Redirect to frontend with error
      res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=false&orderId=${orderId}&message=${encodeURIComponent(message)}&resultCode=${resultCode}`);
    }
    
  } catch (err) {
    console.error("❌ Lỗi xử lý MoMo return:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}/thank-you?success=false&message=server_error`);
  }
});


// ✅ OPTION A: MoMo IPN handler - Uses bookingController
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 [Payment Router] IPN từ MoMo:", JSON.stringify(data, null, 2));

  try {
    // ✅ FIX #2: Verify IPN signature from MoMo
    const rawSignature = 
      `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${data.amount}&extraData=${data.extraData || ''}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
    
    const expectedSignature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');
    
    if (expectedSignature !== data.signature) {
      console.error("❌ IPN signature không hợp lệ!");
      console.error("Expected:", expectedSignature);
      console.error("Received:", data.signature);
      return res.status(400).json({ 
        message: "Invalid signature - IPN không hợp lệ" 
      });
    }
    console.log("✅ IPN signature verified successfully");

    // Find payment by orderId
    const payment = await Payment.findOne({ orderId: data.orderId });
    
    if (!payment) {
      console.error("❌ Payment not found for orderId:", data.orderId);
      return res.status(404).json({ message: "Payment not found" });
    }

    // ✅ FIX #1: Idempotency guard - check if already processed
    if (payment.status === 'Confirmed') {
      console.log("ℹ️ IPN đã được xử lý rồi cho orderId:", data.orderId);
      return res.status(200).json({ 
        message: "IPN already processed - Idempotent response" 
      });
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
      console.log("✅ [Payment Router] Payment status updated to Confirmed");

      // Update Booking status using bookingController
      await updateBookingPaymentStatus(booking._id, "Confirmed");

      // Update tour slots using bookingController
      await updateTourSlots(booking.tourId, booking.guestSize);

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
      
      // Update booking status using bookingController
      await updateBookingPaymentStatus(booking._id, "Failed");
      
      console.log("✅ [Payment Router] Payment & Booking marked as Failed");
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

// ✅ OPTION A: Admin update payment status - Uses bookingController
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
    console.log(`📝 [Payment Router] Admin updating payment ${id}: ${oldStatus} → ${status}`);
    
    // Update Payment status
    payment.status = status;
    
    if (status === "Confirmed" && oldStatus !== "Confirmed") {
      payment.paidAt = new Date();
      
      // Update Booking status using bookingController
      await updateBookingPaymentStatus(booking._id, "Confirmed");
      
      // Update tour slots using bookingController
      await updateTourSlots(booking.tourId, booking.guestSize);
      
      // Send confirmation email
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
    
    // ✅ If rejecting/cancelling payment - rollback tour slots
    if ((status === "Failed" || status === "Cancelled") && oldStatus === "Confirmed") {
      console.log("⚠️ [Payment Router] Rolling back confirmed payment to", status);
      
      // Update Booking status using bookingController
      await updateBookingPaymentStatus(booking._id, status);
      
      // Rollback tour slots using bookingController
      await rollbackTourSlots(booking.tourId, booking.guestSize);
    } else if (status === "Failed" || status === "Cancelled") {
      // Just update booking status for non-confirmed bookings
      await updateBookingPaymentStatus(booking._id, status);
    }
    
    // Save payment
    await payment.save();
    
    // Reload booking to get updated data
    const updatedBooking = await Booking.findById(booking._id);
    
    console.log("✅ [Payment Router] Payment & Booking status updated successfully");
    
    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái thành công: ${oldStatus} → ${status}`,
      payment,
      booking: updatedBooking
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
