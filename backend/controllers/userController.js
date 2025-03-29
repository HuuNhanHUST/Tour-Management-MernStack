import User from '../models/User.js';

// Tạo mới User
export const createUser = async (req, res) => {
  const newUser = new User(req.body);
  try { 
    const savedUser = await newUser.save();
    res.status(200).json({ success: true, message: "Đã tạo người dùng", data: savedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Tạo thất bại" });
  }
};

// Cập nhật User
export const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const updatedUser = await User.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    res.status(200).json({ success: true, message: "Cập nhật thành công", data: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Cập nhật thất bại" });
  }
};

// Xoá User
export const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Xoá thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xoá thất bại" });
  }
};

// Lấy 1 User
export const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy dữ liệu user" });
  }
};

// Lấy tất cả User
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true,message:"Thành Công", data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy danh sách người dùng" });
  }
};
