import express from "express";
import {
  createTourGuide,
  updateTourGuide,
  deleteTourGuide,
  getSingleTourGuide,
  getAllTourGuides,
} from "../controllers/tourGuideController.js";
import uploadCloud from "../middleware/uploadCloud.js";

const router = express.Router();

// Create new tour guide
router.post("/", uploadCloud.single("photo"), createTourGuide);

// Update tour guide
router.put("/:id", uploadCloud.single("photo"), updateTourGuide);

// Delete tour guide
router.delete("/:id", deleteTourGuide);

// Get single tour guide
router.get("/:id", getSingleTourGuide);

// Get all tour guides
router.get("/", getAllTourGuides);

export default router;