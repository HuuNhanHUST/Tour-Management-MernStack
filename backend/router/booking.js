import express from "express";
import {
  createBooking,
  getBooking,
  getAllBookings,

} from "../controllers/bookingController.js";

import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

// ✔️ Dành cho người dùng (đã xác thực đúng chính chủ hoặc admin)
router.post("/", verifyUser, createBooking);

router.get("/:id", verifyUser, getBooking);


// ✔️ Chỉ admin mới được truy cập danh sách toàn bộ booking
router.get("/", verifyAdmin, getAllBookings);

export default router;
