import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  userEmail: { type: String },
  orderId: String,
  amount: Number,
  status: { type: String, enum: ["Pending", "Success", "Failed"], default: "Pending" },
  payType: { type: String, default: "MoMo" },
  createdAt: { type: Date, default: Date.now },
  tourName: { type: String },
fullName: { type: String },
phone: { type: String }

});

export default mongoose.model("Payment", PaymentSchema);
