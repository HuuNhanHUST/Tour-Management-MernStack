import express from "express";
import { sendMessage, getMessages } from "../controllers/chatController.js";
import { verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

router.post("/send", verifyUser, sendMessage); // 📨 Gửi tin nhắn
router.get("/history", verifyUser, getMessages); // 📥 Lấy lịch sử chat

export default router;
