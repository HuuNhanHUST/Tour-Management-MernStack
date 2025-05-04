import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ Đăng nhập người dùng
export const login = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // 👉 Nếu user có password mới so sánh, còn không thì skip (login Facebook không có password)
    if (user.password) {
      const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
      }
    }

    const { password, role, ...rest } = user._doc;

    // ✅ Tạo token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15d' }
    );

    // ✅ Đặt cookie chứa token
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'Lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { ...rest }
    });

  } catch (err) {
    console.error("❌ Lỗi khi đăng nhập:", err);
    res.status(500).json({ success: false, message: 'Đăng nhập thất bại' });
  }
};
