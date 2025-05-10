import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  orderId: String,
  amount: Number,
  status: { type: String, enum: ["Pending", "Success", "Failed"], default: "Pending" },
  payType: { type: String, default: "MoMo" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", PaymentSchema);
