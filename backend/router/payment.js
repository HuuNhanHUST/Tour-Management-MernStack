import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; // 👈 thêm để ép ObjectId
import Payment from '../models/Payment.js';

dotenv.config();
const router = express.Router();

router.post('/momo', async (req, res) => {
  const { amount, orderId, orderInfo, userId } = req.body;

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
    console.log("✅ Phản hồi MoMo:", momoRes.data);

    // ✅ ép userId sang ObjectId để lưu chuẩn
    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      orderId,
      amount,
      status: 'Pending',
      payType: 'MoMo'
    });

    res.status(200).json(momoRes.data);
  } catch (error) {
    console.error('❌ Lỗi khi gọi MoMo:', error.response?.data || error.message);
    res.status(500).json({ message: 'Giao dịch thất bại với MoMo' });
  }
});

router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", data);

  try {
    await Payment.findOneAndUpdate(
      { orderId: data.orderId },
      { status: data.resultCode === 0 ? "Success" : "Failed" }
    );

    res.status(200).json({ message: 'IPN received' });
  } catch (err) {
    console.error("❌ Lỗi xử lý IPN:", err.message);
    res.status(500).json({ message: 'Lỗi xử lý IPN' });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const payments = await Payment.find({
      userId: new mongoose.Types.ObjectId(userId) // ✅ convert khi query
    }).sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử:", err.message);
    res.status(500).json({ message: 'Lỗi lấy lịch sử thanh toán' });
  }
});

export default router;
