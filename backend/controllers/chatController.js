import Chat from '../models/Chat.js';

// 📨 Gửi tin nhắn và lưu
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    const newMessage = new Chat({ senderId, receiverId, message });
    const saved = await newMessage.save();

    res.status(200).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gửi tin nhắn thất bại" });
  }
};

// 📥 Lấy tất cả tin nhắn giữa 2 người dùng
export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    const messages = await Chat.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ]
    }).sort({ createdAt: 1 }); // Sắp xếp theo thời gian gửi

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy tin nhắn" });
  }
};
