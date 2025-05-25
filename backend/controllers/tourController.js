import Tour from '../models/Tour.js';

// ✅ Hàm hỗ trợ parse JSON từ FormData
const parseJSONFields = (body) => {
  const fieldsToParse = ['activities', 'mealsIncluded', 'itinerary', 'photos'];
  fieldsToParse.forEach(field => {
    if (body[field] && typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch (e) {
        console.warn(`❗ Không parse được ${field}:`, e.message);
        body[field] = [];
      }
    }
  });
};

// ✅ Tạo mới Tour
export const createTour = async (req, res) => {
  try {
    parseJSONFields(req.body);

    const {
      title,
      city,
      address,
      distance,
      desc,
      price,
      maxGroupSize,
      minGroupSize,
      featured,
      startDate,
      endDate,
      transportation,
      hotelInfo,
      activities,
      mealsIncluded,
      itinerary,
    } = req.body;

    const photo = req.files?.photo?.[0]?.path || "";
    const photos = req.files?.photos?.map(file => file.path) || [];

    const newTour = new Tour({
      title,
      city,
      address,
      distance: Number(distance),
      desc,
      price: Number(price),
      maxGroupSize: Number(maxGroupSize),
      minGroupSize: Number(minGroupSize),
      featured: featured === "true" || featured === true,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      photo,
      photos,
      transportation,
      hotelInfo,
      activities,
      mealsIncluded,
      itinerary
    });

    const savedTour = await newTour.save();

    res.status(200).json({
      success: true,
      message: "Đã Tạo Thành Công",
      data: savedTour,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo tour:", err);
    res.status(500).json({
      success: false,
      message: "Tạo Thất Bại. Hãy thử lại",
    });
  }
};

// ✅ Cập nhật Tour
export const updateTour = async (req, res) => {
  const id = req.params.id;

  try {
    parseJSONFields(req.body);

    const {
      title,
      city,
      address,
      distance,
      desc,
      price,
      maxGroupSize,
      minGroupSize,
      featured,
      photo: oldPhoto,
      photos: oldPhotos,
      startDate,
      endDate,
      transportation,
      hotelInfo,
      activities,
      mealsIncluded,
      itinerary
    } = req.body;

    const photo = req.files?.photo?.[0]?.path || oldPhoto;
    const newPhotos = req.files?.photos?.map(f => f.path) || [];
    const oldPhotosParsed = Array.isArray(oldPhotos) ? oldPhotos : JSON.parse(oldPhotos || "[]");
    const photos = [...oldPhotosParsed, ...newPhotos];

    const updatedData = {
      title,
      city,
      address,
      distance: Number(distance),
      desc,
      price: Number(price),
      maxGroupSize: Number(maxGroupSize),
      minGroupSize: Number(minGroupSize),
      featured: featured === "true" || featured === true,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      photo,
      photos,
      transportation,
      hotelInfo,
      activities,
      mealsIncluded,
      itinerary
    };

    const updatedTour = await Tour.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập Nhật Thành Công",
      data: updatedTour,
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật tour:", err);
    res.status(500).json({ success: false, message: "Cập Nhật Không Thành Công" });
  }
};

// ✅ Xoá Tour
export const deleteTour = async (req, res) => {
  const id = req.params.id;
  try {
    await Tour.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Xoá Thành Công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xoá Thất Bại" });
  }
};

// ✅ Lấy 1 Tour
export const getSingleTour = async (req, res) => {
  const id = req.params.id;
  try {
    const tour = await Tour.findById(id).populate('reviews');
    if (!tour) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tour" });
    }
    res.status(200).json({ success: true, data: tour });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy dữ liệu tour" });
  }
};

// ✅ Lấy tất cả Tour (phân trang)
export const getAllTour = async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = 8;

  try {
    const tours = await Tour.find({})
      .populate('reviews')
      .skip(page * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Thành Công",
      data: tours
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách tour"
    });
  }
};

// ✅ Tìm kiếm theo city, distance, maxGroupSize
export const getTourBySearch = async (req, res) => {
  const city = new RegExp(req.query.city, "i");
  const distance = parseInt(req.query.distance);
  const maxGroupSize = parseInt(req.query.maxGroupSize);

  try {
    const tours = await Tour.find({
      city,
      distance: { $gte: distance },
      maxGroupSize: { $gte: maxGroupSize }
    }).populate("reviews");

    res.status(200).json({
      success: true,
      message: "Tìm kiếm thành công",
      data: tours
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Không tìm thấy tour"
    });
  }
};

// ✅ Lấy các tour nổi bật
export const getFeaturedTours = async (req, res) => {
  try {
    const tours = await Tour.find({ featured: true })
      .populate("reviews")
      .limit(8);

    res.status(200).json({
      success: true,
      message: "Lấy tour nổi bật thành công",
      data: tours
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Không thể lấy tour nổi bật"
    });
  }
};

// ✅ Đếm tổng số lượng Tour
export const getTourCount = async (req, res) => {
  try {
    const count = await Tour.estimatedDocumentCount();
    res.status(200).json({
      success: true,
      data: count
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Không thể đếm số lượng tour"
    });
  }
};
