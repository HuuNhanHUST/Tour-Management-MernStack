import LoginHistory from '../models/LoginHistory.js';
import User from '../models/User.js';

const logLoginMiddleware = async (req, res, next) => {
  try {
    const ip = req.ip;
    const device = req.headers['user-agent'];
    const user = await User.findById(req.user.id);

    const abnormal = user.lastLoginIP !== ip || user.lastLoginDevice !== device;

    await LoginHistory.create({
      userId: user._id,
      ipAddress: ip,
      deviceInfo: device,
      abnormal
    });

    await User.findByIdAndUpdate(user._id, {
      lastLoginIP: ip,
      lastLoginDevice: device
    });

    next();
  } catch (err) {
    console.error("Login history error:", err);
    next();
  }
};

export default logLoginMiddleware;
