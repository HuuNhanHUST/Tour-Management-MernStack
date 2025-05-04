import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  console.log("🍪 Received cookies:", req.cookies); // Debug cookie gửi lên

  const token = req.cookies.accessToken;
  if (!token) {
    console.log("❌ Không tìm thấy accessToken trong cookie!");
    return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedUser) => {
    if (err) {
      console.log("❌ Token không hợp lệ:", err.message);
      return res.status(401).json({ success: false, message: "Token không hợp lệ!" });
    }

    req.user = decodedUser; // ✅ Gắn user đã decode vào request
    console.log("✅ Token hợp lệ, decoded user:", decodedUser);
    next();
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user) {
      next();
    } else {
      console.log("❌ Không xác thực được người dùng!");
      return res.status(401).json({ success: false, message: "Không xác thực được người dùng!" });
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      console.log("❌ Người dùng không phải admin!");
      return res.status(401).json({ success: false, message: "Bạn không phải admin!" });
    }
  });
};
