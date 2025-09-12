// Script to reset the tour's currentBookings
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded .env from backend folder');
} else {
  dotenv.config();
  console.log('Loaded .env from root folder');
}

async function resetTourBookings() {
  try {
    // Connect to MongoDB
    const mongoURI = "mongodb+srv://nhansever9999:z5MHBvDVtwenvPYz@cluster0.evva3v7.mongodb.net/tours_booking?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Define a simple tour schema
    const tourSchema = new mongoose.Schema({
      currentBookings: Number,
      maxGroupSize: Number,
      title: String
    });
    
    // Create the Tour model
    const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);
    
    // Find the tour by ID
    const tourId = '6832d5204ee51c59bfe85bb6'; // The ID from your error message
    const tour = await Tour.findById(tourId);
    
    if (!tour) {
      console.log('Tour not found');
      return;
    }
    
    console.log('Current tour state:', {
      title: tour.title,
      currentBookings: tour.currentBookings,
      maxGroupSize: tour.maxGroupSize,
      availableSpots: tour.maxGroupSize - tour.currentBookings
    });
    
    // Reset the currentBookings to 0 or a lower number
    const originalBookings = tour.currentBookings;
    tour.currentBookings = 0; // Reset to 0
    await tour.save();
    
    console.log(`✅ Reset tour bookings from ${originalBookings} to 0`);
    console.log('Tour now has all spots available');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
resetTourBookings();
