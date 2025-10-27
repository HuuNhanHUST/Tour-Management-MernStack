import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./utils/passportFacebook.js";

import http from "http";
import { Server } from "socket.io";

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
import userStatusRoute from './router/userStatus.js';
import loginHistoryRoute from './router/loginHistory.js';
import pricingRoute from './router/pricing.js';
import UserStatus from './models/UserStatus.js';
import { startCleanupJob } from './utils/cleanupPendingBookings.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("👁 userId from socket:", userId);

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} online`);

    UserStatus.findOneAndUpdate(
      { userId },
      {
        isOnline: true,
        lastSeen: new Date(),
        socketId: socket.id,
      },
      { upsert: true, new: true }
    )
      .then((doc) => {
        console.log("💾 Updated user status:", doc);
        // ✅ Gửi thông báo realtime đến tất cả clients
        io.emit("userStatusUpdate", {
          userId,
          isOnline: true,
          lastSeen: doc.lastSeen,
        });
      })
      .catch((err) => console.error("❌ Mongo update error:", err));
  } else {
    console.warn("⚠️ Không có userId hợp lệ từ client.");
  }

  socket.on("joinRoom", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`✅ Socket ${socket.id} joined room ${chatRoomId}`);
  });

  socket.on("sendMessage", (message) => {
    const { chatRoomId, text } = message;
    
    // ✅ SECURITY FIX: Override senderId from authenticated socket connection
    // This prevents clients from faking senderId
    const authenticatedUserId = socket.handshake.query.userId;
    
    if (!authenticatedUserId || !mongoose.Types.ObjectId.isValid(authenticatedUserId)) {
      console.error("❌ Invalid userId in socket - message rejected");
      return;
    }
    
    // Override senderId with authenticated userId
    const secureMessage = {
      ...message,
      senderId: authenticatedUserId,
      chatRoomId,
      text
    };
    
    console.log(`📩 Message in room ${chatRoomId} from ${authenticatedUserId}: ${text}`);
    
    // Broadcast to everyone in the room INCLUDING sender
    io.to(chatRoomId).emit("receiveMessage", secureMessage);
  });

  socket.on("disconnect", async () => {
    console.log("🔴 Socket disconnected:", socket.id);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ Removed user ${userId} from online`);

        await UserStatus.findOneAndUpdate(
          { userId },
          {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null,
          },
          { new: true }
        )
          .then((doc) => {
            // ✅ Gửi cập nhật offline cho tất cả client
            io.emit("userStatusUpdate", {
              userId,
              isOnline: false,
              lastSeen: doc.lastSeen,
            });
          })
          .catch((err) =>
            console.error("❌ Mongo update error (disconnect):", err)
          );

        break;
      }
    }
  });
});

// CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'facebooklogin_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

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

// ROUTES
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/tour', tourRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/review', reviewRoute);
app.use('/api/v1/booking', bookingRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/chat', chatRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/location', locationRoute);
app.use('/api/v1/users', favoriteRoute);
app.use('/api/user-status', userStatusRoute);
app.use('/api/login-history', loginHistoryRoute);
app.use('/api/v1/pricing', pricingRoute);
app.get("/", (req, res) => {
  res.send("✅ API đang hoạt động");
});

// START SERVER
server.listen(port, () => {
  connectDB();
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
  
  // ✅ Start cleanup job for pending bookings
  startCleanupJob();
});

export { io };
