import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  console.log("Received cookies:", req.cookies);
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Token không hợp lệ!" });
    }

    req.user = decodedUser;
    next();
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user) {
      next();
    } else {
      return res.status(401).json({ success: false, message: "Không xác thực được người dùng!" });
    }
  });
};


// Chỉ admin được phép
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      return res.status(401).json({ success: false, message: "Bạn không phải admin!" });
    }
  });
};
