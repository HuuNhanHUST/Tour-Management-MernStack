import Tour from '../models/Tour.js'



//Tạo mới Tour 
export const createTour = async(req, res )=> {
    const newTour = new Tour (req.body)
    try {
        const savedTour =await newTour.save()
        res.status(200).json({success:true, message:"Đã Tạo Thành Công",data:savedTour,})
    } catch (err) {
        res.status(500).json({success:false, message:"Tạo Thất Bại. Hãy thử lại"})
    }
}

//Cap Nhat Tour 

export const updateTour =async(req, res)=>{
    const id =req.params.id
    try {
      const updateTour = await Tour.findByIdAndUpdate(id, {
        $set: req.body 
      },{new:true})
        
      res.status(200).json({success:true, message:"Cập Nhật Thành Công",data:updateTour,})
    } catch (err) {
        res.status(500).json({success:false, message:"Cập Nhật Không Thành Công",})
        
    }
}
// Xoá Tour
export const deleteTour = async (req, res) => {
    const id = req.params.id;
    try {
      await Tour.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Xoá Thành Công" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Xoá Thất Bại" });
    }
  };

// Lấy 1 Tour
export const getSingleTour = async (req, res) => {
    const id = req.params.id;
    try {
      const tour = await Tour.findById(id).populate('reviews')
      if (!tour) {
        return res.status(404).json({ success: false, message: "Không tìm thấy tour" });
      }
      res.status(200).json({ success: true, data: tour });
    } catch (err) {
      res.status(500).json({ success: false, message: "Không thể lấy dữ liệu tour" });
    }
  };
  
// Lấy tất cả Tour (có phân trang)
export const getAllTour = async (req, res) => {
    const page = parseInt(req.query.page) || 0; // Trang mặc định là 0
    const limit = 8; // Số tour mỗi trang
  
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
// Tìm kiếm tour theo city, khoảng cách và giá
  export const getTourBySearch = async (req, res) => {
    const city = new RegExp(req.query.city, 'i'); // tìm gần đúng, không phân biệt hoa thường
    const distance = parseInt(req.query.distance); // khoảng cách tối đa
    const maxGroupSize = parseInt(req.query.maxGroupSize); 
  
    try {
      const tours = await Tour.find({
        city,
        distance: { $gte: distance },// gte la` greater than equal
        maxGroupSize: { $gte: maxGroupSize }
      }).populate('reviews');
  
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


  // Lấy các tour nổi bật (featured)
export const getFeaturedTours = async (req, res) => {
    try {
      const tours = await Tour.find({ featured: true }).populate('reviews').limit(8); // Giới hạn 8 tour
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


  // Lấy tổng số lượng tour (dùng cho phân trang, dashboard,...)
export const getTourCount = async (req, res) => {
    try {
      const tourCount = await Tour.estimatedDocumentCount();
      res.status(200).json({
        success: true,
        data: tourCount
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Không thể đếm số lượng tour"
      });
    }
  };








