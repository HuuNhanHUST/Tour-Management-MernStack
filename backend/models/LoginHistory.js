import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 👈 phải trùng tên với model User
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    location: String,
    isSuspicious: Boolean,
    loginAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoginHistory", loginHistorySchema);
