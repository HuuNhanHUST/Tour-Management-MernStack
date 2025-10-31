import express from "express";
import {
  getBooking,
  getAllBookings,
  getMyBookings,
  updateBookingStatus,
  cancelBooking
} from "../controllers/bookingController.js";

import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

// ℹ️ NOTE: Booking creation moved to payment router
// Use POST /api/v1/payment/cash or POST /api/v1/payment/momo

// ✅ CRITICAL FIX: Get all bookings of current user (must be before /:id route)
router.get("/user/my-bookings", verifyUser, getMyBookings);

// ✅ Get single booking by ID (user can view their own booking)
router.get("/:id", verifyUser, getBooking);

// ✅ Admin: Get all bookings
router.get("/", verifyAdmin, getAllBookings);

// ✅ CRITICAL FIX: Admin update booking status
router.put("/:id/status", verifyAdmin, updateBookingStatus);

// ✅ CRITICAL FIX: Admin cancel booking with slots rollback
router.post("/:id/cancel", verifyAdmin, cancelBooking);

export default router;
