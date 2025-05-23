import express from "express";
import uploadCloud from "../middleware/uploadCloud.js"; // 🔄 thay multer bằng Cloudinary
import Tour from '../models/Tour.js';
import {
  createTour,
  deleteTour,
  getAllTour,
  getFeaturedTours,
  getSingleTour,
  getTourBySearch,
  getTourCount,
  updateTour
} from "../controllers/tourController.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const route = express.Router();

// ✅ Create tour (dùng Cloudinary upload ảnh)
route.post("/", uploadCloud.single("photo"), verifyAdmin, createTour);

// ✅ Get toàn bộ tour (admin) — đặt trước :id để tránh bị override
route.get("/all", verifyAdmin, async (req, res) => {
  try {
    const tours = await Tour.find().populate("reviews");
    res.status(200).json({ success: true, data: tours });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách tour đầy đủ" });
  }
});

// ✅ Các route search
route.get("/search/getTourBySearch", getTourBySearch);
route.get("/search/getFeaturedTours", getFeaturedTours);
route.get("/search/getTourCount", getTourCount);

// ✅ Get tất cả tour (phân trang)
route.get("/", getAllTour);

// ✅ Get 1 tour
route.get("/:id", getSingleTour);

// ✅ Update tour
route.put("/:id", uploadCloud.single("photo"), verifyAdmin, updateTour);

// ✅ Delete tour
route.delete("/:id", verifyAdmin, deleteTour);

export default route;
