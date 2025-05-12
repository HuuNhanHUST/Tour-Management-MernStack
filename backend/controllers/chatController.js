import Chat from '../models/Chat.js';
import User from '../models/User.js';

// 👇 Gán _id thật của admin tại đây
const ADMIN_ID = "6803343a6c0047c5fa9b60c6"; // ✅ thay cho "admin"

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
    const userId = req.user.id;

    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: ADMIN_ID },
        { senderId: ADMIN_ID, receiverId: userId }
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
    const senderIds = await Chat.distinct("senderId", { receiverId: ADMIN_ID });

    // Lọc ra những ID khác ADMIN_ID (tránh lỗi khi admin gửi trước)
    const validUserIds = senderIds.filter(id => String(id) !== ADMIN_ID);

    const users = await User.find({ _id: { $in: validUserIds } }).select("fullName email");

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách người dùng chat" });
  }
};

// Admin lấy lịch sử với user cụ thể
export const getMessagesWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const messages = await Chat.find({
      $or: [
        { senderId: adminId, receiverId: userId },
        { senderId: userId, receiverId: adminId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("❌ Lỗi khi lấy tin nhắn với user:", err.message);
    res.status(500).json({ message: "Không thể lấy tin nhắn" });
  }
};