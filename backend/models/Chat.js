import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,  // ✅ dùng ObjectId
    ref: "User",
    required: true,
  },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,  // ✅ dùng ObjectId
    ref: "User",
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