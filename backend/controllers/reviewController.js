import Tour from "../models/Tour.js";
import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  const tourId = req.params.tourId;
  const { reviewText, rating } = req.body;
  const username = req.user?.username;

  if (!username || !reviewText || !rating) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin đánh giá!" });
  }

  try {
    const tour = await Tour.findById(tourId).populate('reviews');
    const existingReview = tour.reviews.find(
      (r) => r.username === username
    );

    if (existingReview) {
      // ✅ Nếu đã review, thì cập nhật lại review cũ
      const updatedReview = await Review.findByIdAndUpdate(
        existingReview._id,
        { reviewText, rating },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Cập nhật đánh giá thành công!",
        data: updatedReview
      });
    }

    // ✅ Nếu chưa từng review, tạo mới
    const newReview = new Review({ username, reviewText, rating });
    const savedReview = await newReview.save();

    tour.reviews.push(savedReview._id);
    await tour.save();

    res.status(200).json({
      success: true,
      message: "Gửi đánh giá thành công!",
      data: savedReview,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo/cập nhật đánh giá:", err);
    res.status(500).json({ success: false, message: "Gửi đánh giá thất bại." });
  }
};
