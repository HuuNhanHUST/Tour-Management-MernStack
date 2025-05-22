import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';

// ✅ Tạo booking có kiểm tra chỗ và thời gian (an toàn) và thêm địa chỉ
export const createBooking = async (req, res) => {
  try {
    const {
      tourId,
      guestSize,
      fullName,
      phone,
      tourName,
      totalAmount,
      paymentMethod,
      bookAt,
      // Thêm địa chỉ
      province,
      district,
      ward,
      addressDetail,
    } = req.body;

    // ⛔ Kiểm tra số lượng khách hợp lệ
    if (!guestSize || guestSize <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng khách phải lớn hơn 0."
      });
    }

    // ⛔ Kiểm tra địa chỉ đầy đủ
    if (
      !province || !province.code || !province.name ||
      !district || !district.code || !district.name ||
      !ward || !ward.code || !ward.name ||
      !addressDetail || addressDetail.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin địa chỉ (tỉnh, huyện, xã, chi tiết)."
      });
    }

    // 🔍 Tìm tour theo ID
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại."
      });
    }

    // ⛔ Kiểm tra tour đã kết thúc chưa
    const today = new Date();
    if (today > new Date(tour.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Tour này đã kết thúc và không còn khả dụng."
      });
    }

    // ✅ Kiểm tra số chỗ còn lại
    const remaining = tour.maxGroupSize - tour.currentBookings;
    if (guestSize > remaining) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn lại ${remaining} chỗ trống.`
      });
    }

    // ✅ Tăng số người đã đặt và lưu tour
    tour.currentBookings += guestSize;
    await tour.save();

    // ✅ Tạo booking với địa chỉ
    const newBooking = new Booking({
      userId: req.user.id,
      userEmail: req.user.email,
      tourId,
      tourName,
      fullName,
      phone,
      guestSize,
      totalAmount,
      paymentMethod,
      bookAt,
      province,
      district,
      ward,
      addressDetail,
    });

    const savedBooking = await newBooking.save();

    res.status(200).json({
      success: true,
      message: "Đặt tour thành công!",
      data: savedBooking
    });
  } catch (error) {
    console.error("❌ Lỗi tạo booking:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo booking",
      error: error.message
    });
  }
};

// ✅ Lấy 1 booking theo ID
export const getBooking = async (req, res) => {
  try {
    const id = req.params.id;
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

// ✅ Lấy tất cả booking (admin)
export const getAllBookings = async (req, res) => {
  try {
    const books = await Booking.find().sort({ createdAt: -1 });

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
