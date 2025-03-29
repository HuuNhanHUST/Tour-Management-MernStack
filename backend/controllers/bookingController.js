import Booking from '../models/Booking.js';

// Tạo mới booking
export const createBooking = async (req, res) => {
  try {
    const newBooking = new Booking({
      ...req.body,
      userId: req.user.id,           // ✅ từ JWT
      userEmail: req.user.email
    });

    const savedBooking = await newBooking.save();

    res.status(200).json({
      success: true,
      message: "Tour của bạn đã được đặt.",
      data: savedBooking
    });
  } catch (error) {
    console.error("Lỗi tạo booking:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ.",
      error: error.message
    });
  }
};

// Lấy 1 booking theo ID
export const getBooking = async (req, res) => {
  const id = req.params.id;
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking"
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy booking thành công",
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message
    });
  }
};

// Lấy tất cả booking (admin)
export const getAllBookings = async (req, res) => {
  try {
    const books = await Booking.find();

    res.status(200).json({
      success: true,
      message: "Lấy tất cả booking thành công",
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách booking",
      error: error.message
    });
  }
};
