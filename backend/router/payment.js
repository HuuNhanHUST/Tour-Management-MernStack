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
  const  { amount, orderId, orderInfo, userId, tourId, quantity, email, fullName, phone, tourName }  = req.body;

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

    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: finalEmail,
      tourId: new mongoose.Types.ObjectId(tourId), // ✅ ép kiểu
      quantity,
      orderId,
      amount,
      status: 'Pending',
      payType: 'MoMo',
      tourName,
      fullName,
      phone,
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
      console.log("✅ MoMo thanh toán thành công - đang tạo booking");

      // ✅ Tạo booking
      await Booking.create({
        userId: updatedPayment.userId._id,
        userEmail: updatedPayment.userEmail,
        tourId: new mongoose.Types.ObjectId(updatedPayment.tourId),
        tourName: updatedPayment.tourName || "Chưa rõ",
        fullName: updatedPayment.fullName || updatedPayment.userId?.username || "Người dùng",
        phone: updatedPayment.phone || "Không rõ",
        guestSize: updatedPayment.quantity || 1,
        totalAmount: updatedPayment.amount,
        bookAt: new Date(),
        paymentMethod: "MoMo"
      });

      // ✅ Cập nhật số lượng đã đặt (bằng cách tìm và save)
      const tour = await Tour.findById(updatedPayment.tourId);
      if (!tour) {
        console.error("❌ Không tìm thấy tour:", updatedPayment.tourId);
      } else {
        console.log("✅ Trước cập nhật currentBookings:", tour.currentBookings);
        tour.currentBookings += updatedPayment.quantity || 1;
        await tour.save();
        console.log("✅ Đã cập nhật currentBookings:", tour.currentBookings);
      }

      // ✅ Gửi email xác nhận
      if (updatedPayment.userEmail) {
        await sendSuccessEmail(
          updatedPayment.userEmail,
          updatedPayment.orderId,
          updatedPayment.amount,
          updatedPayment.userId?.username || "Quý khách"
        );
      }
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
      // Tạo booking tự động khi admin duyệt thành công
      await Booking.create({
        userId: updated.userId._id,
        userEmail: updated.userEmail,
        tourId: new mongoose.Types.ObjectId(updated.tourId),
        tourName: updated.tourName || "Chưa rõ",
        fullName: updated.fullName || updated.userId?.username || "Người dùng",
        phone: updated.phone || "Không rõ",
        guestSize: updated.quantity || 1,
        totalAmount: updated.amount,
        bookAt: new Date(),
        paymentMethod: "MoMo"
      });

      // Cập nhật số lượng đã đặt tour
      const tour = await Tour.findById(updated.tourId);
      if (tour) {
        tour.currentBookings += updated.quantity || 1;
        await tour.save();
      }

      // Gửi email xác nhận
      await sendSuccessEmail(
        updated.userEmail,
        updated.orderId,
        updated.amount,
        updated.userId?.username || "Quý khách"
      );
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false });
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
