import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    userEmail: {
      type: String,
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Tour"
    },
    tourName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    guestSize: {
      type: Number,
      required: true,
      min: 1,
    },
    phone: {
      type: String,
      required: true,
    },
    bookAt: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentMethod: {
      type: String,
      default: "Cash", // hoặc "MoMo"
      enum: ["Cash", "MoMo"]
    },
province: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
district: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
ward: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
addressDetail: {
  type: String,
  required: true,
}
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
