import express from "express";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import {
  sendMessage,
  getMessages,
  getChatUsers,
  getMessagesWithUser
} from "../controllers/chatController.js";

const router = express.Router();

// Gửi tin nhắn (admin hoặc user)
router.post("/send", verifyUser, sendMessage);

// User xem lịch sử với admin
router.get("/history", verifyUser, getMessages);

// Admin xem lịch sử với 1 user cụ thể
router.get("/admin/:userId", verifyAdmin, getMessagesWithUser);

// Admin xem danh sách user đã từng chat
router.get("/users", verifyAdmin, getChatUsers);

export default router;
