import express from "express";
import { verifyUser, verifyAdmin } from "../utils/verifyToken.js";
import {
  sendMessage,
  getMessagesByRoom,
  getChatRoomsForAdmin,
  getUserInfoByChatRoomId
} from "../controllers/chatController.js";

const router = express.Router();

// Gửi tin nhắn trong chatRoom
router.post("/send", verifyUser, sendMessage);

// Lấy lịch sử chat theo chatRoomId
router.get("/history/:chatRoomId", verifyUser, getMessagesByRoom);

// Admin lấy danh sách chatRooms (tức user chat)
router.get("/chatrooms", verifyAdmin, getChatRoomsForAdmin);

// Admin lấy thông tin user theo chatRoomId
router.get("/user/:chatRoomId", verifyAdmin, getUserInfoByChatRoomId);

export default router;
