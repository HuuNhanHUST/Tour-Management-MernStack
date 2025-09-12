import express from 'express';
import UserStatus from '../models/UserStatus.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const statuses = await UserStatus.find().populate('userId', 'username email');
  res.json(statuses);
});

export default router;
