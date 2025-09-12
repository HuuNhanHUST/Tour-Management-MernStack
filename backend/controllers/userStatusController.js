import UserStatus from "../models/UserStatus.js";

export const getAllUserStatuses = async (req, res) => {
  try {
    const statuses = await UserStatus.find().populate("userId", "username role");
    res.status(200).json({ success: true, data: statuses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy trạng thái người dùng" });
  }
};
