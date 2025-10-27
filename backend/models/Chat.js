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
    index: true,  // ✅ Add index for faster queries
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

// ✅ Compound index for efficient room-based queries with sorting
chatSchema.index({ chatRoomId: 1, createdAt: 1 });

export default mongoose.model("Chat", chatSchema);