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

// ✅ Cấu hình Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

// ✅ Biến toàn cục lưu người dùng online
const onlineUsers = new Map();

// ✅ Socket.IO sự kiện kết nối
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Lưu user khi họ đăng nhập
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("✅ Online users:", [...onlineUsers.entries()]);
  });

  // Gửi tin nhắn đến user cụ thể
  socket.on("sendMessage", ({ senderId, receiverId, content }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        senderId,
        content,
        timestamp: Date.now()
      });
    }
  });

  // Xử lý ngắt kết nối
  socket.on("disconnect", () => {
    for (let [key, value] of onlineUsers.entries()) {
      if (value === socket.id) {
        onlineUsers.delete(key);
        break;
      }
    }
    console.log("🔴 Socket disconnected:", socket.id);
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
app.use('/api/payment', paymentRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/tour', tourRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/review', reviewRoute);
app.use('/api/v1/booking', bookingRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/chat', chatRoute);
// ✅ Route test
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// ✅ Khởi động server kèm Socket.IO
server.listen(port, () => {
  connectDB();
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
});
