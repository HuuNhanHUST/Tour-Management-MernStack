# 🔴 BÁO CÁO VẤN ĐỀ VÀ GIẢI PHÁP PAYMENT ARCHITECTURE

## 📋 TÓM TẮT

Project hiện tại có **VẤN ĐỀ NGHIÊM TRỌNG** về tính đồng bộ và logic nghiệp vụ giữa 2 phương thức thanh toán:
- ❌ **Cash**: Tạo Booking trực tiếp, không có Payment record
- ❌ **MoMo**: Tạo Payment → Chờ admin duyệt thủ công → Mới tạo Booking

---

## 🔴 **VẤN ĐỀ 1: FLOW THANH TOÁN KHÔNG ĐỒNG BỘ**

### Hiện tại:

#### Cash Payment Flow:
```
User click "Đặt Ngay"
  ↓
Frontend POST /api/v1/booking
  ↓
Backend tạo Booking NGAY với paymentMethod="Cash"
  ↓
Cập nhật tour.currentBookings
  ↓
✅ XONG (không có Payment record)
```

#### MoMo Payment Flow:
```
User click "Thanh toán MoMo"
  ↓
Frontend POST /api/v1/payment/momo
  ↓
Backend tạo Payment (status="Pending")
  ↓
User thanh toán trên MoMo
  ↓
MoMo IPN callback → Payment (status="Success")
  ↓
❌ KHÔNG TẠO BOOKING (chỉ log console)
  ↓
Admin vào Payment List
  ↓
Admin chọn status="Success" THỦ CÔNG
  ↓
Backend mới tạo Booking
  ↓
Cập nhật tour.currentBookings
  ↓
✅ XONG
```

### ⚠️ Vấn đề:
1. **Không đồng nhất**: 2 phương thức có 2 luồng xử lý hoàn toàn khác nhau
2. **Không có Payment tracking cho Cash**: Khó thống kê doanh thu
3. **Admin phải thao tác thủ công**: MoMo đã confirm thanh toán rồi, tại sao admin phải click lại?
4. **Race condition**: Nhiều user đặt MoMo cùng lúc có thể overselling (vì chưa chiếm slot)
5. **Mất thông tin**: Payment không lưu `guests` array → Booking tạo sau bị thiếu data

---

## 🔴 **VẤN ĐỀ 2: DỮ LIỆU KHÔNG ĐỒNG BỘ**

### Payment Model (hiện tại):
```javascript
{
  userId, userEmail, tourId,
  quantity,  // ⚠️ Tên khác với Booking (guestSize)
  orderId, amount, status,
  payType,   // Chỉ có "MoMo"
  tourName, fullName, phone,
  province, district, ward, addressDetail
  // ❌ THIẾU: guests array, basePrice, discounts, surcharges, singleRoomCount
}
```

### Booking Model:
```javascript
{
  userId, userEmail, tourId, tourName,
  fullName, guestSize,  // ⚠️ Tên khác với Payment (quantity)
  guests: [{            // ✅ Có đầy đủ thông tin
    fullName, age, guestType, price,
    discounts: [{...}],
    surcharges: [{...}]
  }],
  singleRoomCount,      // ✅ Có
  phone, bookAt,
  totalAmount, basePrice,  // ✅ Có
  appliedDiscounts: [{...}],  // ✅ Có
  appliedSurcharges: [{...}], // ✅ Có
  paymentMethod,
  province, district, ward, addressDetail
}
```

### ⚠️ Vấn đề:
1. **Field naming không nhất quán**: `quantity` vs `guestSize`
2. **Payment thiếu thông tin quan trọng**:
   - Không có `guests` array → Không biết ai là ai, tuổi bao nhiêu
   - Không có `basePrice`, `appliedDiscounts`, `appliedSurcharges` → Không biết giá được tính thế nào
   - Không có `singleRoomCount` → Mất thông tin phòng đơn
3. **Khi tạo Booking từ Payment**: Phải dùng giá trị mặc định (guestSize = quantity, không có guests array)

---

## 🔴 **VẤN ĐỀ 3: LOGIC BUSINESS SAI**

### MoMo IPN Handler (backend/router/payment.js):
```javascript
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  
  const updatedPayment = await Payment.findOneAndUpdate(
    { orderId: data.orderId },
    { status: data.resultCode === 0 ? "Success" : "Failed" },
    { new: true }
  );

  if (data.resultCode === 0 && updatedPayment) {
    console.log("✅ MoMo thanh toán thành công - chờ admin duyệt để tạo booking");
    // ❌ CHỈ LOG, KHÔNG TẠO BOOKING
  }
  
  res.status(200).json({ message: 'IPN received' });
});
```

**⚠️ Vấn đề**: MoMo đã xác nhận thanh toán thành công, nhưng không tạo Booking ngay. Phải chờ admin vào click thủ công → **SAI LOGIC**!

### Admin Update Status (backend/router/payment.js):
```javascript
router.put('/:id/status', async (req, res) => {
  // ...
  const updated = await Payment.findByIdAndUpdate(id, { status }, { new: true });
  
  if (status === "Success" && updated.userEmail) {
    // ✅ TẠI ĐÂY MỚI TẠO BOOKING
    const newBooking = new Booking({
      userId: updated.userId._id,
      userEmail: updated.userEmail,
      tourId: tour._id,
      tourName: updated.tourName || tour.title,
      fullName: updated.fullName || "Người dùng",
      phone: updated.phone || "Không rõ",
      guestSize: updated.quantity || 1,  // ⚠️ quantity không có trong schema?
      totalAmount: updated.amount,
      bookAt: new Date(),
      paymentMethod: "MoMo",
      province: updated.province || { code: "", name: "" },
      district: updated.district || { code: "", name: "" },
      ward: updated.ward || { code: "", name: "" },
      addressDetail: updated.addressDetail || "",
      // ❌ THIẾU: guests array, basePrice, discounts, surcharges, singleRoomCount
    });
    
    await newBooking.save();
  }
});
```

**⚠️ Vấn đề**: 
1. Booking tạo từ Payment thiếu rất nhiều thông tin
2. `updated.quantity` không tồn tại trong Payment schema hiện tại (chỉ có trong docs, không có trong code)
3. Không có `guests` array → Booking không biết thông tin chi tiết từng khách

---

## ✅ **GIẢI PHÁP ĐỀ XUẤT**

### **GIẢI PHÁP 1: ĐỒNG BỘ HÓA FLOW (RECOMMENDED)**

#### Mục tiêu:
- ✅ **Cash và MoMo đều tạo Payment record**
- ✅ **Cash và MoMo đều tạo Booking ngay lập tức**
- ✅ **Admin chỉ cần XEM và CONFIRM, không phải click để tạo Booking**

#### Flow mới cho CASH:
```
1. User click "Đặt Ngay"
2. Frontend POST /api/v1/payment/cash
3. Backend:
   - Tạo Payment record:
     * status: "Pending"
     * payType: "Cash"
     * Lưu đầy đủ: guests, pricing details, address
   - Tạo Booking record:
     * paymentMethod: "Cash"
     * Lưu đầy đủ thông tin
     * Link với Payment qua bookingId
   - Cập nhật tour.currentBookings
   - Send email xác nhận
4. Admin vào Payment List:
   - Xem thông tin đầy đủ
   - Click "Confirm" → status: "Success"
   - Hoặc "Reject" → status: "Failed" → rollback booking & slots
```

#### Flow mới cho MOMO:
```
1. User click "Thanh toán MoMo"
2. Frontend POST /api/v1/payment/momo
3. Backend:
   - Kiểm tra slots available
   - Tạo Payment record:
     * status: "Pending"
     * payType: "MoMo"
     * Lưu đầy đủ: guests, pricing details, address
   - RESERVE slots tạm thời (tùy chọn)
   - Return MoMo payUrl
4. User thanh toán trên MoMo
5. MoMo IPN callback:
   - Update Payment status: "Success"
   - TẠO BOOKING NGAY TẠI ĐÂY:
     * Lấy thông tin từ Payment
     * Tạo Booking đầy đủ
     * Link với Payment qua bookingId
   - Cập nhật tour.currentBookings
   - Send email confirmation
6. Admin vào Payment List:
   - Chỉ cần XEM
   - Booking đã được tạo tự động
```

---

## 🔧 **IMPLEMENTATION STEPS**

### **STEP 1: Cập nhật Payment Model**

File: `backend/models/Payment.js`

```javascript
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  // Core references
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  userEmail: { 
    type: String,
    required: true 
  },
  tourId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Tour", 
    required: true 
  },
  bookingId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Booking" 
  }, // ✅ Link to booking after created
  
  // Payment details
  orderId: { 
    type: String,
    required: true,
    unique: true 
  },
  amount: { 
    type: Number,
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Pending", "Success", "Failed", "Cancelled"], 
    default: "Pending" 
  },
  payType: { 
    type: String, 
    enum: ["Cash", "MoMo"],
    default: "Cash" 
  },
  
  // Tour info
  tourName: { 
    type: String,
    required: true 
  },
  
  // Guest info
  fullName: { 
    type: String,
    required: true 
  },
  phone: { 
    type: String,
    required: true 
  },
  guestSize: { 
    type: Number,
    required: true,
    min: 1 
  },
  
  // ✅ ADD: Detailed guest information
  guests: [{
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    guestType: { 
      type: String, 
      enum: ["adult", "child", "infant", "senior", "student"],
      required: true
    },
    price: { type: Number, required: true },
    discounts: [{
      name: { type: String },
      amount: { type: Number }
    }],
    surcharges: [{
      name: { type: String },
      amount: { type: Number }
    }]
  }],
  
  singleRoomCount: {
    type: Number,
    default: 0
  },
  
  // ✅ ADD: Pricing details
  basePrice: {
    type: Number,
    required: true
  },
  appliedDiscounts: [{
    name: { type: String },
    amount: { type: Number }
  }],
  appliedSurcharges: [{
    name: { type: String },
    amount: { type: Number }
  }],
  
  // Address
  province: {
    code: { type: String, required: true },
    name: { type: String, required: true }
  },
  district: {
    code: { type: String, required: true },
    name: { type: String, required: true }
  },
  ward: {
    code: { type: String, required: true },
    name: { type: String, required: true }
  },
  addressDetail: {
    type: String,
    required: true
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  paidAt: Date, // When actual payment completed
  
  // MoMo specific
  momoTransId: String, // MoMo transaction ID
  momoRequestId: String
});

export default mongoose.model("Payment", PaymentSchema);
```

---

### **STEP 2: Tạo endpoint POST /api/v1/payment/cash**

File: `backend/router/payment.js`

```javascript
// ✅ NEW: Cash payment endpoint
router.post('/cash', async (req, res) => {
  const {
    userId, userEmail, fullName, phone,
    tourId, tourName, guestSize,
    guests, singleRoomCount,
    totalAmount, basePrice,
    appliedDiscounts, appliedSurcharges,
    province, district, ward, addressDetail,
    bookAt
  } = req.body;

  try {
    // Validate tour exists
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: "Tour không tồn tại" 
      });
    }

    // Check slots availability
    const availableSlots = tour.maxGroupSize - tour.currentBookings;
    if (guestSize > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn lại ${availableSlots} chỗ trống.`
      });
    }

    // Generate orderId for cash payment
    const orderId = `CASH_${Date.now()}_${userId}`;

    // 1. Create Payment record
    const newPayment = await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail,
      tourId: tour._id,
      orderId,
      amount: Number(totalAmount),
      status: 'Pending',
      payType: 'Cash',
      tourName: tour.title,
      fullName,
      phone,
      guestSize: Number(guestSize),
      guests,
      singleRoomCount: Number(singleRoomCount),
      basePrice: Number(basePrice),
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      province,
      district,
      ward,
      addressDetail,
      createdAt: new Date()
    });

    // 2. Create Booking record
    const newBooking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail,
      tourId: tour._id,
      tourName: tour.title,
      fullName,
      phone,
      guestSize: Number(guestSize),
      guests,
      singleRoomCount: Number(singleRoomCount),
      totalAmount: Number(totalAmount),
      basePrice: Number(basePrice),
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      paymentMethod: "Cash",
      bookAt: bookAt || new Date(),
      province,
      district,
      ward,
      addressDetail
    });

    await newBooking.save();

    // 3. Link Payment with Booking
    newPayment.bookingId = newBooking._id;
    await newPayment.save();

    // 4. Update tour slots
    tour.currentBookings += Number(guestSize);
    await tour.save();

    // 5. Send email confirmation
    await sendSuccessEmail(
      userEmail,
      orderId,
      totalAmount,
      fullName
    );

    console.log("✅ Đặt tour Cash thành công:", {
      paymentId: newPayment._id,
      bookingId: newBooking._id
    });

    res.status(200).json({
      success: true,
      message: "Đặt tour thành công! Vui lòng thanh toán tiền mặt khi nhận tour.",
      data: {
        payment: newPayment,
        booking: newBooking
      }
    });

  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán Cash:', error);
    res.status(500).json({ 
      success: false,
      message: 'Tạo thanh toán thất bại',
      error: error.message 
    });
  }
});
```

---

### **STEP 3: Cập nhật MoMo endpoint để lưu đầy đủ thông tin**

File: `backend/router/payment.js`

```javascript
// ✅ UPDATE: MoMo payment endpoint
router.post('/momo', async (req, res) => {
  const {
    amount, orderId, orderInfo,
    userId, tourId, email,
    fullName, phone, tourName,
    guestSize, guests, singleRoomCount,
    basePrice, appliedDiscounts, appliedSurcharges,
    province, district, ward, addressDetail
  } = req.body;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour không tồn tại" 
      });
    }

    // Check slots (including pending payments)
    const pendingPayments = await Payment.aggregate([
      {
        $match: {
          tourId: new mongoose.Types.ObjectId(tourId),
          status: "Pending",
          payType: "MoMo"
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$guestSize" }
        }
      }
    ]);
    
    const pendingQuantity = pendingPayments[0]?.totalPending || 0;
    const availableSlots = tour.maxGroupSize - tour.currentBookings - pendingQuantity;

    if (guestSize > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Tour đã hết chỗ hoặc chỉ còn lại ${availableSlots} chỗ do đang chờ thanh toán.`
      });
    }

    // Generate MoMo request
    const requestId = `${process.env.MOMO_PARTNER_CODE}${Date.now()}`;
    const rawAmount = amount.toString();
    const rawSignature =
      `partnerCode=${process.env.MOMO_PARTNER_CODE}&accessKey=${process.env.MOMO_ACCESS_KEY}&requestId=${requestId}` +
      `&amount=${rawAmount}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&returnUrl=${process.env.MOMO_RETURN_URL}&notifyUrl=${process.env.MOMO_NOTIFY_URL}&extraData=`;

    const signature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      requestId,
      amount: rawAmount,
      orderId,
      orderInfo,
      returnUrl: process.env.MOMO_RETURN_URL,
      notifyUrl: process.env.MOMO_NOTIFY_URL,
      extraData: '',
      requestType: process.env.MOMO_REQUEST_TYPE,
      signature,
      lang: 'vi'
    };

    const momoRes = await axios.post(process.env.MOMO_API_URL, requestBody);
    console.log("✅ MoMo response:", momoRes.data);

    let finalEmail = email;
    if (!finalEmail) {
      const user = await User.findById(userId);
      finalEmail = user?.email || "";
    }

    // ✅ CREATE PAYMENT WITH FULL INFO
    await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: finalEmail,
      tourId: tour._id,
      orderId,
      amount: Number(amount),
      status: 'Pending',
      payType: 'MoMo',
      tourName: tour.title,
      fullName,
      phone,
      guestSize: Number(guestSize),
      guests, // ✅ Full guest info
      singleRoomCount: Number(singleRoomCount),
      basePrice: Number(basePrice),
      appliedDiscounts: appliedDiscounts || [],
      appliedSurcharges: appliedSurcharges || [],
      province,
      district,
      ward,
      addressDetail,
      momoRequestId: requestId
    });

    res.status(200).json(momoRes.data);
    
  } catch (error) {
    console.error('❌ Lỗi tạo thanh toán MoMo:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Tạo thanh toán thất bại' 
    });
  }
});
```

---

### **STEP 4: Cập nhật MoMo IPN để tạo Booking tự động**

File: `backend/router/payment.js`

```javascript
// ✅ UPDATE: MoMo IPN handler - AUTO CREATE BOOKING
router.post('/momo-notify', async (req, res) => {
  const data = req.body;
  console.log("📩 IPN từ MoMo:", JSON.stringify(data, null, 2));

  try {
    // Find and update payment status
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderId: data.orderId },
      { 
        status: data.resultCode === 0 ? "Success" : "Failed",
        paidAt: data.resultCode === 0 ? new Date() : undefined,
        momoTransId: data.transId
      },
      { new: true }
    ).populate("userId", "username");

    if (!updatedPayment) {
      console.error("❌ Không tìm thấy Payment với orderId:", data.orderId);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // ✅ AUTO CREATE BOOKING ON SUCCESS
    if (data.resultCode === 0) {
      console.log("✅ MoMo thanh toán thành công - TẠO BOOKING TỰ ĐỘNG");
      
      // Get tour info
      const tour = await Tour.findById(updatedPayment.tourId);
      if (!tour) {
        console.error("❌ Không tìm thấy tour:", updatedPayment.tourId);
        return res.status(404).json({ message: 'Tour not found' });
      }

      // Check if booking already exists (prevent duplicate)
      const existingBooking = await Booking.findOne({
        userId: updatedPayment.userId,
        tourId: updatedPayment.tourId,
        fullName: updatedPayment.fullName,
        phone: updatedPayment.phone,
        guestSize: updatedPayment.guestSize
      });

      if (existingBooking) {
        console.log("⚠️ Booking đã tồn tại, không tạo mới");
        // Link existing booking with payment
        updatedPayment.bookingId = existingBooking._id;
        await updatedPayment.save();
      } else {
        // Create new booking
        const newBooking = new Booking({
          userId: updatedPayment.userId,
          userEmail: updatedPayment.userEmail,
          tourId: tour._id,
          tourName: updatedPayment.tourName || tour.title,
          fullName: updatedPayment.fullName,
          phone: updatedPayment.phone,
          guestSize: updatedPayment.guestSize,
          guests: updatedPayment.guests, // ✅ Full guest info
          singleRoomCount: updatedPayment.singleRoomCount,
          totalAmount: updatedPayment.amount,
          basePrice: updatedPayment.basePrice,
          appliedDiscounts: updatedPayment.appliedDiscounts,
          appliedSurcharges: updatedPayment.appliedSurcharges,
          paymentMethod: "MoMo",
          bookAt: new Date(),
          province: updatedPayment.province,
          district: updatedPayment.district,
          ward: updatedPayment.ward,
          addressDetail: updatedPayment.addressDetail
        });

        await newBooking.save();
        console.log("✅ Đã tạo Booking tự động:", newBooking._id);

        // Link booking with payment
        updatedPayment.bookingId = newBooking._id;
        await updatedPayment.save();

        // Update tour slots
        tour.currentBookings += updatedPayment.guestSize;
        await tour.save();
        console.log("✅ Đã cập nhật currentBookings:", tour.currentBookings);

        // Send email
        await sendSuccessEmail(
          updatedPayment.userEmail,
          updatedPayment.orderId,
          updatedPayment.amount,
          updatedPayment.userId?.username || updatedPayment.fullName
        );
      }
    } else {
      console.log("❌ MoMo thanh toán thất bại, resultCode:", data.resultCode);
    }

    res.status(200).json({ message: 'IPN processed successfully' });
    
  } catch (err) {
    console.error("❌ Lỗi xử lý IPN:", err.message);
    res.status(500).json({ message: 'Xử lý IPN thất bại', error: err.message });
  }
});
```

---

### **STEP 5: Cập nhật Admin Update Status để KHÔNG tạo Booking nữa**

File: `backend/router/payment.js`

```javascript
// ✅ UPDATE: Admin chỉ confirm/reject, KHÔNG tạo Booking
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false });
    }

    if (!["Pending", "Success", "Failed", "Cancelled"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status không hợp lệ" 
      });
    }

    const payment = await Payment.findById(id).populate("userId", "username");
    if (!payment) {
      return res.status(404).json({ success: false });
    }

    const oldStatus = payment.status;
    payment.status = status;
    
    // If confirming Cash payment
    if (status === "Success" && payment.payType === "Cash" && oldStatus !== "Success") {
      payment.paidAt = new Date();
      
      // Booking should already exist for Cash
      // Just send confirmation email if needed
      if (payment.userEmail) {
        await sendSuccessEmail(
          payment.userEmail,
          payment.orderId,
          payment.amount,
          payment.userId?.username || payment.fullName
        );
      }
    }
    
    // If rejecting payment
    if (status === "Failed" || status === "Cancelled") {
      // Rollback: Delete booking and restore tour slots
      if (payment.bookingId) {
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
          const tour = await Tour.findById(booking.tourId);
          if (tour) {
            tour.currentBookings -= booking.guestSize;
            await tour.save();
          }
          await Booking.findByIdAndDelete(payment.bookingId);
          console.log("✅ Đã xóa Booking và rollback slots");
        }
      }
    }

    await payment.save();

    // Emit realtime update
    io.emit(`payment-updated-${payment.userId._id}`, payment);

    res.status(200).json({ 
      success: true, 
      message: "Đã cập nhật trạng thái",
      data: payment 
    });
    
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái thanh toán:", err.message);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});
```

---

### **STEP 6: Cập nhật Frontend Booking.jsx**

File: `frontend/src/components/Booking/Booking.jsx`

```javascript
// ✅ UPDATE: Cash payment handler
const handerClick = async (e) => {
  e.preventDefault();

  // ... validation code ...

  try {
    // ... prepare guest data ...

    const finalTotalAmount = Math.floor(Number(totalAmount));

    const paymentData = {
      userId: credentials.userId,
      userEmail: credentials.userEmail,
      fullName: credentials.fullName,
      phone: credentials.phone,
      guestSize: credentials.guestSize,
      guests: guestsWithPrices,
      singleRoomCount: singleRoomCount,
      tourId: tour._id,
      tourName: tour.title,
      totalAmount: finalTotalAmount,
      basePrice: pricingData?.basePrice || Number(price),
      appliedDiscounts: pricingData?.appliedDiscounts || [],
      appliedSurcharges: pricingData?.appliedSurcharges || [],
      province: location.province,
      district: location.district,
      ward: location.ward,
      addressDetail,
      bookAt: new Date()
    };

    console.log("Đang gửi yêu cầu thanh toán Cash:", paymentData);

    // ✅ CHANGE: POST to /payment/cash instead of /booking
    const res = await axios.post(`${BASE_URL}/payment/cash`, 
      paymentData, 
      { withCredentials: true } 
    );

    if (res.data.success) {
      NotificationManager.success("Đặt tour thành công! Vui lòng thanh toán tiền mặt khi nhận tour.");
      navigate("/thank-you");
    } else {
      NotificationManager.error("Đặt tour thất bại: " + res.data.message);
    }
  } catch (error) {
    console.error("Lỗi đặt tour:", error);
    // ... error handling ...
  }
};
```

---

### **STEP 7: Migration Script để cập nhật dữ liệu cũ**

File: `migration_update_payments.js` (tạo mới ở root)

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "./backend/models/Payment.js";
import Booking from "./backend/models/Booking.js";

dotenv.config();

async function migratePayments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Update existing Payment records: quantity → guestSize
    const payments = await Payment.find({});
    
    for (const payment of payments) {
      if (payment.quantity && !payment.guestSize) {
        payment.guestSize = payment.quantity;
        delete payment.quantity;
        await payment.save();
        console.log(`✅ Updated Payment ${payment._id}: quantity → guestSize`);
      }
    }

    // 2. Create Payment records for existing Cash bookings
    const cashBookings = await Booking.find({ 
      paymentMethod: "Cash",
      // Only bookings without linked payment
    });

    for (const booking of cashBookings) {
      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        userId: booking.userId,
        tourId: booking.tourId,
        bookingId: booking._id
      });

      if (!existingPayment) {
        const newPayment = await Payment.create({
          userId: booking.userId,
          userEmail: booking.userEmail,
          tourId: booking.tourId,
          bookingId: booking._id,
          orderId: `CASH_MIGRATED_${Date.now()}_${booking._id}`,
          amount: booking.totalAmount,
          status: 'Success', // Assume old bookings are confirmed
          payType: 'Cash',
          tourName: booking.tourName,
          fullName: booking.fullName,
          phone: booking.phone,
          guestSize: booking.guestSize,
          guests: booking.guests || [],
          singleRoomCount: booking.singleRoomCount || 0,
          basePrice: booking.basePrice || 0,
          appliedDiscounts: booking.appliedDiscounts || [],
          appliedSurcharges: booking.appliedSurcharges || [],
          province: booking.province,
          district: booking.district,
          ward: booking.ward,
          addressDetail: booking.addressDetail,
          createdAt: booking.createdAt,
          paidAt: booking.createdAt
        });

        console.log(`✅ Created Payment for Cash Booking ${booking._id}`);
      }
    }

    console.log("✅ Migration completed!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migratePayments();
```

---

## 🎯 **TÓM TẮT NHỮNG THAY ĐỔI**

### ✅ Đã fix:
1. **Payment Model**: Thêm đầy đủ fields (guests, pricing details, bookingId)
2. **Cash Payment**: Tạo Payment + Booking cùng lúc, giống MoMo
3. **MoMo IPN**: Tự động tạo Booking khi thanh toán thành công
4. **Admin Role**: Chỉ confirm/reject, không còn phải click để tạo Booking
5. **Field naming**: Đồng nhất `guestSize` cho cả Payment và Booking
6. **Data integrity**: Booking luôn có đầy đủ thông tin từ Payment

### ✅ Lợi ích:
1. **Đồng bộ**: 2 phương thức thanh toán có cùng flow
2. **Tự động**: MoMo tự động tạo Booking, không cần admin click
3. **Tracking tốt hơn**: Mọi thanh toán đều có Payment record
4. **Dễ báo cáo**: Thống kê doanh thu từ Payment collection
5. **Ít lỗi**: Giảm thiểu thao tác thủ công của admin

---

## 📝 **CHECKLIST TRIỂN KHAI**

- [ ] 1. Backup database trước khi thay đổi
- [ ] 2. Cập nhật Payment Model (thêm fields mới)
- [ ] 3. Tạo endpoint POST /payment/cash
- [ ] 4. Cập nhật endpoint POST /payment/momo (lưu đầy đủ thông tin)
- [ ] 5. Cập nhật MoMo IPN handler (tự động tạo Booking)
- [ ] 6. Cập nhật Admin update status (không tạo Booking, chỉ confirm)
- [ ] 7. Cập nhật Frontend Booking.jsx (đổi sang /payment/cash)
- [ ] 8. Test Cash payment flow
- [ ] 9. Test MoMo payment flow
- [ ] 10. Test Admin confirm/reject
- [ ] 11. Chạy migration script cho dữ liệu cũ
- [ ] 12. Deploy lên production

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

1. **Breaking Changes**: Những thay đổi này ảnh hưởng đến cấu trúc database và API
2. **Testing**: Phải test kỹ cả Cash và MoMo flow trước khi deploy
3. **Migration**: Phải chạy migration script để cập nhật dữ liệu cũ
4. **Rollback Plan**: Chuẩn bị plan để rollback nếu có vấn đề

---

**Tác giả**: GitHub Copilot  
**Ngày**: 2025-10-20  
**Version**: 1.0
