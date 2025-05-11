import Chat from '../models/Chat.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Gửi tin nhắn (cả admin và user)
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Tin nhắn rỗng!" });
    }

    const newMessage = new Chat({ senderId, receiverId, text });
    const saved = await newMessage.save();

    res.status(200).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi gửi tin nhắn" });
  }
};

// Lịch sử chat của user đang đăng nhập với admin
export const getMessages = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const adminId = "admin";

    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy tin nhắn" });
  }
};

// Lấy danh sách người dùng đã gửi tin nhắn tới admin
export const getChatUsers = async (req, res) => {
  try {
    const senderIds = await Chat.distinct("senderId", { receiverId: "admin" });
    const users = await User.find({ _id: { $in: senderIds } }).select("fullName email");

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách người dùng chat" });
  }
};

// Admin lấy lịch sử với user cụ thể
export const getMessagesWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id; // 👈 chính là admin đang đăng nhập

    const messages = await Chat.find({
      $or: [
        { senderId: adminId, receiverId: userId },
        { senderId: userId, receiverId: adminId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Lỗi khi lấy tin nhắn với user:", err.message);
    res.status(500).json({ message: "Không thể lấy tin nhắn" });
  }
};