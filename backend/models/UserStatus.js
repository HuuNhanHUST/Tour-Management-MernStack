import mongoose from 'mongoose';
const userStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  socketId: { type: String },
}, { timestamps: true });

export default mongoose.model('UserStatus', userStatusSchema);
