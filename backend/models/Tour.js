import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    photos: [
  {
    type: String,
  }
  ],
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    maxGroupSize: {
      type: Number,
      required: true,
    },

   minGroupSize: {
      type: Number,
      default: 2,
      required: true,
    },


    
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    currentBookings: {
      type: Number,
      default: 0,
      required: true,
    },
    reviews: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Review",
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },

    // ✅ THÊM MỚI PHẦN NGHIỆP VỤ

    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
      }
    ],

    transportation: {
      type: String, // Ví dụ: 'Máy bay + Xe du lịch'
    },

    activities: [
      {
        type: String, // Ví dụ: 'Tham quan', 'Team building', 'Tắm biển'
      }
    ],

    hotelInfo: {
      type: String, // Ví dụ: 'Khách sạn 4 sao khu vực trung tâm'
    },

    mealsIncluded: [
      {
        type: String, // Ví dụ: 'Bữa sáng', 'Bữa trưa buffet'
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Tour", tourSchema);
