import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
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
      type: String, // ✅ nên để là String vì số điện thoại có thể bắt đầu bằng 0
      required: true,
    },
    bookAt: {
      type: Date,
      required: true, // ✅ nên bật lại để đảm bảo dữ liệu hợp lệ
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
