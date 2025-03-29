import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import tourRoute from './router/tour.js';
import userRoute from './router/user.js';
import authRoute from './router/auth.js';
import reviewRoute from './router/review.js';
import bookingRoute from './router/booking.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;
const corsOptions ={
  origin:true,
  credentials:true
}
// Kết nối database
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB database connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/tour', tourRoute)
app.use('/api/v1/user', userRoute)
app.use('/api/v1/review', reviewRoute)
app.use('/api/v1/booking', bookingRoute)

// Route test
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// Start server
app.listen(port, () => {
  connectDB();
  console.log("🚀 Server đang chạy tại port", port);
});
