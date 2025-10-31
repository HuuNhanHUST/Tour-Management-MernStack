import Tour from '../models/Tour.js';
import TourGuide from '../models/TourGuide.js'; // ✅ Thêm model TourGuide

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

// // ✅ Tạo mới Tour
// export const createTour = async (req, res) => {
//   try {
//     parseJSONFields(req.body);

//     const {
//       title,
//       city,
//       address,
//       distance,
//       desc,
//       price,
//       maxGroupSize,
//       minGroupSize,
//       featured,
//       startDate,
//       endDate,
//       transportation,
//       hotelInfo,
//       activities,
//       mealsIncluded,
//       itinerary,
//       tourGuide,
//     } = req.body;

//     const photo = req.files?.photo?.[0]?.path || "";
//     const photos = req.files?.photos?.map(file => file.path) || [];

//     const newTour = new Tour({
//       title,
//       city,
//       address,
//       distance: Number(distance),
//       desc,
//       price: Number(price),
//       maxGroupSize: Number(maxGroupSize),
//       minGroupSize: Number(minGroupSize),
//       featured: featured === "true" || featured === true,
//       startDate: new Date(startDate),
//       endDate: new Date(endDate),
//       photo,
//       photos,
//       transportation,
//       hotelInfo,
//       activities,
//       mealsIncluded,
//       itinerary,
//       tourGuide,
//     });

//     const savedTour = await newTour.save();

//     res.status(200).json({
//       success: true,
//       message: "Đã Tạo Thành Công",
//       data: savedTour,
//     });
//   } catch (err) {
//     console.error("❌ Lỗi khi tạo tour:", err);
//     res.status(500).json({
//       success: false,
//       message: "Tạo Thất Bại. Hãy thử lại",
//     });
//   }
// };

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
      tourGuide,
    } = req.body;

    const photo = req.files?.photo?.[0]?.path || "";
    const photos = req.files?.photos?.map(file => file.path) || [];

    const newTour = new Tour({
      title,
      city,
      address,
      distance: Number(distance),
      desc,
      price: parseFloat(price), // Sử dụng parseFloat để chuyển đổi giá thành số
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
      itinerary,
      tourGuide,
    });

    await newTour.save();

    // Thêm tham chiếu đến tourGuide
    // ✅ FIX: Đảm bảo tourGuide là một ID hợp lệ trước khi cập nhật
    // req.body.tourGuide thường là một chuỗi ID từ frontend
    const tourGuideId = typeof tourGuide === 'object' && tourGuide !== null ? tourGuide._id : tourGuide;
    if (tourGuideId) {
      await TourGuide.findByIdAndUpdate(tourGuideId, { $addToSet: { tours: newTour._id } });
    }

    res.status(201).json({
      success: true,
      message: "Tạo tour mới thành công",
      data: newTour,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Không thể tạo tour mới",
      error: err.message,
    });
  }
};

// ✅ Lấy dữ liệu cần thiết cho trang tạo/cập nhật tour (bao gồm danh sách hướng dẫn viên)
export const getTourCreationData = async (req, res) => {
  try {
    // Lấy tất cả hướng dẫn viên, chỉ chọn lọc các trường cần thiết
    const tourGuides = await TourGuide.find({}).select('name photo languages');

    // Trong tương lai, bạn có thể thêm các dữ liệu khác ở đây
    // const categories = await Category.find({});

    res.status(200).json({
      success: true,
      message: "Lấy dữ liệu tạo tour thành công",
      data: {
        tourGuides,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Không thể lấy dữ liệu tạo tour" });
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
      itinerary,
      tourGuide,
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
      itinerary,
      tourGuide,
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

// ✅ Lấy 1 Tour và các tour tương tự
export const getSingleTour = async (req, res) => {
  const id = req.params.id;
  try {
    const tour = await Tour.findById(id)
      .populate('reviews')
      .populate('tourGuide');

    if (!tour) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tour" });
    }

    // Tìm các tour tương tự dựa vào city hoặc loại tour
    let similarTours = [];
    
    // Nếu có city, tìm tour có cùng thành phố
    if (tour.city) {
      similarTours = await Tour.find({
        _id: { $ne: id }, // Loại trừ tour hiện tại
        $or: [
          // Tìm chính xác city
          { city: tour.city }, 
          // Tìm city chứa từ khóa
          { city: { $regex: new RegExp(tour.city, 'i') } }, 
          // Tìm city là một phần của city hiện tại (ngược lại)
          ...(tour.city.includes(',') 
            ? [{ city: { $regex: new RegExp(tour.city.split(',')[0].trim(), 'i') } }] 
            : []),
          // Tìm trong address
          { address: { $regex: new RegExp(tour.city, 'i') } }
        ]
      }).limit(3);
    }
    
    // Nếu không tìm thấy tour tương tự dựa trên city, thử tìm dựa trên các tiêu chí khác
    if (similarTours.length === 0) {
      // Tìm các tour có giá tương tự (+/- 30%)
      similarTours = await Tour.find({
        _id: { $ne: id },
        price: { 
          $gte: tour.price * 0.7, 
          $lte: tour.price * 1.3 
        }
      }).limit(3);
    }

    res.status(200).json({ 
      success: true, 
      data: tour,
      similarTours: similarTours
    });
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
      .populate('tourGuide') // Thêm populate cho tourGuide
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
    }).populate("reviews").populate("tourGuide");

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
      .populate("tourGuide")
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