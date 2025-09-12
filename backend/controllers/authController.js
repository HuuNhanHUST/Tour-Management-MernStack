import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import LoginHistory from "../models/LoginHistory.js";

// Lấy IP client
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
};

// Ghi lịch sử đăng nhập
const recordLoginHistory = async (req, userId) => {
  const ip = getClientIP(req);
  const ua = req.headers["user-agent"];
  const lastLogin = await LoginHistory.findOne({ userId }).sort({ loginAt: -1 });
  const isSuspicious = lastLogin && lastLogin.ipAddress !== ip;

  await LoginHistory.create({
    userId,
    ipAddress: ip,
    userAgent: ua,
    location: "VN", // nếu dùng geoIP có thể thay đổi
    isSuspicious
  });
};

// ----------------- Đăng ký -----------------
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPwd });
    await newUser.save();

    res.status(200).json({ success: true, message: "Đăng ký thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Đăng ký thất bại", error: err.message });
  }
};

// ----------------- Đăng nhập -----------------
export const login = async (req, res) => {
  const email = req.body.email;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (user.password) {
      const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, message: "Sai email hoặc mật khẩu" });
      }
    }

    const { password, ...rest } = user._doc;

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // chuyển thành true nếu dùng HTTPS
      sameSite: "Lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    // ✅ Ghi lịch sử đăng nhập
    await recordLoginHistory(req, user._id);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { ...rest },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Đăng nhập thất bại",
      error: err.message,
    });
  }
};
