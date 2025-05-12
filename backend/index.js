import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./utils/passportFacebook.js";

import http from "http"; // ✅ Thêm
import { Server } from "socket.io"; // ✅ Thêm

// Import routes
import authRoute from './router/auth.js';
import tourRoute from './router/tour.js';
import userRoute from './router/user.js';
import reviewRoute from './router/review.js';
import bookingRoute from './router/booking.js';
import paymentRoute from './router/payment.js';
import dashboardRoute from "./router/dashboard.js";
import chatRoute from "./router/chat.js";


dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// ✅ Tạo HTTP Server để tích hợp Socket.IO
const server = http.createServer(app);

// Tạo socket server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // hoặc domain FE
    credentials: true,
  },
});

// ✅ Lưu người dùng đang online
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // ✅ Lưu người dùng đang online (dùng string key)
socket.on("addUser", (userId) => {
  if (userId) {
    onlineUsers.set(userId.toString(), socket.id); // 🟢 convert key thành string
    console.log("✅ addUser:", userId.toString(), "→", socket.id);
  }
});

// ✅ Nhận tin nhắn từ client và chuyển cho người nhận
socket.on("sendMessage", (message) => {
  const { senderId, receiverId, text } = message;
  const receiverSocketId = onlineUsers.get(receiverId.toString()); // 🟢 dùng toString

  console.log("📩 Message:", { from: senderId, to: receiverId, text });
  console.log("🧭 onlineUsers:", [...onlineUsers.entries()]);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receiveMessage", message);
    console.log("✅ Đã gửi tới socket:", receiverSocketId);
  } else {
    console.log("❌ Người nhận chưa online:", receiverId);
  }
});


  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log("🔴 Disconnected:", userId);
        break;
      }
    }
  });
});
export { io }; // Nếu bạn cần dùng ở controller

// ✅ CORS cho frontend truy cập (localhost:3000)
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// ✅ Header cho cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());
app.use(cookieParser());

// ✅ Session cho Passport
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

// ✅ Public static file ảnh
app.use("/uploads", express.static("uploads"));

// ✅ Đăng ký các route RESTful

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/tour', tourRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/review', reviewRoute);
app.use('/api/v1/booking', bookingRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/chat', chatRoute);
app.use("/api/v1/payment", paymentRoute);
// ✅ Route test
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// ✅ Khởi động server kèm Socket.IO
server.listen(port, () => {
  connectDB();
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
});
