import mongoose from "mongoose";

const tourGuideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
    },
    photo: {
      type: String,
    },
    languages: [
      {
        type: String,
      },
    ],
    experience: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TourGuide", tourGuideSchema);
