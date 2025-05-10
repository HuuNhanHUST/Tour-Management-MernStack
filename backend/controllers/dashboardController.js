import User from '../models/User.js';
import Tour from '../models/Tour.js';
import Booking from '../models/Booking.js';

// 🔹 Tổng số người dùng
export const getUserCount = async (req, res) => {
  try {
    const count = await User.estimatedDocumentCount();
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng người dùng' });
  }
};

// 🔹 Tổng số tour
export const getTourCount = async (req, res) => {
  try {
    const count = await Tour.estimatedDocumentCount();
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng tour' });
  }
};

// 🔹 Tổng số đơn hàng
export const getBookingCount = async (req, res) => {
  try {
    const count = await Booking.estimatedDocumentCount();
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng đơn hàng' });
  }
};

// 🔹 Tổng doanh thu
export const getTotalRevenue = async (req, res) => {
  try {
    const bookings = await Booking.find();
    const total = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    res.status(200).json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi tính doanh thu' });
  }
};

// 🔹 Tổng hợp thống kê dashboard (gọi 1 lần duy nhất)
export const getDashboardStats = async (req, res) => {
  try {
    const [userCount, tourCount, bookingCount, bookings] = await Promise.all([
      User.estimatedDocumentCount(),
      Tour.estimatedDocumentCount(),
      Booking.estimatedDocumentCount(),
      Booking.find()
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        users: userCount,
        tours: tourCount,
        orders: bookingCount,
        revenue: totalRevenue
      }
    });
  } catch (err) {
    console.error("Lỗi dashboard:", err);
    res.status(500).json({ success: false, message: 'Lỗi khi tổng hợp dữ liệu dashboard' });
  }
};
