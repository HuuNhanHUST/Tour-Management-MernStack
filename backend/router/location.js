// backend/router/location.js
import express from "express";
import { provinces, getDistrictsOfProvince, getWardsOfDistrict } from "../data/vietnamProvinces.js";

const router = express.Router();

// Lấy danh sách tỉnh/thành từ dữ liệu cập nhật mới
router.get("/provinces", (req, res) => {
  try {
    // Sử dụng dữ liệu đã cập nhật mới
    res.json(provinces);
  } catch (err) {
    res.status(500).json({ message: "Lấy tỉnh thất bại" });
  }
});

// Lấy districts của tỉnh từ dữ liệu cập nhật
router.get("/districts/:provinceCode", (req, res) => {
  try {
    const { provinceCode } = req.params;
    // Sử dụng hàm helper để lấy quận/huyện từ dữ liệu cập nhật
    const districts = getDistrictsOfProvince(provinceCode);
    if (districts && districts.length > 0) {
      res.json(districts);
    } else {
      res.status(404).json({ message: "Không tìm thấy tỉnh/thành phố" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lấy huyện thất bại" });
  }
});

// Lấy wards của huyện từ dữ liệu cập nhật
router.get("/wards/:districtCode", (req, res) => {
  try {
    const { districtCode } = req.params;
    // Sử dụng hàm helper để lấy xã/phường từ dữ liệu cập nhật
    const wards = getWardsOfDistrict(districtCode);
    if (wards && wards.length > 0) {
      res.json(wards);
    } else {
      res.status(404).json({ message: "Không tìm thấy quận/huyện" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lấy xã thất bại" });
  }
});

export default router;
