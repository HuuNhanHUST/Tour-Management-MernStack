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

// 🔹 OPTION A: Tổng số đơn hàng đã thanh toán (using paymentStatus)
export const getBookingCount = async (req, res) => {
  try {
    const count = await Booking.countDocuments({ paymentStatus: "Confirmed" });
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số lượng đơn hàng' });
  }
};

// 🔹 OPTION A: Tổng doanh thu từ các đơn đã thanh toán
export const getTotalRevenue = async (req, res) => {
  try {
    const bookings = await Booking.find({ paymentStatus: "Confirmed" });
    const total = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    res.status(200).json({ success: true, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi tính doanh thu' });
  }
};

// 🔹 OPTION A: Tổng hợp toàn bộ thống kê dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const [userCount, tourCount, bookingCount, bookings] = await Promise.all([
      User.estimatedDocumentCount(),
      Tour.estimatedDocumentCount(),
      Booking.countDocuments({ paymentStatus: "Confirmed" }),
      Booking.find({ paymentStatus: "Confirmed" })
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

// 🔹 OPTION A: Thống kê số lượng đơn hàng theo khoảng thời gian
export const getOrderStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate và endDate là bắt buộc' });
    }

    // Convert query params to Date objects with full day range (UTC)
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Aggregate bookings by date
    const orders = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          paymentStatus: "Confirmed", // ✅ OPTION A: Use paymentStatus
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("Lỗi khi lấy thống kê đơn hàng theo ngày:", err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu đơn hàng' });
  }
};

// 🔹 OPTION A: Thống kê doanh thu theo khoảng thời gian
export const getRevenueStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate và endDate là bắt buộc' });
    }

    // Convert query params to Date objects with full day range (UTC)
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Aggregate revenue by date
    const revenue = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          paymentStatus: "Confirmed", // ✅ OPTION A: Use paymentStatus
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          date: "$_id",
          total: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({ success: true, data: revenue });
  } catch (err) {
    console.error("Lỗi khi lấy thống kê doanh thu theo ngày:", err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu doanh thu' });
  }
};