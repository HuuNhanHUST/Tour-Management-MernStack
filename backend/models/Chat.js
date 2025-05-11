import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  senderId: {
    type: String,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: String, // hoặc ObjectId nếu admin cũng lưu trong User
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
