import express from "express";
import uploadCloud from "../middleware/uploadCloud.js";
import Tour from '../models/Tour.js';
import {
  createTour,
  deleteTour,
  getAllTour,
  getFeaturedTours,
  getSingleTour,
  getTourBySearch,
  getTourCount,
  updateTour,
  getTourCreationData
} from "../controllers/tourController.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const route = express.Router();

// ✅ Create tour (Cloudinary upload ảnh chính + ảnh phụ)
route.post(
  "/",
  uploadCloud.fields([
    { name: "photo", maxCount: 1 },
    { name: "photos", maxCount: 10 }
  ]),
  verifyAdmin,
  createTour
);

// ✅ Get toàn bộ tour (admin)
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

// ✅ Get dữ liệu tạo tour (hướng dẫn viên, v.v.)
route.get("/creation-data", verifyAdmin, getTourCreationData);

// ✅ Get 1 tour
route.get("/:id", getSingleTour);

// ✅ Update tour (cho phép cập nhật ảnh)
route.put(
  "/:id",
  uploadCloud.fields([
    { name: "photo", maxCount: 1 },
    { name: "photos", maxCount: 10 }
  ]),
  verifyAdmin,
  updateTour
);

// ✅ Delete tour
route.delete("/:id", verifyAdmin, deleteTour);

export default route;
