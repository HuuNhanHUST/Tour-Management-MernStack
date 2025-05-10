import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./utils/passportFacebook.js";

// Import routes
import authRoute from './router/auth.js';
import tourRoute from './router/tour.js';
import userRoute from './router/user.js';
import reviewRoute from './router/review.js';
import bookingRoute from './router/booking.js';
import paymentRoute from './router/payment.js'; // ✅ vẫn giữ nguyên

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// ✅ CORS cấu hình đúng để frontend gửi cookie
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

// ✅ Bổ sung nếu cần header đầy đủ
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());
app.use(cookieParser());

// ✅ Session & Passport cho Facebook Login
app.use(session({
  secret: 'facebooklogin_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// ✅ Kết nối MongoDB
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

// ✅ Routes (sau CORS)
app.use('/api/payment', paymentRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/tour', tourRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/review', reviewRoute);
app.use('/api/v1/booking', bookingRoute);

// ✅ Route test
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// ✅ Start server
app.listen(port, () => {
  connectDB();
  console.log(`🚀 Server đang chạy tại port ${port}`);
});
