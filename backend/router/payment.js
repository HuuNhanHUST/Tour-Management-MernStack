import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { io } from '../index.js';
import { sendSuccessEmail } from '../utils/emailSender.js';

dotenv.config();
const router = express.Router();

// Gửi yêu cầu thanh toán MoMo
router.post('/momo', async (req, res) => {
  const { amount, orderId, orderInfo, userId, tourId, quantity, email } = req.body;

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

  try {
    const momoRes = await axios.post(process.env.MOMO_API_URL, requestBody);
    console.log("✅ MoMo response:", momoRes.data);

    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: email,
      tourId,
      quantity,
      orderId,
      amount,
      status: 'Pending',
      payType: 'MoMo'
    });

    res.status(200).json(momoRes.data);
  } catch (error) {
    console.error('❌ Lỗi gọi MoMo:', error.message);
    res.status(500).json({ message: 'Tạo thanh toán thất bại' });
  }
});

// MoMo gọi về khi thanh toán xong
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", data);

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: data.orderId },
      { status: data.resultCode === 0 ? "Success" : "Failed" },
      { new: true }
    ).populate("userId", "username");

    if (data.resultCode === 0 && updatedPayment) {
      await Booking.create({
        userId: updatedPayment.userId._id,
        userEmail: updatedPayment.userEmail,
        tourId: updatedPayment.tourId,
        guestSize: updatedPayment.quantity || 1,
        totalAmount: updatedPayment.amount,
        bookAt: new Date()
      });

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

// Lịch sử thanh toán người dùng
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

// Admin: Lấy tất cả
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

// Admin: Cập nhật trạng thái
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

    // Emit realtime
    if (updated.userId) {
      io.emit(`payment-updated-${updated.userId._id}`, updated);
    }

    // Gửi email nếu thành công
    if (status === "Success" && updated.userEmail) {
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

// Route test gửi email từ DB
// ✅ Route test gửi email từ bản ghi mới nhất
router.get('/test-email', async (req, res) => {
  try {
    const payment = await Payment.findOne({ status: "Success" })
      .sort({ createdAt: -1 })
      .populate("userId", "username");

    if (!payment || !payment.userEmail) {
      return res.send("❌ Không có email hoặc đơn thanh toán thành công để gửi.");
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
