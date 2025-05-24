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


// ✅ Gửi yêu cầu thanh toán MoMo
router.post('/momo', async (req, res) => {
  const {
    amount,
    orderId,
    orderInfo,
    userId,
    tourId,
    quantity,
    email,
    fullName,
    phone,
    tourName,
    province,
    district,
    ward,
    addressDetail
  } = req.body;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Tour không tồn tại" });

    const pendingPayments = await Payment.aggregate([
      {
        $match: {
          tourId: new mongoose.Types.ObjectId(tourId),
          status: "Pending"
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$quantity" }
        }
      }
    ]);
    const pendingQuantity = pendingPayments[0]?.totalPending || 0;
    const availableSlots = tour.maxGroupSize - tour.currentBookings - pendingQuantity;

    if (quantity > availableSlots) {
      return res.status(400).json({
        message: `Tour đã hết chỗ hoặc chỉ còn lại ${availableSlots} chỗ do đang chờ thanh toán.`
      });
    }

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
    console.log("✅ MoMo response:", momoRes.data);

    let finalEmail = email;
    if (!finalEmail) {
      const user = await User.findById(userId);
      finalEmail = user?.email || "";
    }

    // 🧾 Log dữ liệu sắp lưu
    console.log("🧾 Tạo payment MoMo với:", {
      tourId: tour._id,
      quantity,
      amount
    });

    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: finalEmail,
      tourId: tour._id, // ✅ lấy từ đối tượng đã find được
      quantity: Number(quantity),
      orderId,
      amount: Number(amount),
      status: 'Pending',
      payType: 'MoMo',
      tourName: tour.title,
      fullName,
      phone,
      province: province || { code: "", name: "" },
      district: district || { code: "", name: "" },
      ward: ward || { code: "", name: "" },
      addressDetail: addressDetail || "",
    });

    res.status(200).json(momoRes.data);
  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán MoMo:', error.message);
    res.status(500).json({ message: 'Tạo thanh toán thất bại' });
  }
});


// ✅ MoMo gọi về khi thanh toán thành công
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", JSON.stringify(data, null, 2));

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: data.orderId },
      { status: data.resultCode === 0 ? "Success" : "Failed" },
      { new: true }
    ).populate("userId", "username");

    if (data.resultCode === 0 && updatedPayment) {
      console.log("✅ MoMo thanh toán thành công - chờ admin duyệt để tạo booking");
    }

    res.status(200).json({ message: 'IPN received' });
  } catch (err) {
    console.error("❌ Lỗi xử lý IPN:", err.message);
    res.status(500).json({ message: 'Xử lý IPN thất bại' });
  }
});


// ✅ Lịch sử thanh toán của user
router.get('/user/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: new mongoose.Types.ObjectId(req.params.userId)
    }).sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy lịch sử thanh toán' });
  }
});

// ✅ Admin: xem tất cả thanh toán
router.get('/all', async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false });

    const payments = await Payment.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: "Lỗi xác thực hoặc truy vấn" });
  }
});

// ✅ Admin: cập nhật trạng thái thanh toán
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false });

    if (!["Pending", "Success", "Failed"].includes(status)) {
      return res.status(400).json({ success: false });
    }

    const updated = await Payment.findByIdAndUpdate(id, { status }, { new: true })
      .populate("userId", "username");

    if (!updated) return res.status(404).json({ success: false });

    io.emit(`payment-updated-${updated.userId._id}`, updated);

    if (status === "Success" && updated.userEmail) {
      console.log("✅ Đang xử lý booking cho payment ID:", updated._id);
      console.log("🔢 Số lượng người (quantity):", updated.quantity);
      console.log("📌 Tour ID (trước kiểm tra):", updated.tourId);
      console.log("📧 Email người dùng:", updated.userEmail);
      console.log("👤 Tên người đặt:", updated.fullName);

      // ✅ Truy xuất lại chính xác tour từ DB bằng ID
      const tour = await Tour.findOne({ _id: updated.tourId });

      if (!tour) {
        console.error("❌ Không tìm thấy tour với ID:", updated.tourId);
        return res.status(404).json({ success: false, message: "Không tìm thấy tour để tạo booking." });
      }

      // ✅ Kiểm tra số lượng còn trống
      const remaining = tour.maxGroupSize - tour.currentBookings;
      if (updated.quantity > remaining) {
        return res.status(400).json({
          success: false,
          message: `Không đủ chỗ trống. Chỉ còn lại ${remaining} chỗ.`,
        });
      }

      // ✅ Tạo booking
      const newBooking = new Booking({
        userId: updated.userId._id,
        userEmail: updated.userEmail,
        tourId: tour._id,
        tourName: updated.tourName || tour.title,
        fullName: updated.fullName || updated.userId?.username || "Người dùng",
        phone: updated.phone || "Không rõ",
        guestSize: updated.quantity || 1,
        totalAmount: updated.amount,
        bookAt: new Date(),
        paymentMethod: "MoMo",
        province: updated.province || { code: "", name: "" },
        district: updated.district || { code: "", name: "" },
        ward: updated.ward || { code: "", name: "" },
        addressDetail: updated.addressDetail || "",
      });

      await newBooking.save();

      // ✅ Cập nhật số lượng người trong tour
      tour.currentBookings += updated.quantity || 1;
      await tour.save();
      console.log("✅ Đã cập nhật currentBookings thành:", tour.currentBookings);

      // ✅ Gửi email
      await sendSuccessEmail(
        updated.userEmail,
        updated.orderId,
        updated.amount,
        updated.userId?.username || "Quý khách"
      );
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái thanh toán:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});




// ✅ Gửi thử email từ đơn thành công gần nhất
router.get('/test-email', async (req, res) => {
  try {
    const payment = await Payment.findOne({ status: "Success" })
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    if (!payment || !payment.userEmail) {
      return res.send("❌ Không có email hợp lệ để gửi.");
    }

    await sendSuccessEmail(
      payment.userEmail,
      payment.orderId,
      payment.amount,
      payment.userId?.username || "Quý khách"
    );

    res.send("✅ Đã gửi email test thành công");
  } catch (err) {
    console.error("❌ Lỗi gửi test email:", err);
    res.status(500).send("❌ Lỗi gửi");
  }
});

export default router;
