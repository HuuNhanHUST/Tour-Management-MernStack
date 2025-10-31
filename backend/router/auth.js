import express from "express";
import passport from "../utils/passportFacebook.js";
import { register, login } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

// 👉 Đăng ký người dùng (email/password)
router.post("/register", register);

// 👉 Đăng nhập người dùng (email/password)
router.post("/login", login);

// 👉 Lấy thông tin người dùng từ token (cookie)
//git commit -m "SCRUM-13: Hoàn thành kiểm thử chức năng đăng nhập"
//git commit -m "SCRUM-13: Hoàn thành kiểm thử chức năng đăng nhập"
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// 👉 Gửi user đến Facebook để login
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

// 👉 Facebook gọi về sau login
router.get("/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "http://localhost:3000/login",
    session: false
  }),
  (req, res) => {
    const user = req.user;

    // ✅ Tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username, role: user.role || "user" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    // ✅ Gửi token qua cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000
    });

    // ✅ Chuyển hướng về frontend
    res.redirect("http://localhost:3000");
  }
);

// 🆕 👉 Logout: Xóa cookie accessToken
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    path: "/",
    sameSite: "Lax",
    httpOnly: true,
    secure: false,
  });

  res.status(200).json({ success: true, message: "Đã đăng xuất" });
});

export default router;
