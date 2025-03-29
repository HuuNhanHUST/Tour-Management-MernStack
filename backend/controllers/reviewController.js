import Tour from "../models/Tour.js";
import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  const tourId = req.params.tourId;
  const { username, reviewText, rating } = req.body;

  if (!username || !reviewText || !rating) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin đánh giá!" });
  }

  try {
    const newReview = new Review({ username, reviewText, rating });
    const savedReview = await newReview.save();

    await Tour.findByIdAndUpdate(tourId, {
      $push: { reviews: savedReview._id },
    });

    res.status(200).json({
      success: true,
      message: "Gửi đánh giá thành công!",
      data: savedReview,
    });
  } catch (err) {
    console.error("Lỗi khi tạo đánh giá:", err);
    res.status(500).json({ success: false, message: "Gửi đánh giá thất bại." });
  }
};
