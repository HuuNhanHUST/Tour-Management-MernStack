import express from "express";
import {
  getDashboardStats,      // gọi 1 lần cho toàn bộ dashboard
  getUserCount,
  getTourCount,
  getBookingCount,
  getTotalRevenue
} from "../controllers/dashboardController.js";

import { verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

// 📊 Route gộp duy nhất để hiển thị dashboard admin
router.get("/stats", verifyAdmin, getDashboardStats);

// 🔹 (Tuỳ chọn) Các route riêng lẻ nếu cần dùng
router.get("/getUserCount", verifyAdmin, getUserCount);
router.get("/getTourCount", verifyAdmin, getTourCount);
router.get("/getBookingCount", verifyAdmin, getBookingCount);
router.get("/getTotalRevenue", verifyAdmin, getTotalRevenue);

export default router;
