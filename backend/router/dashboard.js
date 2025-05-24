import express from "express";
import {
  getDashboardStats,
  getUserCount,
  getTourCount,
  getBookingCount,
  getTotalRevenue,
  getOrderStatsByDate,
  getRevenueStatsByDate, // Import new function
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

// 🔹 Route cho thống kê đơn hàng theo ngày
router.get("/orders", verifyAdmin, getOrderStatsByDate);

// 🔹 Route cho thống kê doanh thu theo ngày
router.get("/revenue", verifyAdmin, getRevenueStatsByDate);

export default router;