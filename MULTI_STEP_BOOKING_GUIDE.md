# Multi-Step Booking Implementation

## 📋 Tổng quan

Đã refactor booking flow từ **Single-page form** → **Multi-step wizard** để cải thiện UX/UI và conversion rate.

## 🎯 Lợi ích

### 1. **User Experience tốt hơn** 👍
- Giảm cognitive load (không bị overwhelmed với quá nhiều fields)
- Focus vào 1 nhóm thông tin mỗi lúc
- Progress bar giúp user biết đang ở đâu trong flow

### 2. **Tỷ lệ hoàn thành cao hơn** 📈
- Research cho thấy multi-step form có conversion rate cao hơn 10-30%
- User dễ commit với form ngắn hơn

### 3. **Validation tốt hơn** ✔️
- Validate từng bước → phát hiện lỗi sớm
- Không phải scroll lên xuống để sửa lỗi

### 4. **Mobile-friendly** 📱
- Form dài rất khó dùng trên mobile
- Multi-step dễ scroll, dễ focus input

### 5. **Business Logic rõ ràng** 💼
- **Bước 1**: User xem giá → quyết định có đặt không
- **Bước 2**: Điền thông tin → commit
- **Bước 3**: Thanh toán → hoàn tất

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────┐
│  MultiStepBooking.jsx (Container)               │
│  - Quản lý state chung (bookingData)            │
│  - Điều hướng giữa các bước                      │
│  - Progress bar                                  │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Step 1  │ │  Step 2  │ │  Step 3  │
│ Options  │ │Guest Info│ │ Payment  │
└──────────┘ └──────────┘ └──────────┘
```

## 📁 File Structure

```
frontend/src/components/Booking/
├── MultiStepBooking.jsx          # Container chính
├── Step1SelectOptions.jsx        # Bước 1: Chọn số khách, phòng đơn
├── Step2GuestInfo.jsx            # Bước 2: Thông tin chi tiết
├── Step3Payment.jsx              # Bước 3: Thanh toán
├── multi-step-booking.css        # Styles cho multi-step
├── ThongTinGiaTour.jsx           # Component hiển thị pricing rules
├── Booking_Old.jsx               # Backup của form cũ (single-page)
└── booking.css                   # Styles cũ (vẫn dùng chung)
```

## 🔄 Flow Chi Tiết

### **Bước 1: Chọn Tùy Chọn**
**Mục đích**: User chọn số lượng khách và xem giá trước

**Fields:**
- Số lượng khách (thêm/xóa động)
- Tuổi từng khách (auto-detect guest type)
- Loại khách (adult/child/infant/senior/student)
- Số phòng đơn

**Tính năng:**
- ✅ Auto-calculate giá khi thay đổi guests/singleRoomCount
- ✅ Hiển thị pricing rules của tour
- ✅ Preview giá tổng cộng
- ✅ Validate số slots còn trống
- ✅ Disable nút Continue khi có lỗi pricing

**API Calls:**
```javascript
POST /pricing/calculate
Body: { tourId, bookingDate, guests, singleRoomCount }
```

**Validation:**
- Ít nhất 1 khách
- Pricing API phải thành công
- Không được vượt quá available slots

---

### **Bước 2: Thông Tin Đặt Tour**
**Mục đích**: Thu thập thông tin liên hệ và chi tiết khách

**Fields:**
- Họ tên người đặt (required)
- Số điện thoại (required, format 10-11 digits)
- Họ tên từng khách (required)
- Địa chỉ đón: Tỉnh/Huyện/Xã + Chi tiết (required)

**Tính năng:**
- ✅ Hiển thị tuổi/loại khách đã chọn ở bước 1
- ✅ LocationSelect component cho địa chỉ
- ✅ Summary card hiển thị tổng quan
- ✅ Back button để quay lại bước 1

**Validation:**
- Họ tên không để trống
- SĐT đúng format (regex)
- Tất cả khách phải có tên
- Địa chỉ đầy đủ (tỉnh/huyện/xã/chi tiết)

---

### **Bước 3: Thanh Toán**
**Mục đích**: Review toàn bộ thông tin và xác nhận

**Sections:**
1. **Thông tin đặt tour** (tour, ngày, người đặt, địa chỉ)
2. **Danh sách khách** (tên, tuổi, loại, giá)
3. **Chi tiết giá** (base price, discounts, surcharges, total)
4. **Chọn phương thức thanh toán** (Cash/MoMo)

**Tính năng:**
- ✅ Hiển thị toàn bộ thông tin để review
- ✅ Radio buttons cho payment method
- ✅ Visual feedback khi chọn payment method
- ✅ Loading state khi đang xử lý
- ✅ Back button để sửa thông tin

**Payment Methods:**

**💵 Cash:**
```javascript
POST /payment/cash
→ Navigate to /thank-you
```

**📱 MoMo:**
```javascript
POST /payment/momo
→ Redirect to MoMo payment URL
→ IPN callback updates booking status
```

---

## 🎨 UI/UX Features

### Progress Bar
- 3 steps: "Chọn tùy chọn" → "Thông tin khách" → "Thanh toán"
- Visual indicators: circle numbers, labels, connecting lines
- Active step highlighted with orange color
- Checkmark icon khi hoàn thành step

### Transitions
- Smooth fadeInUp animation khi chuyển step
- Scroll to top automatically
- 0.4s animation duration

### Responsive Design
- Desktop: Full width progress bar with labels
- Tablet: Smaller circles, readable labels
- Mobile: Hide labels, show only circles

### Color Scheme
- Primary: `#ff7e01` (orange)
- Active state: Orange with glow effect
- Success: Green for discounts
- Warning: Yellow for surcharges
- Error: Red for validation errors

---

## 📊 State Management

### Shared State (bookingData)
```javascript
{
  // Step 1
  guestSize: 1,
  singleRoomCount: 0,
  guests: [{ fullName: "", age: 30, guestType: "adult" }],
  pricingData: null,
  
  // Step 2
  fullName: "",
  phone: "",
  province: { code: "", name: "" },
  district: { code: "", name: "" },
  ward: { code: "", name: "" },
  addressDetail: "",
  
  // User context
  userId: user._id,
  userEmail: user.email
}
```

### State Flow
1. Parent `MultiStepBooking` holds all state
2. Each step receives `bookingData` and `updateBookingData`
3. Step validates locally before calling `nextStep()`
4. State persists across all steps

---

## 🔒 Validation Rules

### Step 1
- [ ] Ít nhất 1 guest
- [ ] Pricing API must succeed
- [ ] Not exceed available slots
- [ ] No pricing error

### Step 2
- [ ] Full name not empty
- [ ] Phone matches regex `/^[0-9]{10,11}$/`
- [ ] All guests have names
- [ ] Province/District/Ward selected
- [ ] Address detail not empty

### Step 3
- [ ] Payment method selected
- [ ] (Automatic validation - all data ready from previous steps)

---

## 🚀 Backend Integration

### Pricing Calculation
```javascript
// Endpoint: POST /pricing/calculate
// Auth: verifyToken (must be logged in)

Request:
{
  tourId: "...",
  bookingDate: Date,
  guests: [{ age, guestType }],
  singleRoomCount: Number
}

Response:
{
  success: true,
  data: {
    basePrice: Number,
    totalAmount: Number,
    guestPrices: [{ basePrice, finalPrice, discounts, surcharges }],
    appliedDiscounts: [...],
    appliedSurcharges: [...]
  }
}
```

### Cash Payment
```javascript
// Endpoint: POST /payment/cash

Request:
{
  userId, userEmail, fullName, phone,
  tourId, tourName, guestSize,
  guests: [{ fullName, age, guestType, price, discounts, surcharges }],
  singleRoomCount, totalAmount, basePrice,
  appliedDiscounts, appliedSurcharges,
  province, district, ward, addressDetail,
  bookAt: Date
}

Response:
{
  success: true,
  data: { payment, booking }
}
```

### MoMo Payment
```javascript
// Endpoint: POST /payment/momo
// Same request as Cash, plus:

{
  amount: totalAmount,
  orderId: "ORDER_timestamp",
  orderInfo: "Thanh toán tour: ..."
}

Response:
{
  payUrl: "https://payment.momo.vn/..."
}
```

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Step 1: Add/remove guests works
- [ ] Step 1: Auto guest type detection works
- [ ] Step 1: Pricing calculation triggers on change
- [ ] Step 1: Cannot continue with pricing error
- [ ] Step 2: Phone validation works
- [ ] Step 2: All guests must have names
- [ ] Step 2: LocationSelect works
- [ ] Step 3: Summary shows correct data
- [ ] Step 3: Cash payment creates booking
- [ ] Step 3: MoMo redirects to payment URL
- [ ] Back button preserves data
- [ ] Progress bar updates correctly

### Edge Cases
- [ ] User not logged in (redirect to login)
- [ ] Tour expired/ongoing (disable booking)
- [ ] No available slots (disable booking)
- [ ] Pricing API down (show error)
- [ ] Network error during payment (show error)
- [ ] User closes window mid-booking (data lost - expected)

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Mobile browsers

---

## 📈 Metrics to Track

**Before vs After Comparison:**
1. **Conversion Rate**: % users who complete booking
2. **Time to Complete**: Average time from start to finish
3. **Drop-off Rate**: % users who abandon at each step
4. **Error Rate**: How often validation errors occur
5. **Mobile Usage**: % bookings from mobile devices

**Expected Improvements:**
- ✅ 10-30% higher conversion rate
- ✅ 20% faster completion time on mobile
- ✅ 40% reduction in form abandonment

---

## 🔧 Troubleshooting

### Issue: Pricing không tính
**Cause**: User chưa login hoặc token expired
**Fix**: Check `verifyToken` middleware, ensure user logged in

### Issue: Step 2 không validate địa chỉ
**Cause**: LocationSelect chưa return đúng format
**Fix**: Check `location.province.code` exists

### Issue: MoMo payment không redirect
**Cause**: MoMo API credentials sai hoặc backend down
**Fix**: Check `.env` for MoMo keys, verify backend logs

### Issue: Back button mất dữ liệu
**Cause**: State không được update đúng cách
**Fix**: Ensure `updateBookingData()` called before `nextStep()`

---

## 🎓 Best Practices Implemented

1. ✅ **Separation of Concerns**: Mỗi step là 1 component riêng
2. ✅ **Single Source of Truth**: State được quản lý tập trung
3. ✅ **Validation Early**: Validate từng bước trước khi next
4. ✅ **User Feedback**: Loading states, error messages, success notifications
5. ✅ **Accessibility**: Labels, required indicators, keyboard navigation
6. ✅ **Mobile-first**: Responsive design, touch-friendly
7. ✅ **Performance**: Debounced API calls, optimized re-renders

---

## 🔄 Migration Path

### To rollback to old single-page form:
```javascript
// In TourDetails.jsx
import Booking from "../components/Booking/Booking_Old";
// Rename Booking_Old.jsx → Booking.jsx
```

### To customize steps:
1. Edit individual Step files
2. Update validation in each step's `handleContinue()`
3. Update shared `bookingData` schema in `MultiStepBooking.jsx`

---

## 📝 Notes

- Backend API không cần thay đổi gì (100% backward compatible)
- Old `Booking.jsx` được backup thành `Booking_Old.jsx`
- CSS files được tách riêng: `multi-step-booking.css` + `booking.css`
- NotificationManager được reuse từ shared components
- LocationSelect component được reuse (không thay đổi)

---

## 👥 Credits

**Implemented by**: GitHub Copilot AI Assistant  
**Date**: October 26, 2025  
**Project**: Tour Management MernStack  
**Repository**: HuuNhanHUST/Tour-Management-MernStack
