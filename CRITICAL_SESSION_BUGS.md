# 🔴 CRITICAL BUGS FOUND - Payment Session Not Working

**Date:** October 27, 2025  
**Issue:** User cancels MoMo payment but booking still saved with Pending status and slots deducted  
**Root Cause:** Helper functions don't use MongoDB session → Operations outside transaction

---

## 🚨 EXECUTIVE SUMMARY

**Problem:** Mặc dù đã implement MongoDB transactions trong `payment.js`, nhưng transactions **KHÔNG HIỆU QUẢ** vì:

1. ❌ `updateBookingPaymentStatus()` không nhận session parameter
2. ❌ `rollbackTourSlots()` không nhận session parameter  
3. ❌ `updateTourSlots()` không nhận session parameter

→ **Tất cả operations vẫn chạy NGOÀI transaction**  
→ **Database vẫn KHÔNG consistent khi có lỗi**

---

## 🔍 DETAILED BUG ANALYSIS

### ❌ BUG #1: `updateBookingPaymentStatus` OUTSIDE TRANSACTION

**Location:** `backend/controllers/bookingController.js:79-90`

**Current Code:**
```javascript
export const updateBookingPaymentStatus = async (bookingId, paymentStatus) => {
  const booking = await Booking.findById(bookingId); // ❌ NO .session(session)
  booking.paymentStatus = paymentStatus;
  await booking.save(); // ❌ NO { session }
  return booking;
};
```

**Called from:** `backend/router/payment.js`
```javascript
// In /momo-return handler
const session = await mongoose.startSession();
session.startTransaction();
try {
  payment.status = newStatus;
  await payment.save({ session }); // ✅ In transaction
  
  await updateBookingPaymentStatus(booking._id, newStatus); // ❌ OUTSIDE transaction!
  
  await session.commitTransaction();
}
```

**Impact:**
- Booking status updated OUTSIDE transaction
- If transaction aborts → Payment rolls back but Booking stays changed
- Database inconsistency!

---

### ❌ BUG #2: `rollbackTourSlots` OUTSIDE TRANSACTION

**Location:** `backend/controllers/bookingController.js:107-117`

**Current Code:**
```javascript
export const rollbackTourSlots = async (tourId, guestSize) => {
  const tour = await Tour.findById(tourId); // ❌ NO .session(session)
  tour.currentBookings -= guestSize;
  await tour.save(); // ❌ NO { session }
  return tour;
};
```

**Impact:**
- Tour slots rolled back OUTSIDE transaction
- If error after rollback → Slots changed but payment/booking not updated
- Slots count becomes incorrect!

---

### ❌ BUG #3: `updateTourSlots` OUTSIDE TRANSACTION

**Location:** `backend/controllers/bookingController.js:93-103`

**Current Code:**
```javascript
export const updateTourSlots = async (tourId, guestSize) => {
  const tour = await Tour.findById(tourId); // ❌ NO .session(session)
  tour.currentBookings += guestSize;
  await tour.save(); // ❌ NO { session }
  return tour;
};
```

**Impact:**
- Slots reserved OUTSIDE transaction
- If error after reserve → Slots already incremented but booking not created
- Slots count becomes incorrect!

---

## 📊 WHAT ACTUALLY HAPPENS

### Scenario: User Cancels MoMo Payment

```
User cancels payment on MoMo gateway
  ↓
GET /momo-return (resultCode=1006)
  ├─ Start transaction ✅
  ├─ payment.status = 'Cancelled' ✅ IN transaction
  ├─ payment.save({ session }) ✅
  ├─ updateBookingPaymentStatus(id, 'Cancelled') ❌ OUTSIDE transaction
  │   └─ booking.paymentStatus = 'Cancelled' → SAVED TO DB IMMEDIATELY
  ├─ rollbackTourSlots(tourId, 2) ❌ OUTSIDE transaction  
  │   └─ tour.currentBookings -= 2 → SAVED TO DB IMMEDIATELY
  ├─ Commit transaction ✅
  └─ Redirect ✅

RESULT:
Payment.status = "Cancelled" ✅ (in transaction)
Booking.paymentStatus = "Cancelled" ❌ (saved outside transaction)
tour.currentBookings = decremented ❌ (saved outside transaction)
```

**Problem:** If transaction aborts AFTER updating booking/tour but BEFORE commit:
- Payment rolls back to "Pending"
- Booking stays "Cancelled"  
- Tour slots stay decremented
- **DATABASE INCONSISTENT!**

---

## 🔥 WORST CASE SCENARIO

```javascript
GET /momo-return
  ├─ Start transaction
  ├─ payment.status = 'Cancelled' (in session)
  ├─ payment.save({ session }) ✅
  ├─ updateBookingPaymentStatus() → Booking SAVED ❌
  ├─ rollbackTourSlots() → Tour SAVED ❌
  ├─ ❗ NETWORK ERROR / DB DISCONNECTED ❗
  └─ session.abortTransaction()

DATABASE STATE:
✅ Payment.status = "Pending" (rolled back correctly)
❌ Booking.paymentStatus = "Cancelled" (NOT rolled back - was outside transaction!)
❌ tour.currentBookings = decremented (NOT rolled back - was outside transaction!)

ADMIN DASHBOARD:
Payment: "Pending" ← Says payment not completed
Booking: "Cancelled" ← Says booking cancelled
Tour: 2 slots deducted ← Slots lost forever

INCONSISTENCY: Cannot reconcile which is true!
```

---

## ✅ THE FIX

### Step 1: Add `session` parameter to all helper functions

**File:** `backend/controllers/bookingController.js`

```javascript
// ✅ FIX #1: Add session parameter
export const updateBookingPaymentStatus = async (bookingId, paymentStatus, session = null) => {
  const booking = await Booking.findById(bookingId).session(session);
  if (!booking) throw new Error("Booking không tồn tại");

  booking.paymentStatus = paymentStatus;
  await booking.save(session ? { session } : {});
  
  console.log(`✅ Booking ${bookingId} updated to ${paymentStatus}`);
  return booking;
};

// ✅ FIX #2: Add session parameter
export const rollbackTourSlots = async (tourId, guestSize, session = null) => {
  const tour = await Tour.findById(tourId).session(session);
  if (!tour) throw new Error("Tour không tồn tại");

  tour.currentBookings -= guestSize;
  await tour.save(session ? { session } : {});
  
  console.log(`✅ Tour ${tourId} slots rolled back to ${tour.currentBookings}`);
  return tour;
};

// ✅ FIX #3: Add session parameter
export const updateTourSlots = async (tourId, guestSize, session = null) => {
  const tour = await Tour.findById(tourId).session(session);
  if (!tour) throw new Error("Tour không tồn tại");

  tour.currentBookings += guestSize;
  await tour.save(session ? { session } : {});
  
  console.log(`✅ Tour ${tourId} slots updated to ${tour.currentBookings}`);
  return tour;
};
```

### Step 2: Pass session when calling helpers

**File:** `backend/router/payment.js`

**In POST /payment/momo:**
```javascript
await updateTourSlots(tourId, guestSize, session); // ✅ Pass session
```

**In GET /momo-return:**
```javascript
await updateBookingPaymentStatus(booking._id, newStatus, session); // ✅ Pass session
await rollbackTourSlots(booking.tourId, booking.guestSize, session); // ✅ Pass session
```

**In POST /momo-notify:**
```javascript
await updateBookingPaymentStatus(booking._id, "Confirmed", session); // ✅ Pass session

// For failed payments with idempotency check
if (booking.paymentStatus !== "Cancelled") {
  await rollbackTourSlots(booking.tourId, booking.guestSize, session); // ✅ Pass session
}
```

---

## 🧪 TESTING AFTER FIX

### Test 1: Cancel payment
```bash
# Start with clean state
Payment: Pending
Booking: Pending  
Tour: currentBookings = 2

# User cancels on MoMo

# After (all atomic):
Payment: Cancelled ✅
Booking: Cancelled ✅
Tour: currentBookings = 0 ✅
```

### Test 2: Transaction abort
```bash
# Simulate error during rollback

# All should rollback:
Payment: Pending ✅ (unchanged)
Booking: Pending ✅ (unchanged)
Tour: currentBookings = 2 ✅ (unchanged)
```

### Test 3: Duplicate IPN
```bash
# First: Return URL cancels
Payment: Cancelled
Booking: Cancelled
Tour: currentBookings = 0

# Second: IPN with resultCode != 0
# Check booking.paymentStatus first:
if (booking.paymentStatus === "Cancelled") {
  // Skip rollback - already done
}

# Result:
Tour: currentBookings = 0 ✅ (NOT -2!)
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Update `updateBookingPaymentStatus` - add session param
- [ ] Update `rollbackTourSlots` - add session param
- [ ] Update `updateTourSlots` - add session param
- [ ] Update POST `/momo` - pass session to updateTourSlots
- [ ] Update GET `/momo-return` - pass session to both helpers
- [ ] Update POST `/momo-notify` - pass session + idempotency check
- [ ] Test cancel payment → verify consistency
- [ ] Test transaction abort → verify rollback
- [ ] Test duplicate IPN → verify no double rollback

---

## 🎯 PRIORITY

**CRITICAL** - Fix immediately!

**Why:**
- Database inconsistency in production
- Lost slots (revenue loss)
- Confused users (payment says pending but booking cancelled)
- Admin cannot reconcile data

**Estimated Fix Time:** 30 minutes  
**Testing Time:** 1 hour  
**Total:** 1.5 hours

---

**Next Action:** Implement fixes in `bookingController.js` and `payment.js`

