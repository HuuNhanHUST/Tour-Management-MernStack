import Booking from '../models/Booking.js';
import Tour from '../models/Tour.js';
import PricingRule from '../models/PricingRule.js';
import mongoose from 'mongoose';

// ✅ HELPER: Create booking từ payment (không cần req/res)
export const createBookingFromPayment = async (bookingData) => {
  const {
    userId, userEmail, tourId, tourName,
    fullName, phone, guestSize, guests,
    singleRoomCount, totalAmount, basePrice,
    appliedDiscounts, appliedSurcharges,
    paymentMethod, paymentStatus,
    province, district, ward, addressDetail,
    bookAt
  } = bookingData;

  // Validate tour exists
  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw new Error("Tour không tồn tại");
  }

  // Check tour not ended
  const today = new Date();
  if (today > new Date(tour.endDate)) {
    throw new Error("Tour này đã kết thúc và không còn khả dụng");
  }

  // Check slots availability
  const remaining = tour.maxGroupSize - tour.currentBookings;
  if (remaining <= 0) {
    throw new Error("Tour đã hết chỗ");
  }
  if (guestSize > remaining) {
    throw new Error(`Chỉ còn lại ${remaining} chỗ trống`);
  }

  // Validate required fields
  if (!province?.code || !district?.code || !ward?.code || !addressDetail) {
    throw new Error("Vui lòng nhập đầy đủ thông tin địa chỉ");
  }

  if (!guests || guests.length === 0 || guests.length !== guestSize) {
    throw new Error("Thông tin khách không đầy đủ hoặc không khớp với số lượng khách");
  }

  // Create booking
  const newBooking = new Booking({
    userId: new mongoose.Types.ObjectId(userId),
    userEmail,
    tourId: tour._id,
    tourName: tourName || tour.title,
    fullName,
    phone,
    guestSize,
    guests,
    singleRoomCount: singleRoomCount || 0,
    totalAmount,
    basePrice,
    appliedDiscounts: appliedDiscounts || [],
    appliedSurcharges: appliedSurcharges || [],
    paymentMethod,
    paymentStatus, // ✅ Set by payment router (Pending/Confirmed)
    bookAt: bookAt || new Date(),
    province,
    district,
    ward,
    addressDetail
  });

  await newBooking.save();
  console.log("✅ [BookingController] Booking created:", newBooking._id);

  return { booking: newBooking, tour };
};

// ✅ FIXED: Update booking payment status with session support
export const updateBookingPaymentStatus = async (bookingId, paymentStatus, session = null) => {
  const booking = await Booking.findById(bookingId).session(session);
  if (!booking) {
    throw new Error("Booking không tồn tại");
  }

  booking.paymentStatus = paymentStatus;
  
  // Save with session if provided (for transaction support)
  if (session) {
    await booking.save({ session });
  } else {
    await booking.save();
  }
  
  console.log(`✅ [BookingController] Booking ${bookingId} status updated to ${paymentStatus}${session ? ' (in transaction)' : ''}`);

  return booking;
};

// ✅ FIXED: Update tour slots with session support
export const updateTourSlots = async (tourId, guestSize, session = null) => {
  const tour = await Tour.findById(tourId).session(session);
  if (!tour) {
    throw new Error("Tour không tồn tại");
  }

  const oldBookings = tour.currentBookings;
  tour.currentBookings += guestSize;
  
  // Save with session if provided (for transaction support)
  if (session) {
    await tour.save({ session });
  } else {
    await tour.save();
  }
  
  console.log(`✅ [BookingController] Tour ${tourId} slots updated: ${oldBookings} → ${tour.currentBookings}${session ? ' (in transaction)' : ''}`);

  return tour;
};

// ✅ FIXED: Rollback tour slots with session support
export const rollbackTourSlots = async (tourId, guestSize, session = null) => {
  const tour = await Tour.findById(tourId).session(session);
  if (!tour) {
    throw new Error("Tour không tồn tại");
  }

  const oldBookings = tour.currentBookings;
  tour.currentBookings -= guestSize;
  
  // Save with session if provided (for transaction support)
  if (session) {
    await tour.save({ session });
  } else {
    await tour.save();
  }
  
  console.log(`✅ [BookingController] Tour ${tourId} slots rolled back: ${oldBookings} → ${tour.currentBookings}${session ? ' (in transaction)' : ''}`);

  return tour;
};

// ✅ Tạo booking có kiểm tra chỗ và thời gian (an toàn) và thêm địa chỉ
export const createBooking = async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log("📦 Booking request received:", JSON.stringify(req.body, null, 2));
    console.log("📦 Guests from request body:", req.body.guests);
    console.log("📦 Guests array length:", req.body.guests?.length);
    console.log("📦 Guest size from request:", req.body.guestSize);
    
    const {
      tourId,
      guestSize,
      fullName,
      phone,
      tourName,
      totalAmount,
      basePrice,
      guests,
      singleRoomCount,
      appliedDiscounts,
      appliedSurcharges,
      paymentMethod,
      bookAt,
      // Thêm địa chỉ
      province,
      district,
      ward,
      addressDetail,
    } = req.body;
    
    // Fix for basePrice - force convert to number and provide fallback
    let validBasePrice = Number(basePrice);
    console.log("📍 basePrice from request:", basePrice, "converted to:", validBasePrice);
    
    // Validate basePrice is provided and is a number
    if (isNaN(validBasePrice) || validBasePrice === 0) {
      console.error("❌ Invalid basePrice received:", basePrice);
      
      // Try to get basePrice from the first guest if available
      if (guests && guests.length > 0 && guests[0].price) {
        validBasePrice = Number(guests[0].price);
        console.log("✅ Using first guest price as fallback:", validBasePrice);
      } else if (tour && tour.price) {
        // Use tour price as another fallback
        validBasePrice = Number(tour.price);
        console.log("✅ Using tour price as fallback:", validBasePrice);
      } else {
        // Set a default value as last resort
        validBasePrice = 100000; // Default value of 100,000
        console.log("✅ Using default price as fallback:", validBasePrice);
      }
      
      if (isNaN(validBasePrice) || validBasePrice <= 0) {
        // Return error response if we still can't get a valid basePrice
        return res.status(400).json({
          success: false,
          message: "Giá cơ bản (basePrice) không hợp lệ hoặc không được cung cấp."
        });
      }
    }

    // ⛔ Kiểm tra số lượng khách hợp lệ
    if (!guestSize || guestSize <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng khách phải lớn hơn 0."
      });
    }

    // ⛔ Kiểm tra thông tin khách và giá
    if (!guests || guests.length === 0 || guests.length !== guestSize) {
      return res.status(400).json({
        success: false,
        message: "Thông tin khách không đầy đủ hoặc không khớp với số lượng khách."
      });
    }
    
    // Kiểm tra thông tin giá của từng khách
    const invalidGuestPrice = guests.some(guest => 
      guest.price === undefined || guest.price === null || isNaN(Number(guest.price))
    );
    
    if (invalidGuestPrice) {
      return res.status(400).json({
        success: false,
        message: "Thông tin giá của một số khách không hợp lệ."
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
    console.log(`📊 Tour slots: total=${tour.maxGroupSize}, booked=${tour.currentBookings}, remaining=${remaining}`);
    
    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: `Tour đã hết chỗ hoặc chỉ còn lại 0 chỗ do đang chờ thanh toán.`
      });
    }
    
    if (guestSize > remaining) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn lại ${remaining} chỗ trống.`
      });
    }

    // ✅ Tăng số người đã đặt và lưu tour
    tour.currentBookings += guestSize;
    await tour.save();

    // Use our validated basePrice or fallback to tour price
    if (!validBasePrice) {
      validBasePrice = tour.price || 0;
      console.log("✅ Using tour price as fallback:", validBasePrice);
    }
    
    // Ensure each guest has a valid price
    const validatedGuests = guests.map((guest, index) => {
      console.log(`Processing guest ${index + 1}:`, guest);
      
      const validatedGuest = {
        ...guest,
        price: Number(guest.price) || validBasePrice
      };
      
      console.log(`Validated guest ${index + 1}:`, validatedGuest);
      return validatedGuest;
    });
    
    console.log("✅ Creating booking with basePrice:", validBasePrice);
    console.log("✅ All validated guests:", validatedGuests);
    console.log("✅ Validated guests count:", validatedGuests.length);
    
    // Final validation check for basePrice
    if (!validBasePrice || validBasePrice <= 0 || isNaN(validBasePrice)) {
      console.error("❌ Critical: Still have invalid basePrice after all fallbacks:", validBasePrice);
      return res.status(400).json({
        success: false,
        message: "Không thể xác định giá cơ bản cho tour này. Vui lòng liên hệ admin."
      });
    }
    
    // Check if we have pricing rules for this tour
    const pricingRules = await PricingRule.find({ tourId });
    if (!pricingRules || pricingRules.length === 0) {
      console.warn("⚠️ Warning: No pricing rules found for this tour:", tourId);
      // We continue anyway since we have a validBasePrice
    } else {
      console.log(`✅ Found ${pricingRules.length} pricing rules for tour`);
    }
    
    // Log all the data we're going to use
    console.log("📊 Creating booking with data:", {
      validBasePrice,
      totalAmount: Number(totalAmount) || validBasePrice * guestSize,
      guests: validatedGuests.map(g => ({ age: g.age, price: g.price }))
    });
    
    // ✅ Tạo booking với đầy đủ thông tin đã được validate
    const newBooking = new Booking({
      userId: req.user.id,
      userEmail: req.user.email,
      tourId,
      tourName,
      fullName,
      phone,
      guestSize,
      guests: validatedGuests,
      singleRoomCount,
      basePrice: validBasePrice,
      totalAmount: Number(totalAmount) || validBasePrice * guestSize,
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      paymentMethod,
      bookAt: bookAt || new Date(),
      province,
      district,
      ward,
      addressDetail,
    });

    try {
      const savedBooking = await newBooking.save();
      
      console.log("✅ Booking saved successfully:", savedBooking._id);
      console.log("✅ Saved booking guests:", savedBooking.guests);
      console.log("✅ Saved booking guests count:", savedBooking.guests?.length);
      
      res.status(200).json({
        success: true,
        message: "Đặt tour thành công!",
        data: savedBooking
      });
    } catch (saveError) {
      console.error("❌ Lỗi lưu booking:", saveError);
      
      // Revert the tour booking count if saving fails
      tour.currentBookings -= guestSize;
      await tour.save();
      
      // Check for specific validation errors
      if (saveError.name === 'ValidationError') {
        const errorFields = Object.keys(saveError.errors).join(', ');
        res.status(400).json({
          success: false,
          message: `Dữ liệu không hợp lệ: ${errorFields}`,
          error: saveError.message,
          validationErrors: saveError.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Lỗi khi lưu booking",
          error: saveError.message
        });
      }
    }
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
