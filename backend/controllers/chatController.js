import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Gửi tin nhắn vào phòng chat (chatRoomId)
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { chatRoomId, text } = req.body;

    if (!text?.trim() || !chatRoomId) {
      return res.status(400).json({ success: false, message: "Thiếu chatRoomId hoặc tin nhắn trống" });
    }

    const newMessage = new Chat({
      senderId,
      chatRoomId,
      text,
      createdAt: new Date()
    });

    const saved = await newMessage.save();

    // Lấy thông tin sender (role + username)
    const senderUser = await User.findById(senderId).select("role username");

    const result = {
      ...saved._doc,
      senderRole: senderUser?.role || "user",
      senderName: senderUser?.username || "Người dùng"
    };

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Lỗi gửi tin nhắn:", err);
    res.status(500).json({ success: false, message: "Lỗi gửi tin nhắn" });
  }
};

// Lấy lịch sử chat trong phòng chat theo chatRoomId, kèm thông tin role + username sender
export const getMessagesByRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    if (!chatRoomId) {
      return res.status(400).json({ success: false, message: "chatRoomId là bắt buộc" });
    }

    const messages = await Chat.find({ chatRoomId })
      .sort({ createdAt: 1 })
      .lean();

    const senderIds = [...new Set(messages.map(m => m.senderId))];

    const users = await User.find({ _id: { $in: senderIds } }).select("role username");
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = { role: u.role, name: u.username };
    });

    const messagesWithInfo = messages.map(msg => ({
      ...msg,
      senderRole: userMap[msg.senderId.toString()]?.role || "user",
      senderName: userMap[msg.senderId.toString()]?.name || "Người dùng"
    }));

    res.status(200).json({ success: true, data: messagesWithInfo });
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    res.status(500).json({ success: false, message: "Không thể lấy lịch sử chat" });
  }
};

// Lấy danh sách chatRoom (danh sách user đã từng chat) cho admin
export const getChatRoomsForAdmin = async (req, res) => {
  try {
    const chatRooms = await Chat.aggregate([
      { $group: { _id: "$chatRoomId" } },
      {
        $lookup: {
          from: "users",                     // 👈 tên collection trong MongoDB
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          user: {
            username: "$user.username",
            email: "$user.email"
          }
        }
      },
{ $sort: { _id: -1 } }
    ]);

    res.status(200).json({ success: true, data: chatRooms });
  } catch (err) {
    console.error("Lỗi lấy danh sách chatRoom:", err);
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách chatRoom" });
  }
};


// Lấy thông tin user theo chatRoomId (chatRoomId == userId)
export const getUserInfoByChatRoomId = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const user = await User.findById(chatRoomId).select("username email");

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("Lỗi lấy thông tin user:", err);
    res.status(500).json({ success: false, message: "Lỗi lấy thông tin user" });
  }
};