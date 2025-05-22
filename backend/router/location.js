// backend/router/location.js
import express from "express";
import axios from "axios";

const router = express.Router();

// Lấy danh sách tỉnh/thành (depth=1)
router.get("/provinces", async (req, res) => {
  try {
    const response = await axios.get("https://provinces.open-api.vn/api/?depth=1");
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Lấy tỉnh thất bại" });
  }
});

// Lấy districts của tỉnh (depth=2)
router.get("/districts/:provinceCode", async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    res.json(response.data.districts);
  } catch (err) {
    res.status(500).json({ message: "Lấy huyện thất bại" });
  }
});

// Lấy wards của huyện
router.get("/wards/:districtCode", async (req, res) => {
  try {
    const { districtCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    res.json(response.data.wards);
  } catch (err) {
    res.status(500).json({ message: "Lấy xã thất bại" });
  }
});

export default router;
