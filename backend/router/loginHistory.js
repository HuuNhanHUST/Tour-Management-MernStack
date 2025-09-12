// router/loginHistory.js
import express from 'express';
import LoginHistory from '../models/LoginHistory.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const history = await LoginHistory.find({ userId: req.params.userId }).sort({ loginAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Không thể lấy lịch sử đăng nhập' });
  }
});

export default router;
