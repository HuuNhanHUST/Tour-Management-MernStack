import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  userEmail: { type: String },
  tourId: { type: mongoose.Types.ObjectId, ref: "Tour", required: true }, // ✅ thêm
  quantity: { type: Number, required: true }, // ✅ thêm
  orderId: String,
  amount: Number,
  status: { type: String, enum: ["Pending", "Success", "Failed"], default: "Pending" },
  payType: { type: String, default: "MoMo" },
  createdAt: { type: Date, default: Date.now },
  tourName: { type: String },
fullName: { type: String },
phone: { type: String },
province: {
  code: String,
  name: String,
},
district: {
  code: String,
  name: String,
},
ward: {
  code: String,
  name: String,
},
addressDetail: String,

});

export default mongoose.model("Payment", PaymentSchema);
