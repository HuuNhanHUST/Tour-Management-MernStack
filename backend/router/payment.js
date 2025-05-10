import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';

dotenv.config();
const router = express.Router();

// 👉 Gửi yêu cầu thanh toán đến MoMo
router.post('/momo', async (req, res) => {
  const {
    amount,
    orderId,
    orderInfo,
    userId,
    tourId,
    quantity,
    email // 👈 thêm email người dùng
  } = req.body;

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const returnUrl = process.env.MOMO_RETURN_URL;
  const notifyUrl = process.env.MOMO_NOTIFY_URL;
  const requestType = process.env.MOMO_REQUEST_TYPE;
  const endpoint = process.env.MOMO_API_URL;

  const requestId = `${partnerCode}${Date.now()}`;
  const rawAmount = amount.toString();

  const rawSignature =
    `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}` +
    `&amount=${rawAmount}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&returnUrl=${returnUrl}&notifyUrl=${notifyUrl}&extraData=`;

  const signature = crypto.createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: rawAmount,
    orderId,
    orderInfo,
    returnUrl,
    notifyUrl,
    extraData: '',
    requestType,
    signature,
    lang: 'vi'
  };

  try {
    const momoRes = await axios.post(endpoint, requestBody);
    console.log("✅ MoMo response:", momoRes.data);

    // ✅ Lưu đơn thanh toán tạm thời
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
    console.error('❌ Lỗi gọi MoMo:', error.response?.data || error.message);
    res.status(500).json({ message: 'Tạo thanh toán thất bại' });
  }
});

// 👉 MoMo gọi về khi thanh toán xong (IPN)
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", data);

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: data.orderId },
      { status: data.resultCode === 0 ? "Success" : "Failed" },
      { new: true }
    );

    if (data.resultCode === 0 && updatedPayment) {
      // ✅ Tạo booking mới sau khi thanh toán thành công
      await Booking.create({
        userId: updatedPayment.userId,
        userEmail: updatedPayment.userEmail,
        tourId: updatedPayment.tourId,
        guestSize: updatedPayment.quantity || 1,
        totalAmount: updatedPayment.amount,
        bookAt: new Date()
      });
    }

    res.status(200).json({ message: 'IPN received' });
  } catch (err) {
    console.error("❌ Lỗi xử lý IPN:", err.message);
    res.status(500).json({ message: 'Xử lý IPN thất bại' });
  }
});

// 👉 Lịch sử thanh toán của người dùng
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const payments = await Payment.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử:", err.message);
    res.status(500).json({ message: 'Lỗi lấy lịch sử thanh toán' });
  }
});

export default router;
