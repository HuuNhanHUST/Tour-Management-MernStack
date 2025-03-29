import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Đăng ký người dùng
export const register = async (req, res) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hash,
      photo: req.body.photo,
    });

    await newUser.save();
    res.status(200).json({ success: true, message: 'Đã tạo tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Tạo tài khoản thất bại. Vui lòng thử lại.' });
  }
};

// Đăng nhập người dùng
export const login = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    const { password, role, ...rest } = user._doc;

    // ✅ Thêm cả email vào token để dùng cho booking
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15d' }
    );

    // Gửi cookie và token
    res
    .cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'Lax',     // Hoặc 'None' nếu dùng HTTPS khác origin
      secure: false,       // true nếu bạn đang dùng HTTPS
      path: '/',
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 ngày
    })
    .status(200)
    .json({ success: true, data: { ...rest } });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Đăng nhập thất bại' });
  }
};
