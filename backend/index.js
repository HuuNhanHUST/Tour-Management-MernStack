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
import locationRoute from "./router/location.js";
import favoriteRoute from './router/favorite.js';


dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// ✅ Tạo HTTP Server để tích hợp Socket.IO
const server = http.createServer(app);

// Tạo socket server với CORS cho frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // hoặc domain frontend
    credentials: true,
  },
});

// Map lưu trữ người dùng online (tuỳ chọn)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // Join room chatRoomId (userId)
  socket.on("joinRoom", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`✅ Socket ${socket.id} joined room ${chatRoomId}`);
    onlineUsers.set(chatRoomId.toString(), socket.id);
  });

  // Nhận tin nhắn từ client và phát tới room (ngoại trừ socket gửi)
  socket.on("sendMessage", (message) => {
    const { chatRoomId, senderId, text } = message;
    console.log(`📩 Message in room ${chatRoomId} from ${senderId}: ${text}`);

    // Phát cho tất cả trong room ngoại trừ socket gửi
    socket.to(chatRoomId).emit("receiveMessage", message);
  });

  // Xử lý ngắt kết nối
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    // Xoá user khỏi danh sách online
    for (const [key, value] of onlineUsers.entries()) {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log(`❌ Removed user ${key} from onlineUsers`);
        break;
      }
    }
  });
});


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



// ✅ Đăng ký các route RESTful

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/tour', tourRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/review', reviewRoute);
app.use('/api/v1/booking', bookingRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/chat', chatRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/location", locationRoute);
app.use('/api/v1/users', favoriteRoute);


// ✅ Route test
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// ✅ Khởi động server kèm Socket.IO
server.listen(port, () => {
  connectDB();
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
});



export { io }; // Nếu bạn cần dùng ở controller
