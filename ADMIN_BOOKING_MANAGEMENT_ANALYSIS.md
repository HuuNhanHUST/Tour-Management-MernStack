# 📊 PHÂN TÍCH QUẢN LÝ BOOKING CỦA ADMIN

**Ngày phân tích:** 30/10/2025  
**Phạm vi:** Backend API → Frontend Admin Panel

---

## 1. HIỆN TRẠNG HỆ THỐNG

### ✅ Backend - Đã có sẵn:

#### A. API Endpoints (backend/router/booking.js):
```javascript
GET  /:id                    // Xem chi tiết 1 booking (verifyUser)
GET  /user/my-bookings       // User xem bookings của mình (verifyUser)
GET  /                       // Admin xem TẤT CẢ bookings (verifyAdmin) ✅
```

#### B. Controller Functions (backend/controllers/bookingController.js):
```javascript
✅ getBooking(req, res)           // Lấy 1 booking theo ID
✅ getAllBookings(req, res)       // Lấy tất cả bookings (cho admin)
✅ createBookingFromPayment()     // Helper tạo booking từ payment
✅ updateBookingPaymentStatus()   // Cập nhật trạng thái thanh toán
✅ updateTourSlots()              // Cập nhật số chỗ tour
✅ rollbackTourSlots()            // Hoàn trả chỗ tour
```

#### C. Booking Model Features:
```javascript
- userId, userEmail, tourId, tourName
- fullName, phone, guestSize
- guests[] array với đầy đủ thông tin:
  * fullName, age, guestType
  * price, discounts[], surcharges[]
- Địa chỉ đầy đủ: province, district, ward, addressDetail
- Payment tracking: paymentMethod, paymentStatus
- Timestamps: bookAt, createdAt, updatedAt
- Virtual: payment (populate từ Payment model)
```

#### D. Payment Status Options:
```javascript
enum: ["Pending", "Confirmed", "Failed", "Cancelled"]
```

---

## 2. VẤN ĐỀ PHÁT HIỆN

### 🔴 CRITICAL - Admin Panel THIẾU hoàn toàn:

#### A. Không có trang quản lý bookings:
- ❌ **Không có file:** `frontend/src/pages/admin/Booking/List.jsx`
- ❌ **Không có route:** `/admin/bookings` trong App.js
- ❌ **Không có menu:** Sidebar không có link "Booking Manager"

#### B. Admin không thể:
- ❌ Xem danh sách tất cả bookings
- ❌ Tìm kiếm bookings theo:
  * Tên khách hàng
  * Số điện thoại
  * Tour name
  * Trạng thái thanh toán
  * Khoảng thời gian
- ❌ Xem chi tiết booking
- ❌ Cập nhật trạng thái booking
- ❌ Hủy booking
- ❌ Xuất báo cáo bookings
- ❌ Xem thống kê bookings

#### C. Dashboard có stats nhưng:
- ⚠️ Dashboard hiển thị "Đơn hàng" và "Doanh thu"
- ⚠️ Nhưng KHÔNG có cách xem CHI TIẾT đơn hàng
- ⚠️ Chỉ có biểu đồ, không có danh sách

---

## 3. SO SÁNH VỚI CÁC MODULE KHÁC

### ✅ Tour Manager (Đã có đầy đủ):
```
✅ /admin/tours         → TourList.jsx
✅ /admin/tours/add     → AddTour.jsx
✅ /admin/tours/edit/:id → EditTour.jsx
✅ Sidebar menu: "Tour Manager"
```

### ✅ User Manager (Đã có đầy đủ):
```
✅ /admin/users         → UserList.jsx
✅ Sidebar menu: "User Manager"
```

### ✅ Payment Manager (Đã có):
```
✅ /admin/payments      → PaymentList.jsx
✅ Sidebar menu: "Payment Manager"
```

### ✅ Pricing Manager (Đã có):
```
✅ /admin/pricing       → PricingManager.jsx
✅ Sidebar menu: "Quản lý giá"
```

### ❌ Booking Manager (THIẾU HOÀN TOÀN):
```
❌ Không có page
❌ Không có route
❌ Không có menu
```

---

## 4. KIẾN TRÚC ĐỀ XUẤT CHO ADMIN BOOKING MANAGEMENT

### A. Cấu trúc file cần tạo:

```
frontend/src/pages/admin/Booking/
  ├── List.jsx              // Danh sách bookings với filter & search
  ├── Details.jsx           // Chi tiết booking với actions
  └── BookingStats.jsx      // Thống kê bookings (optional)
```

### B. Route cần thêm vào App.js:

```javascript
import BookingList from "./pages/admin/Booking/List";
import BookingDetails from "./pages/admin/Booking/Details";

<Route path="/admin" element={<AdminLayout />}>
  {/* Existing routes */}
  <Route path="bookings" element={<BookingList />} />
  <Route path="bookings/:id" element={<BookingDetails />} />
</Route>
```

### C. Menu item cần thêm vào AdminLayout.jsx:

```javascript
import { RiFileListLine } from "react-icons/ri";

<li className="nav-item">
  <Link
    className="nav-link text-black px-3 py-2 rounded d-flex align-items-center gap-2"
    to="/admin/bookings"
  >
    <RiFileListLine color="#000" size={20} /> Quản lý Booking
  </Link>
</li>
```

---

## 5. THIẾT KẾ CHI TIẾT BOOKING LIST PAGE

### A. Layout:

```
┌─────────────────────────────────────────────────────┐
│  📋 QUẢN LÝ BOOKING                                 │
├─────────────────────────────────────────────────────┤
│  🔍 Search: [________________]  [Tìm kiếm]         │
│  📅 Từ: [DD/MM/YYYY]  Đến: [DD/MM/YYYY]  [Filter]  │
│  📊 Trạng thái: [All ▼] [Pending] [Confirmed]      │
├─────────────────────────────────────────────────────┤
│  STT | Booking ID | Khách hàng | Tour | Khách      │
│      | Ngày đặt | Tổng tiền | Trạng thái | Actions │
├─────────────────────────────────────────────────────┤
│  1   | #AB123... | Nguyễn A  | Tour HN | 5        │
│      | 20/10/25  | 5,000,000₫| Confirmed | [👁️][✏️] │
├─────────────────────────────────────────────────────┤
│  2   | #CD456... | Trần B    | Tour SG | 3        │
│      | 19/10/25  | 3,500,000₫| Pending   | [👁️][❌] │
└─────────────────────────────────────────────────────┘
       Trang 1 / 5                    [< 1 2 3 4 5 >]
```

### B. Features cần có:

#### 1. Filters & Search:
```javascript
- Search by:
  * Booking ID (mã booking)
  * Tên khách hàng
  * Số điện thoại
  * Tên tour
  
- Filter by:
  * Trạng thái: All | Pending | Confirmed | Failed | Cancelled
  * Phương thức: All | Cash | MoMo
  * Ngày đặt: Date range picker
  * Tour ID: Dropdown select
```

#### 2. Table Columns:
```javascript
- STT (auto number)
- Booking ID (short, clickable)
- Khách hàng (fullName + phone)
- Tour (tourName, clickable to tour details)
- Số khách (guestSize)
- Ngày đặt (bookAt, formatted)
- Tổng tiền (totalAmount, formatted)
- Trạng thái (Badge with colors):
  * Pending: Yellow
  * Confirmed: Green
  * Failed: Red
  * Cancelled: Gray
- Actions:
  * 👁️ View details
  * ✏️ Update status (modal)
  * ❌ Cancel (if Pending)
  * 📧 Email invoice (if Confirmed)
```

#### 3. Pagination:
```javascript
- Items per page: 20, 50, 100
- Current page / Total pages
- Navigate: First, Prev, [Numbers], Next, Last
```

#### 4. Bulk Actions (Optional):
```javascript
- Select multiple bookings
- Bulk update status
- Bulk export CSV/Excel
```

---

## 6. THIẾT KẾ CHI TIẾT BOOKING DETAILS PAGE

### A. Layout:

```
┌─────────────────────────────────────────────────────┐
│  [← Quay lại]          📋 CHI TIẾT BOOKING          │
│                     Mã: #AB123456789                │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ 👤 KHÁCH HÀNG   │  │ 🎫 TOUR                 │  │
│  │ Họ tên: ...     │  │ Tên tour: ...           │  │
│  │ SĐT: ...        │  │ Ngày khởi hành: ...     │  │
│  │ Email: ...      │  │ Điểm đến: ...           │  │
│  │ Địa chỉ: ...    │  │ Số chỗ còn: ...         │  │
│  └─────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  📝 DANH SÁCH KHÁCH (5 người)                       │
│  STT | Họ tên      | Tuổi | Loại    | Giá         │
│  1   | Nguyễn A    | 35   | Adult   | 1,000,000₫  │
│  2   | Trần B      | 32   | Adult   | 1,000,000₫  │
│  3   | Nguyễn C    | 8    | Child   | 500,000₫    │
├─────────────────────────────────────────────────────┤
│  💰 THANH TOÁN                                      │
│  Giá cơ bản:              1,000,000₫ x 5           │
│  Giảm giá:                - 200,000₫               │
│  Phụ thu:                 + 100,000₫               │
│  ─────────────────────────────────────────────────  │
│  Tổng cộng:               4,900,000₫               │
│  Phương thức:             Cash                     │
│  Trạng thái:              [Confirmed]              │
├─────────────────────────────────────────────────────┤
│  📅 LỊCH SỬ                                         │
│  🔵 20/10/2025 14:30 - Booking created (Pending)    │
│  🟢 20/10/2025 15:00 - Payment confirmed            │
├─────────────────────────────────────────────────────┤
│  [Cập nhật trạng thái] [Hủy booking] [In hóa đơn]  │
└─────────────────────────────────────────────────────┘
```

### B. Features:

#### 1. Information Display:
```javascript
- Customer info: fullName, phone, email, full address
- Tour info: tourName, tourId (link), dates, location
- Guest list: Table with all guests details
- Payment breakdown: basePrice, discounts, surcharges, total
- Payment info: method, status with badge
- Timeline: Created, updated, status changes
```

#### 2. Admin Actions:
```javascript
- Update Status Modal:
  * Select new status: Pending/Confirmed/Failed/Cancelled
  * Add reason/note (for cancellation)
  * Confirm & save
  
- Cancel Booking:
  * Confirm dialog
  * Rollback tour slots
  * Update status to "Cancelled"
  * Send email notification
  
- Print Invoice:
  * Generate PDF invoice
  * Include all booking details
  * Company logo & info
```

---

## 7. API INTEGRATION

### A. Fetch All Bookings (List page):

```javascript
const fetchBookings = async (filters) => {
  try {
    const res = await axios.get(
      'http://localhost:4000/api/v1/booking',
      { 
        params: filters, // search, status, dateFrom, dateTo, etc.
        withCredentials: true 
      }
    );
    
    return res.data.data; // Array of bookings
  } catch (err) {
    console.error("Error fetching bookings:", err);
    throw err;
  }
};
```

### B. Fetch Single Booking (Details page):

```javascript
const fetchBookingDetails = async (bookingId) => {
  try {
    const res = await axios.get(
      `http://localhost:4000/api/v1/booking/${bookingId}`,
      { withCredentials: true }
    );
    
    return res.data.data; // Booking object
  } catch (err) {
    console.error("Error fetching booking:", err);
    throw err;
  }
};
```

### C. Update Booking Status (Details page):

```javascript
// ⚠️ CẦN TẠO API MỚI
PUT /api/v1/booking/:id/status

const updateBookingStatus = async (bookingId, newStatus, reason) => {
  try {
    const res = await axios.put(
      `http://localhost:4000/api/v1/booking/${bookingId}/status`,
      { status: newStatus, reason },
      { withCredentials: true }
    );
    
    return res.data.data;
  } catch (err) {
    console.error("Error updating booking:", err);
    throw err;
  }
};
```

### D. Cancel Booking (Details page):

```javascript
// ⚠️ CẦN TẠO API MỚI
POST /api/v1/booking/:id/cancel

const cancelBooking = async (bookingId, reason) => {
  try {
    const res = await axios.post(
      `http://localhost:4000/api/v1/booking/${bookingId}/cancel`,
      { reason },
      { withCredentials: true }
    );
    
    // Backend sẽ:
    // 1. Update booking status → "Cancelled"
    // 2. Rollback tour slots
    // 3. Send notification email
    
    return res.data.data;
  } catch (err) {
    console.error("Error cancelling booking:", err);
    throw err;
  }
};
```

---

## 8. BACKEND ENHANCEMENTS CẦN BỔ SUNG

### A. New API Endpoints cần tạo:

#### 1. Update Booking Status:
```javascript
// backend/router/booking.js
router.put("/:id/status", verifyAdmin, updateBookingStatus);

// backend/controllers/bookingController.js
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Validate status
    const validStatuses = ["Pending", "Confirmed", "Failed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Update status
    booking.paymentStatus = status;
    await booking.save();
    
    // Send notification email
    // await sendStatusUpdateEmail(booking);
    
    res.status(200).json({
      success: true,
      message: "Booking status updated",
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.message
    });
  }
};
```

#### 2. Cancel Booking:
```javascript
// backend/router/booking.js
router.post("/:id/cancel", verifyAdmin, cancelBooking);

// backend/controllers/bookingController.js
export const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Only allow cancelling Pending/Confirmed bookings
    if (!["Pending", "Confirmed"].includes(booking.paymentStatus)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this booking"
      });
    }
    
    // Rollback tour slots
    await rollbackTourSlots(booking.tourId, booking.guestSize, session);
    
    // Update booking status
    booking.paymentStatus = "Cancelled";
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    await booking.save({ session });
    
    await session.commitTransaction();
    
    // Send cancellation email
    // await sendCancellationEmail(booking);
    
    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};
```

### B. Booking Model Updates:

```javascript
// Add new fields to Booking schema
cancellationReason: {
  type: String
},
cancelledAt: {
  type: Date
},
cancelledBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}
```

---

## 9. KẾ HOẠCH TRIỂN KHAI

### Phase 1: Backend API (1-2 days)
- [ ] Tạo endpoint PUT /api/v1/booking/:id/status
- [ ] Tạo endpoint POST /api/v1/booking/:id/cancel
- [ ] Update Booking model với cancellation fields
- [ ] Test API endpoints với Postman

### Phase 2: Frontend - List Page (2-3 days)
- [ ] Tạo file `frontend/src/pages/admin/Booking/List.jsx`
- [ ] Implement table với all bookings
- [ ] Implement search & filter
- [ ] Implement pagination
- [ ] Add route `/admin/bookings`
- [ ] Add menu item "Quản lý Booking"

### Phase 3: Frontend - Details Page (2-3 days)
- [ ] Tạo file `frontend/src/pages/admin/Booking/Details.jsx`
- [ ] Display all booking information
- [ ] Implement status update modal
- [ ] Implement cancel booking feature
- [ ] Implement print invoice (optional)
- [ ] Add route `/admin/bookings/:id`

### Phase 4: Testing & Polish (1-2 days)
- [ ] Test all features
- [ ] Handle edge cases
- [ ] Add loading states
- [ ] Add error handling
- [ ] Responsive design

**Total Estimated Time: 6-10 days**

---

## 10. KẾT LUẬN

### Vấn đề nghiêm trọng:
- ❌ **Admin KHÔNG THỂ quản lý bookings** mặc dù đây là chức năng CORE
- ❌ Backend có API nhưng frontend HOÀN TOÀN THIẾU
- ❌ Không có cách nào để admin xem/sửa/hủy bookings

### Mức độ ưu tiên:
- 🔴 **CRITICAL** - Cần implement NGAY LẬP TỨC
- 🔴 Module này quan trọng ngang với Tour/User management
- 🔴 Thiếu module này làm admin không thể vận hành hệ thống

### So với kiến trúc hiện tại:
- ⚠️ **KHÔNG PHÙHỢP** - Thiếu hoàn toàn một module quan trọng
- ⚠️ Các module khác (Tour, User, Payment) đều có đầy đủ CRUD
- ⚠️ Chỉ có Booking module bị bỏ quên

### Khuyến nghị:
1. ✅ **Implement ngay BookingList và BookingDetails pages**
2. ✅ **Tạo API endpoints cho update status và cancel**
3. ✅ **Add menu item vào sidebar**
4. ✅ **Test kỹ lưỡng trước khi deploy**
