import express from "express";
import {
  createBooking,
  getBooking,
  getAllBookings,

} from "../controllers/bookingController.js";

import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();

// ❌ DEPRECATED: Endpoint này đã ngưng sử dụng
// Vui lòng dùng POST /api/v1/payment/cash hoặc /api/v1/payment/momo
router.post("/", verifyUser, (req, res) => {
  console.warn("⚠️ DEPRECATED ENDPOINT CALLED: POST /booking");
  console.warn("Request from user:", req.user?.id);
  
  return res.status(410).json({
    success: false,
    message: "⚠️ Endpoint này đã ngưng sử dụng. Vui lòng sử dụng:\n" +
             "- POST /api/v1/payment/cash (cho thanh toán tiền mặt)\n" +
             "- POST /api/v1/payment/momo (cho thanh toán MoMo)",
    deprecated: true,
    newEndpoints: {
      cash: "/api/v1/payment/cash",
      momo: "/api/v1/payment/momo"
    }
  });
});

router.get("/:id", verifyUser, getBooking);


// ✔️ Chỉ admin mới được truy cập danh sách toàn bộ booking
router.get("/", verifyAdmin, getAllBookings);

export default router;
