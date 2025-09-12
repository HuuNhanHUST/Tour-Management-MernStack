import express from 'express';
import { getLoginHistory } from "../controllers/userController.js";
import {
  createUser,
  updateUser,
  deleteUser,
  getSingleUser,
  getAllUsers
} from '../controllers/userController.js' ;

const router = express.Router();
import { verifyAdmin, verifyUser } from '../utils/verifyToken.js';
const verifyAdminOrSelf = (req, res, next) => {
  verifyUser(req, res, () => {
    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      next();
    } else {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập!" });
    }
  });
};

router.put('/:id',verifyUser, updateUser);
router.delete('/:id',verifyUser, deleteUser);
router.get('/:id',verifyUser, getSingleUser);
router.get('/',verifyAdmin, getAllUsers);
router.get("/login-history", verifyAdmin, getLoginHistory);
export default router;
