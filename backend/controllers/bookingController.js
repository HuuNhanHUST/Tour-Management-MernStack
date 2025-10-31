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

  // ✅ CRITICAL FIX 1: Limit concurrent Pending bookings per user
  const pendingCount = await Booking.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    paymentStatus: 'Pending'
  });
  
  if (pendingCount >= 3) {
    throw new Error("Bạn đã có 3 booking đang chờ thanh toán. Vui lòng hoàn tất hoặc hủy booking cũ trước khi đặt tour mới.");
  }

  // ✅ CRITICAL FIX 2: Prevent duplicate booking for same tour
  const existingSameTour = await Booking.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    tourId: new mongoose.Types.ObjectId(tourId),
    paymentStatus: { $in: ['Pending', 'Confirmed'] }
  });
  
  if (existingSameTour) {
    throw new Error("Bạn đã có booking cho tour này rồi. Vui lòng kiểm tra lại trang 'Tour của tôi'.");
  }

  // ✅ CRITICAL FIX 3: Check overlapping tour dates
  const overlappingBookings = await Booking.find({
    userId: new mongoose.Types.ObjectId(userId),
    paymentStatus: { $in: ['Pending', 'Confirmed'] },
    _id: { $ne: null }
  }).populate('tourId');

  const hasOverlap = overlappingBookings.some(booking => {
    if (!booking.tourId) return false;
    
    const existingStart = new Date(booking.tourId.startDate);
    const existingEnd = new Date(booking.tourId.endDate);
    const newStart = new Date(tour.startDate);
    const newEnd = new Date(tour.endDate);
    
    // Check overlap: (StartA <= EndB) AND (EndA >= StartB)
    const isOverlapping = (newStart <= existingEnd) && (newEnd >= existingStart);
    
    if (isOverlapping) {
      console.log(`⚠️ Overlapping detected with booking ${booking._id}: ${booking.tourName}`);
    }
    
    return isOverlapping;
  });

  if (hasOverlap) {
    throw new Error("Bạn đã có booking trong khoảng thời gian này. Vui lòng chọn tour khác hoặc thời gian khác.");
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

// ✅ CRITICAL FIX: Update tour slots with ATOMIC operation to prevent race condition
export const updateTourSlots = async (tourId, guestSize, session = null) => {
  // Get tour first to check maxGroupSize
  const tour = await Tour.findById(tourId).session(session);
  if (!tour) {
    throw new Error("Tour không tồn tại");
  }

  // ✅ ATOMIC UPDATE: Use findOneAndUpdate with condition
  // This prevents race condition where 2 requests can both check and pass validation
  const updatedTour = await Tour.findOneAndUpdate(
    {
      _id: tourId,
      // ✅ Check slots availability in the same atomic operation
      $expr: { 
        $lte: [
          { $add: ['$currentBookings', guestSize] },
          '$maxGroupSize'
        ]
      }
    },
    {
      $inc: { currentBookings: guestSize }
    },
    { 
      session,
      new: true
    }
  );
  
  if (!updatedTour) {
    throw new Error(`Tour đã hết chỗ hoặc không đủ ${guestSize} slot. Vui lòng thử lại.`);
  }
  
  console.log(`✅ [BookingController] Tour ${tourId} slots updated atomically: ${tour.currentBookings} → ${updatedTour.currentBookings}${session ? ' (in transaction)' : ''}`);

  return updatedTour;
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

    // ✅ CRITICAL FIX 1: Limit concurrent Pending bookings per user
    const userId = req.user.id;
    const pendingCount = await Booking.countDocuments({
      userId,
      paymentStatus: 'Pending'
    });
    
    if (pendingCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có 3 booking đang chờ thanh toán. Vui lòng hoàn tất hoặc hủy booking cũ trước khi đặt tour mới."
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

    // ✅ CRITICAL FIX 2: Prevent duplicate booking for same tour
    const existingSameTour = await Booking.findOne({
      userId,
      tourId,
      paymentStatus: { $in: ['Pending', 'Confirmed'] }
    });
    
    if (existingSameTour) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có booking cho tour này rồi. Vui lòng kiểm tra lại trang 'Tour của tôi'.",
        existingBookingId: existingSameTour._id
      });
    }

    // ✅ CRITICAL FIX 3: Check overlapping tour dates
    const overlappingBookings = await Booking.find({
      userId,
      paymentStatus: { $in: ['Pending', 'Confirmed'] },
      _id: { $ne: null }
    }).populate('tourId');

    const hasOverlap = overlappingBookings.some(booking => {
      if (!booking.tourId) return false;
      
      const existingStart = new Date(booking.tourId.startDate);
      const existingEnd = new Date(booking.tourId.endDate);
      const newStart = new Date(tour.startDate);
      const newEnd = new Date(tour.endDate);
      
      // Check overlap: (StartA <= EndB) AND (EndA >= StartB)
      const isOverlapping = (newStart <= existingEnd) && (newEnd >= existingStart);
      
      if (isOverlapping) {
        console.log(`⚠️ Overlapping detected with booking ${booking._id}: ${booking.tourName}`);
      }
      
      return isOverlapping;
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có booking trong khoảng thời gian này. Vui lòng chọn tour khác hoặc thời gian khác."
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

    // ✅ CRITICAL FIX 4: Use atomic update for tour slots (prevent race condition)
    // Remove manual check and update - will be done atomically by updateTourSlots
    console.log(`📊 Tour slots before booking: total=${tour.maxGroupSize}, booked=${tour.currentBookings}, requesting=${guestSize}`);

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
    
    // ✅ CRITICAL FIX 5: Use transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // ✅ ATOMIC: Update tour slots with race condition prevention
      await updateTourSlots(tourId, guestSize, session);
      
      // ✅ Create booking with validated data
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

      const savedBooking = await newBooking.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      
      console.log("✅ Booking saved successfully:", savedBooking._id);
      console.log("✅ Saved booking guests:", savedBooking.guests);
      console.log("✅ Saved booking guests count:", savedBooking.guests?.length);
      
      res.status(200).json({
        success: true,
        message: "Đặt tour thành công!",
        data: savedBooking
      });
      
    } catch (saveError) {
      // Rollback transaction on error
      await session.abortTransaction();
      console.error("❌ Lỗi lưu booking:", saveError);
      
      // Check for specific validation errors
      if (saveError.name === 'ValidationError') {
        const errorFields = Object.keys(saveError.errors).join(', ');
        res.status(400).json({
          success: false,
          message: `Dữ liệu không hợp lệ: ${errorFields}`,
          error: saveError.message,
          validationErrors: saveError.errors
        });
      } else if (saveError.code === 11000) {
        // Duplicate key error (unique constraint violation)
        res.status(400).json({
          success: false,
          message: "Bạn đã có booking cho tour này rồi. Không thể đặt trùng.",
          error: "Duplicate booking"
        });
      } else {
        res.status(500).json({
          success: false,
          message: saveError.message || "Lỗi khi lưu booking",
          error: saveError.message
        });
      }
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error("❌ Lỗi tạo booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo booking",
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
    const books = await Booking.find()
      .populate('tourId', 'title city startDate endDate')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

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

// ✅ CRITICAL FIX: Get user's bookings (My Bookings page)
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.find({ userId })
      .populate('tourId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Lấy bookings thành công',
      data: bookings
    });
    
  } catch (error) {
    console.error('❌ Error fetching my bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ CRITICAL FIX: Update booking status (Admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Pending', 'Confirmed', 'Failed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ. Chỉ chấp nhận: Pending, Confirmed, Failed, Cancelled'
      });
    }
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking không tồn tại'
      });
    }
    
    // Business logic validation
    if (booking.paymentStatus === 'Confirmed' && status === 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể đổi booking Confirmed về Pending'
      });
    }
    
    if (booking.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật booking đã bị hủy'
      });
    }
    
    const oldStatus = booking.paymentStatus;
    booking.paymentStatus = status;
    await booking.save();
    
    // Update payment status if exists
    const Payment = mongoose.model('Payment');
    await Payment.updateOne(
      { bookingId: id },
      { status }
    );
    
    console.log(`✅ Admin updated booking ${id} status: ${oldStatus} → ${status}`);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật status thành công',
      data: booking
    });
    
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// ✅ CRITICAL FIX: Cancel booking with slots rollback (Admin or User)
export const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new Error('Booking không tồn tại');
    }
    
    if (booking.paymentStatus === 'Cancelled') {
      throw new Error('Booking đã bị hủy rồi');
    }
    
    // Update booking
    booking.paymentStatus = 'Cancelled';
    booking.cancellationReason = reason || 'Admin cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    await booking.save({ session });
    
    // Update payment
    const Payment = mongoose.model('Payment');
    await Payment.updateOne(
      { bookingId: id },
      { status: 'Cancelled' },
      { session }
    );
    
    // Rollback tour slots
    await rollbackTourSlots(booking.tourId, booking.guestSize, session);
    
    await session.commitTransaction();
    
    console.log(`✅ Booking ${id} cancelled successfully. Slots rolled back.`);
    
    res.status(200).json({
      success: true,
      message: 'Hủy booking thành công. Số chỗ đã được hoàn trả.',
      data: booking
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi hủy booking'
    });
  } finally {
    session.endSession();
  }
};
