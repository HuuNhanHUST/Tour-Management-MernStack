import express from "express";
import {
  getBooking,
  getAllBookings,
} from "../controllers/bookingController.js";
import Booking from "../models/Booking.js";

import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

// ℹ️ NOTE: Booking creation moved to payment router
// Use POST /api/v1/payment/cash or POST /api/v1/payment/momo

// ✅ Get single booking by ID (user can view their own booking)
router.get("/:id", verifyUser, getBooking);

// ✅ Get all bookings of current user
router.get("/user/my-bookings", verifyUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('tourId', 'title price city featured');
    
    res.status(200).json({
      success: true,
      message: "Lấy danh sách booking thành công",
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error("❌ Error getting user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách booking",
      error: error.message
    });
  }
});

// ✅ Admin: Get all bookings
router.get("/", verifyAdmin, getAllBookings);

export default router;
