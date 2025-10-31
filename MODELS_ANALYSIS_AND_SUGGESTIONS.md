# 🗄️ PHÂN TÍCH MODELS & ĐỀ XUẤT BỔ SUNG

## 📊 TỔNG QUAN MODELS HIỆN CÓ

### ✅ Core Models (10 models)
1. **User** - Quản lý người dùng
2. **Tour** - Quản lý tour du lịch
3. **Booking** - Quản lý đặt tour
4. **Payment** - Quản lý thanh toán
5. **Review** - Đánh giá tour
6. **Chat** - Tin nhắn chat
7. **Favorite** - Tour yêu thích
8. **LoginHistory** - Lịch sử đăng nhập
9. **UserStatus** - Trạng thái online/offline
10. **PricingRule** - Quy tắc giá linh hoạt

---

## 🔍 PHÂN TÍCH CHI TIẾT

### 1. User Model ⭐⭐⭐⭐
```javascript
{
  username, email, password, photo, role, timestamps
}
```

**✅ Tốt:**
- Đầy đủ thông tin cơ bản
- Có role-based access control

**❌ Thiếu:**
- 📞 Không có phone number
- 📅 Không có dateOfBirth (cần cho age verification)
- 🆔 Không có ID verification (CCCD/Passport cho booking quốc tế)
- 📍 Không có địa chỉ mặc định
- 🎂 Không có gender (có thể cần cho phân phòng tour)
- 🔒 Không có account status (active/suspended/deleted)
- ✅ Không có email/phone verification status

---

### 2. Tour Model ⭐⭐⭐⭐⭐
```javascript
{
  title, city, address, distance, photos, desc, price,
  maxGroupSize, minGroupSize, startDate, endDate,
  currentBookings, reviews, featured,
  itinerary[], transportation, activities[],
  hotelInfo, mealsIncluded[]
}
```

**✅ Tốt:**
- Rất đầy đủ, có cả itinerary chi tiết
- Có tracking currentBookings

**❌ Thiếu:**
- 👥 Không có tourGuideId (hướng dẫn viên)
- 📦 Không có tour category/tags
- 🌍 Không có destination details (điểm đến phụ)
- ⚠️ Không có cancellation policy
- 📋 Không có included/excluded services chi tiết
- 🎫 Không có tour status (active/cancelled/completed)
- 💺 Không có số chỗ đã hủy (để tính available slots chính xác)
- 🗺️ Không có difficulty level
- 🌤️ Không có best season to visit

---

### 3. Booking Model ⭐⭐⭐⭐⭐
```javascript
{
  userId, tourId, fullName, guestSize, guests[],
  phone, bookAt, totalAmount, paymentMethod, paymentStatus,
  province, district, ward, addressDetail,
  appliedDiscounts[], appliedSurcharges[]
}
```

**✅ Tốt:**
- Chi tiết guests với pricing
- Có địa chỉ đầy đủ
- Track payment status

**❌ Thiếu:**
- 🎫 Không có booking status lifecycle (confirmed → preparing → in-progress → completed)
- 📋 Không có special requests/notes
- 🔄 Không có cancellation info (cancelledAt, cancelReason, refundAmount)
- 📧 Không có emergency contact
- 🚗 Không có pickup location/time
- 📄 Không có booking reference/code cho khách
- ⚠️ Không có admin notes
- 📱 Không có QR code cho check-in

---

### 4. Payment Model ⭐⭐⭐⭐
```javascript
{
  bookingId, orderId, amount, status, payType,
  momoTransId, momoRequestId, createdAt, paidAt
}
```

**✅ Tốt:**
- Simplified, không duplicate data
- Virtual getter sang Booking

**❌ Thiếu:**
- 💰 Không có refund tracking (refundAmount, refundedAt, refundReason)
- 🧾 Không có invoice number
- 💳 Không có payment gateway response details
- 📊 Không có transaction fees
- 🔄 Không có partial payment support (đặt cọc)

---

### 5. Review Model ⭐⭐⭐
```javascript
{
  productId, username, reviewText, rating, timestamps
}
```

**✅ Tốt:**
- Đơn giản, dễ dùng

**❌ Thiếu:**
- 👤 Không có userId (chỉ có username string)
- 📸 Không có review photos/videos
- 👍 Không có helpful votes (like/dislike)
- ✅ Không có verified purchase flag
- 💬 Không có admin reply
- 🎯 Không có review categories (tour guide, food, hotel, itinerary)
- 🚫 Không có review status (pending/approved/rejected)

---

### 6. Chat Model ⭐⭐⭐
```javascript
{
  senderId, chatRoomId, text, createdAt, timestamps
}
```

**✅ Tốt:**
- Có index tối ưu

**❌ Thiếu:**
- 📁 Không có message type (text/image/file)
- 📎 Không có attachments
- ✅ Không có read status
- 💬 Không có reply/thread support
- 🔗 Không có link với booking (chat về booking cụ thể)

---

### 7. Favorite Model ⭐⭐⭐⭐
```javascript
{
  userId, tourId
}
```

**✅ Tốt:**
- Đơn giản, đúng mục đích

**❌ Có thể thêm:**
- 📅 createdAt để track khi nào user thích
- 🔔 notification preference (thông báo khi giá giảm)

---

### 8. LoginHistory Model ⭐⭐⭐⭐
```javascript
{
  userId, ipAddress, userAgent, location,
  isSuspicious, loginAt, timestamps
}
```

**✅ Tốt:**
- Đầy đủ cho security audit

**❌ Có thể thêm:**
- ✅ loginStatus (success/failed)
- 🔐 failureReason
- 📱 deviceType (mobile/desktop/tablet)
- 🌍 geoLocation details (country, city)

---

### 9. UserStatus Model ⭐⭐⭐⭐
```javascript
{
  userId, isOnline, lastSeen, socketId, timestamps
}
```

**✅ Tốt:**
- Đúng mục đích cho real-time

**❌ Có thể thêm:**
- 📱 currentDevice info
- 🔔 notification settings

---

### 10. PricingRule Model ⭐⭐⭐⭐⭐
```javascript
{
  tourId, name, description, type,
  ageBrackets[], seasonalPricing[], promotion, surcharge,
  isActive, timestamps
}
```

**✅ Tốt:**
- Rất flexible và powerful
- Support nhiều loại pricing

**❌ Có thể thêm:**
- 📊 usage statistics
- 🎯 priority/order (khi nhiều rules overlap)
- 👥 minimum/maximum group size for rule
- 🔒 combinable with other rules flag

---

## 🎯 ĐỀ XUẤT MODELS MỚI (Priority Order)

### 🔥 PRIORITY 1 - CRITICAL (Cần ngay)

#### 1. **TourGuide Model** ⭐⭐⭐⭐⭐
**Tại sao cần:** Tour du lịch PHẢI có hướng dẫn viên!

```javascript
const TourGuideSchema = new mongoose.Schema({
  // Basic Info
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  photo: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ["male", "female", "other"] },
  
  // Professional Info
  licenseNumber: { type: String, required: true, unique: true }, // Số thẻ HDV
  licenseType: { 
    type: String, 
    enum: ["domestic", "international", "both"] 
  },
  languages: [{ 
    language: String, 
    proficiency: { type: String, enum: ["basic", "intermediate", "fluent", "native"] }
  }],
  specialties: [String], // ["Cultural", "Adventure", "Food", "Historical"]
  experience: Number, // years
  
  // Ratings & Reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalTours: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Types.ObjectId, ref: "GuideReview" }],
  
  // Availability
  status: { 
    type: String, 
    enum: ["active", "inactive", "on-leave", "suspended"],
    default: "active"
  },
  availability: [{
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ["available", "booked", "unavailable"] }
  }],
  
  // Financial
  salary: Number,
  commissionRate: Number, // % commission per tour
  
  // Documents
  certifications: [{
    name: String,
    issuer: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  
  // Emergency
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Metadata
  bio: String,
  userId: { type: mongoose.Types.ObjectId, ref: "User" }, // Link to User account
  
}, { timestamps: true });

// Indexes
TourGuideSchema.index({ licenseNumber: 1 });
TourGuideSchema.index({ status: 1 });
TourGuideSchema.index({ rating: -1 });
```

**Use cases:**
- Assign guide cho tour
- Track guide availability
- Guest rating guide riêng
- Quản lý lương/commission
- Compliance với luật du lịch VN

---

#### 2. **Notification Model** ⭐⭐⭐⭐⭐
**Tại sao cần:** User cần biết booking status, payment status, promotion!

```javascript
const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      "booking_confirmed",
      "payment_success",
      "payment_failed",
      "tour_reminder",
      "tour_cancelled",
      "tour_updated",
      "review_request",
      "promotion",
      "chat_message",
      "system"
    ],
    required: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related entities
  relatedBooking: { type: mongoose.Types.ObjectId, ref: "Booking" },
  relatedTour: { type: mongoose.Types.ObjectId, ref: "Tour" },
  relatedPayment: { type: mongoose.Types.ObjectId, ref: "Payment" },
  
  // Metadata
  data: mongoose.Schema.Types.Mixed, // Extra data as JSON
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: Date,
  
  // Delivery channels
  channels: [{
    type: { type: String, enum: ["in-app", "email", "sms", "push"] },
    status: { type: String, enum: ["pending", "sent", "failed"] },
    sentAt: Date,
    error: String
  }],
  
  // Priority
  priority: { 
    type: String, 
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  
  // Actions
  actionUrl: String, // Deep link
  actionLabel: String, // "View Booking", "Pay Now"
  
  expiresAt: Date, // For temporary notifications
  
}, { timestamps: true });

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

**Use cases:**
- Thông báo booking confirmed
- Nhắc nhở thanh toán
- Nhắc nhở tour sắp đến
- Promotion/discount alerts
- Chat message notifications

---

#### 3. **Refund Model** ⭐⭐⭐⭐⭐
**Tại sao cần:** Hủy tour cần xử lý hoàn tiền!

```javascript
const RefundSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Booking", 
    required: true 
  },
  paymentId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Payment", 
    required: true 
  },
  
  // Refund details
  originalAmount: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  refundPercentage: Number,
  
  // Reason
  reason: {
    type: String,
    enum: [
      "customer_request",
      "tour_cancelled",
      "force_majeure",
      "service_issue",
      "payment_error",
      "other"
    ],
    required: true
  },
  reasonDetails: String,
  
  // Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "processing", "completed", "failed"],
    default: "pending"
  },
  
  // Processing
  requestedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  requestedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  approvedAt: Date,
  processedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  processedAt: Date,
  completedAt: Date,
  
  // Fees
  cancellationFee: { type: Number, default: 0 },
  processingFee: { type: Number, default: 0 },
  
  // Payment method
  refundMethod: {
    type: String,
    enum: ["original_payment", "bank_transfer", "cash", "voucher"],
    default: "original_payment"
  },
  
  // Bank details (if refundMethod = bank_transfer)
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    branch: String
  },
  
  // Transaction tracking
  transactionId: String, // MoMo/Bank transaction ID
  transactionProof: String, // URL to proof document
  
  // Notes
  adminNotes: String,
  customerNotes: String,
  
}, { timestamps: true });

// Indexes
RefundSchema.index({ bookingId: 1 });
RefundSchema.index({ status: 1, createdAt: -1 });
```

**Use cases:**
- Xử lý yêu cầu hủy tour
- Track refund process
- Tính phí hủy theo policy
- Audit trail

---

### 🔥 PRIORITY 2 - HIGH (Nên có)

#### 4. **Voucher/Coupon Model** ⭐⭐⭐⭐
**Tại sao cần:** Marketing, promotion campaigns!

```javascript
const VoucherSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true
  },
  
  name: { type: String, required: true },
  description: String,
  
  // Discount details
  discountType: {
    type: String,
    enum: ["percentage", "fixed_amount", "free_shipping"],
    required: true
  },
  discountValue: { type: Number, required: true },
  maxDiscount: Number, // For percentage type
  
  // Usage limits
  totalUsageLimit: Number, // Total times can be used
  usagePerUser: { type: Number, default: 1 },
  currentUsage: { type: Number, default: 0 },
  
  // Validity
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Conditions
  minOrderAmount: { type: Number, default: 0 },
  maxOrderAmount: Number,
  applicableTours: [{ type: mongoose.Types.ObjectId, ref: "Tour" }], // Empty = all tours
  applicableCategories: [String],
  excludedTours: [{ type: mongoose.Types.ObjectId, ref: "Tour" }],
  
  // User restrictions
  applicableUsers: [{ type: mongoose.Types.ObjectId, ref: "User" }], // Empty = all users
  userLevel: { type: String, enum: ["all", "new", "regular", "vip"] },
  firstBookingOnly: { type: Boolean, default: false },
  
  // Status
  status: {
    type: String,
    enum: ["active", "inactive", "expired", "depleted"],
    default: "active"
  },
  
  // Metadata
  campaign: String, // Campaign name
  createdBy: { type: mongoose.Types.ObjectId, ref: "User" },
  
}, { timestamps: true });

// Indexes
VoucherSchema.index({ code: 1 });
VoucherSchema.index({ status: 1, startDate: 1, endDate: 1 });
VoucherSchema.index({ endDate: 1 }); // For auto-expiry
```

**Companion Model: VoucherUsage**
```javascript
const VoucherUsageSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Types.ObjectId, ref: "Voucher", required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: mongoose.Types.ObjectId, ref: "Booking", required: true },
  discountApplied: { type: Number, required: true },
  usedAt: { type: Date, default: Date.now }
}, { timestamps: true });

VoucherUsageSchema.index({ voucherId: 1, userId: 1 });
```

---

#### 5. **TourCategory Model** ⭐⭐⭐⭐
**Tại sao cần:** Phân loại tour, dễ search!

```javascript
const TourCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  image: String,
  
  // Hierarchy
  parentCategory: { type: mongoose.Types.ObjectId, ref: "TourCategory" },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  // Status
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  
  // Stats
  tourCount: { type: Number, default: 0 },
  
}, { timestamps: true });

TourCategorySchema.index({ slug: 1 });
TourCategorySchema.index({ parentCategory: 1, displayOrder: 1 });
```

**Update Tour Model:**
```javascript
// Add to Tour model:
categories: [{ type: mongoose.Types.ObjectId, ref: "TourCategory" }],
tags: [String],
```

**Examples:**
- Domestic / International
- Adventure / Relaxation / Cultural / Beach / Mountain
- Short trip / Weekend / Week-long
- Family / Couple / Solo / Group

---

#### 6. **Insurance Model** ⭐⭐⭐
**Tại sao cần:** Du lịch cần bảo hiểm!

```javascript
const InsuranceSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Booking", 
    required: true 
  },
  
  // Provider
  provider: { type: String, required: true }, // "Bảo Việt", "PVI", etc.
  policyNumber: { type: String, required: true, unique: true },
  
  // Coverage
  coverageType: {
    type: String,
    enum: ["basic", "standard", "premium"],
    required: true
  },
  coverageAmount: { type: Number, required: true },
  
  // Details
  insuredPeople: [{
    guestName: String,
    idNumber: String,
    dateOfBirth: Date,
    relationship: String
  }],
  
  // Premium
  premium: { type: Number, required: true },
  
  // Validity
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Status
  status: {
    type: String,
    enum: ["pending", "active", "expired", "claimed", "cancelled"],
    default: "pending"
  },
  
  // Documents
  policyDocument: String, // URL
  certificateDocument: String, // URL
  
  // Claims
  claims: [{
    claimDate: Date,
    claimAmount: Number,
    claimStatus: String,
    claimDescription: String
  }],
  
}, { timestamps: true });

InsuranceSchema.index({ bookingId: 1 });
InsuranceSchema.index({ policyNumber: 1 });
```

---

### 🔥 PRIORITY 3 - MEDIUM (Nice to have)

#### 7. **TourItineraryDay Model** (Tách riêng từ Tour)
**Tại sao:** Itinerary phức tạp nên tách riêng!

```javascript
const ItineraryDaySchema = new mongoose.Schema({
  tourId: { type: mongoose.Types.ObjectId, ref: "Tour", required: true },
  day: { type: Number, required: true },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Detailed activities
  activities: [{
    time: String, // "08:00 AM"
    title: String,
    description: String,
    location: {
      name: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    duration: Number, // minutes
    photos: [String]
  }],
  
  // Meals
  meals: [{
    type: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"] },
    venue: String,
    menuDescription: String,
    isIncluded: { type: Boolean, default: true }
  }],
  
  // Accommodation
  accommodation: {
    hotelName: String,
    hotelRating: Number,
    roomType: String,
    checkIn: String,
    checkOut: String
  },
  
  // Transportation
  transportation: {
    type: String, // "Bus", "Flight", etc.
    departureTime: String,
    arrivalTime: String,
    details: String
  },
  
  // Highlights
  highlights: [String],
  
  // Notes
  notes: String,
  warningsOrTips: [String],
  
}, { timestamps: true });

ItineraryDaySchema.index({ tourId: 1, day: 1 });
```

---

#### 8. **FAQ Model** ⭐⭐⭐
```javascript
const FAQSchema = new mongoose.Schema({
  tourId: { type: mongoose.Types.ObjectId, ref: "Tour" }, // null = general FAQ
  
  question: { type: String, required: true },
  answer: { type: String, required: true },
  
  category: {
    type: String,
    enum: ["booking", "payment", "cancellation", "tour_details", "general"],
    default: "general"
  },
  
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  
  // Stats
  viewCount: { type: Number, default: 0 },
  helpfulCount: { type: Number, default: 0 },
  
}, { timestamps: true });
```

---

#### 9. **WaitlistModel** ⭐⭐⭐
**Khi tour full, user đăng ký waiting list**

```javascript
const WaitlistSchema = new mongoose.Schema({
  tourId: { type: mongoose.Types.ObjectId, ref: "Tour", required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  
  requestedSlots: { type: Number, required: true },
  priority: { type: Number, default: 0 }, // VIP customers get higher priority
  
  status: {
    type: String,
    enum: ["waiting", "notified", "expired", "cancelled", "converted"],
    default: "waiting"
  },
  
  notifiedAt: Date,
  expiresAt: Date, // Notification expires after X hours
  
  notes: String,
  
}, { timestamps: true });

WaitlistSchema.index({ tourId: 1, status: 1, priority: -1, createdAt: 1 });
```

---

#### 10. **AdminActivity/AuditLog Model** ⭐⭐⭐
**Track admin actions for security & compliance**

```javascript
const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  
  action: {
    type: String,
    enum: [
      "create", "update", "delete",
      "approve", "reject", "cancel",
      "refund", "assign", "unassign"
    ],
    required: true
  },
  
  entityType: {
    type: String,
    enum: ["Tour", "Booking", "Payment", "User", "Refund", "Review", "etc"],
    required: true
  },
  entityId: { type: mongoose.Types.ObjectId, required: true },
  
  changes: mongoose.Schema.Types.Mixed, // { before: {...}, after: {...} }
  
  ipAddress: String,
  userAgent: String,
  
  notes: String,
  
}, { timestamps: true });

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
```

---

### 🔥 PRIORITY 4 - LOW (Future enhancements)

#### 11. **Loyalty/Points Model**
#### 12. **ReferralProgram Model**
#### 13. **Blog/Article Model** (Content marketing)
#### 14. **EmailTemplate Model** (Email automation)
#### 15. **Report/Analytics Model** (Business intelligence)

---

## 📊 SUMMARY & RECOMMENDATIONS

### **Implement ngay (This Sprint):**
1. ✅ **TourGuide** - Critical cho tour management
2. ✅ **Notification** - Essential UX improvement
3. ✅ **Refund** - Cần cho cancellation policy

### **Implement tiếp (Next Sprint):**
4. ✅ **Voucher** - Marketing/Sales
5. ✅ **TourCategory** - Better organization
6. ✅ **Insurance** - Added value service

### **Plan cho tương lai (Backlog):**
7. ⏰ FAQ, Waitlist, AuditLog
8. ⏰ Loyalty, Referral, Blog
9. ⏰ Advanced analytics

---

## 🔧 RECOMMENDED UPDATES TO EXISTING MODELS

### **User Model - Add fields:**
```javascript
phone: { type: String, required: true },
dateOfBirth: Date,
gender: { type: String, enum: ["male", "female", "other"] },
idNumber: String, // CCCD/Passport
idType: { type: String, enum: ["citizen_id", "passport"] },
address: {
  province: String,
  district: String,
  ward: String,
  detail: String
},
isVerified: { type: Boolean, default: false },
verifiedAt: Date,
accountStatus: { 
  type: String, 
  enum: ["active", "suspended", "deleted"],
  default: "active"
},
loyaltyPoints: { type: Number, default: 0 },
```

### **Tour Model - Add fields:**
```javascript
tourGuideId: { type: mongoose.Types.ObjectId, ref: "TourGuide" },
categories: [{ type: mongoose.Types.ObjectId, ref: "TourCategory" }],
tags: [String],
difficulty: { type: String, enum: ["easy", "moderate", "hard"] },
status: { 
  type: String, 
  enum: ["draft", "active", "cancelled", "completed"],
  default: "draft"
},
cancellationPolicy: {
  daysBeforeDeparture: Number,
  refundPercentage: Number,
  policyText: String
},
includedServices: [String],
excludedServices: [String],
availableSlots: Number, // maxGroupSize - currentBookings - cancelled
```

### **Booking Model - Add fields:**
```javascript
bookingCode: { type: String, unique: true }, // e.g., "BK20251030001"
status: {
  type: String,
  enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
  default: "pending"
},
specialRequests: String,
emergencyContact: {
  name: String,
  phone: String,
  relationship: String
},
pickupLocation: String,
pickupTime: String,
cancelledAt: Date,
cancelReason: String,
adminNotes: String,
qrCode: String, // For check-in
```

### **Review Model - Add fields:**
```javascript
userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
bookingId: { type: mongoose.Types.ObjectId, ref: "Booking" },
photos: [String],
helpfulVotes: { type: Number, default: 0 },
isVerifiedPurchase: { type: Boolean, default: false },
status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},
adminReply: {
  text: String,
  repliedAt: Date,
  repliedBy: { type: mongoose.Types.ObjectId, ref: "User" }
},
ratings: {
  tourGuide: Number,
  food: Number,
  hotel: Number,
  itinerary: Number,
  value: Number
},
```

### **Chat Model - Add fields:**
```javascript
messageType: {
  type: String,
  enum: ["text", "image", "file", "system"],
  default: "text"
},
attachments: [{
  type: String,
  url: String,
  filename: String,
  size: Number
}],
isRead: { type: Boolean, default: false },
readAt: Date,
relatedBooking: { type: mongoose.Types.ObjectId, ref: "Booking" },
replyTo: { type: mongoose.Types.ObjectId, ref: "Chat" }, // For threading
```

---

## 🎯 TỔNG KẾT

**Models hiện tại:** Khá đầy đủ cho basic tour management  
**Thiếu chính:** TourGuide, Notification, Refund, Voucher  
**Cần update:** User, Tour, Booking, Review, Chat  

**Recommendation:** Implement 3 critical models (TourGuide, Notification, Refund) trước, sau đó update existing models, rồi mới thêm nice-to-have models.

