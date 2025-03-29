import express from "express";
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

// Create new tour 
route.post('/',verifyAdmin, createTour);

// Update tour 
route.put('/:id',verifyAdmin, updateTour);

// Delete tour 
route.delete('/:id',verifyAdmin, deleteTour);

// Get single tour 
route.get('/:id', getSingleTour);

// Get all tours 
route.get('/', getAllTour);

// Get by search 
route.get('/search/getTourBySearch', getTourBySearch);

// Get featured tours 
route.get('/search/getFeaturedTours', getFeaturedTours);
// Get TourCount
route.get('/search/getTourCount', getTourCount);


export default route;
