import express from "express";
import passport from "../utils/passportFacebook.js";

const router = express.Router();

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

    // 👉 Tạo JWT và gửi về frontend bằng cookie
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000
    });

    // ✅ Redirect về trang chủ frontend
    res.redirect("http://localhost:3000");
  }
);

export default router;
