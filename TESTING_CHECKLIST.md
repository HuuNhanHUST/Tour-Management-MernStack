# 🧪 Testing Checklist

## Pre-requisites

- [ ] MongoDB replica set running (`mongod --replSet rs0`)
- [ ] Backend server running (`npm start`)
- [ ] Frontend server running (`npm start`)
- [ ] Ngrok tunnel for IPN (optional for full test)

---

## Test 1: Normal MoMo Payment Flow ✅

### Steps:
1. [ ] Navigate to tour details page
2. [ ] Click "Book Now"
3. [ ] Complete Step 1: Select guests (e.g., 2 adults)
4. [ ] Complete Step 2: Fill contact info
5. [ ] Step 3: Select "MoMo" payment method
6. [ ] Click "Xác nhận thanh toán"

### Expected Results:
- [ ] Backend logs: `✅ Slots reserved: X → Y`
- [ ] MongoDB: `Booking` created with `paymentStatus: "Pending"`
- [ ] MongoDB: `Payment` created with `status: "Pending"`
- [ ] MongoDB: `tour.currentBookings` increased by guest count
- [ ] Browser redirects to MoMo payment gateway
- [ ] MoMo gateway shows correct amount and order info

### Continue Payment:
7. [ ] Complete payment on MoMo (use test card)
8. [ ] IPN callback received by backend

### Expected Results:
- [ ] Backend logs: `✅ Payment successful, updating records...`
- [ ] Backend logs: `ℹ️ Slots already reserved, skipping updateTourSlots`
- [ ] MongoDB: `Payment.status` updated to `"Confirmed"`
- [ ] MongoDB: `Booking.paymentStatus` updated to `"Confirmed"`
- [ ] MongoDB: `tour.currentBookings` NOT incremented again (idempotent)
- [ ] Email sent to user
- [ ] User redirected to `/thank-you?success=true`
- [ ] Thank you page shows success message

---

## Test 2: User Cancels Payment ❌

### Steps:
1. [ ] Start booking flow (Steps 1-3)
2. [ ] Click "Xác nhận thanh toán"
3. [ ] Redirected to MoMo gateway
4. [ ] **Click "Hủy" button on MoMo**

### Expected Results:
- [ ] Backend logs: `❌ Payment failed/cancelled - resultCode: 1006`
- [ ] Backend logs: `🔄 Rolling back X slots...`
- [ ] Backend logs: `✅ Slots rolled back: Y → X`
- [ ] MongoDB: `Payment.status` = `"Cancelled"`
- [ ] MongoDB: `Booking.paymentStatus` = `"Cancelled"`
- [ ] MongoDB: `tour.currentBookings` **DECREASED** by guest count
- [ ] User redirected to `/thank-you?success=false&resultCode=1006`
- [ ] Thank you page shows "Bạn đã hủy thanh toán"

---

## Test 3: Payment Fails ⚠️

### Steps:
1. [ ] Start booking flow
2. [ ] Use MoMo test card with insufficient balance
3. [ ] Try to complete payment

### Expected Results:
- [ ] MoMo returns `resultCode ≠ 0` (not 1006)
- [ ] Backend logs: `❌ Payment failed/cancelled`
- [ ] Backend logs: `🔄 Rolling back X slots...`
- [ ] MongoDB: `Payment.status` = `"Failed"`
- [ ] MongoDB: `Booking.paymentStatus` = `"Failed"`
- [ ] MongoDB: `tour.currentBookings` decreased
- [ ] User sees error message on thank you page

---

## Test 4: Race Condition Prevention 🏁

### Setup:
- [ ] Tour has exactly 2 slots remaining (`maxGroupSize - currentBookings = 2`)

### Steps:
1. [ ] **User A**: Start booking for 2 guests
2. [ ] User A completes Steps 1-2
3. [ ] User A clicks "Xác nhận thanh toán" (MoMo)
4. [ ] **Check MongoDB**: `tour.currentBookings` should be 2/2 (FULL)
5. [ ] **User B** (different browser/incognito): Try to book 2 guests
6. [ ] User B tries to proceed to payment

### Expected Results:
- [ ] User A's booking: `status: "Pending"`, slots reserved (2/2)
- [ ] User B's booking: **SHOULD FAIL** with "Tour đã đầy"
- [ ] Only one booking created (User A)
- [ ] No overbooking (prevents 4 guests for 2 slots)

### Continue:
7. [ ] User A completes payment → Success
8. [ ] User B refreshes page → Still cannot book (tour full)

**Result:** ✅ Race condition prevented

---

## Test 5: Transaction Rollback 🔄

### Steps:
1. [ ] Temporarily STOP MongoDB server
2. [ ] Try to book tour with MoMo
3. [ ] Frontend sends request to backend

### Expected Results:
- [ ] Backend logs: `❌ [Payment Router] MoMo payment error, transaction rolled back`
- [ ] Error message shown to user
- [ ] **After restarting MongoDB:**
  - [ ] No `Booking` created in database
  - [ ] No `Payment` created in database
  - [ ] `tour.currentBookings` unchanged (NOT incremented)

**Result:** ✅ Transaction rollback works correctly

---

## Test 6: Duplicate IPN (Idempotency) 🔁

### Setup:
- [ ] Complete a successful MoMo payment
- [ ] Payment status = `"Confirmed"`

### Steps:
1. [ ] Manually send duplicate IPN to `/api/v1/payment/momo-notify`
   ```bash
   curl -X POST http://localhost:4000/api/v1/payment/momo-notify \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "MOMO_1234567890_userId_tourId",
       "resultCode": 0,
       "signature": "valid_signature",
       ...
     }'
   ```

### Expected Results:
- [ ] Backend logs: `ℹ️ IPN đã được xử lý rồi cho orderId: X`
- [ ] Backend returns `200 OK`
- [ ] MongoDB: `tour.currentBookings` NOT incremented again
- [ ] No duplicate email sent
- [ ] Payment status remains `"Confirmed"` (unchanged)

**Result:** ✅ Idempotency guard works

---

## Test 7: Amount Verification 💰

### Steps:
1. [ ] Open browser DevTools (F12)
2. [ ] Start booking flow (Steps 1-2)
3. [ ] On Step 3, open Network tab
4. [ ] Click "Xác nhận thanh toán" (MoMo)
5. [ ] **Before request sends**, right-click → Edit and Resend
6. [ ] Change `amount: 1000000` to `amount: 100` (fake price)
7. [ ] Send modified request

### Expected Results:
- [ ] Backend logs: `❌ Amount verification failed: 100 not in range [X, Y]`
- [ ] Backend returns error: `"Số tiền không hợp lệ. Vui lòng tính lại giá."`
- [ ] Frontend shows error notification
- [ ] **No booking created** in database
- [ ] **No slots reserved**

**Result:** ✅ Price manipulation prevented

---

## Test 8: Server-side OrderId 🔐

### Steps:
1. [ ] Open browser DevTools → Network tab
2. [ ] Book tour with MoMo
3. [ ] Capture request to `/payment/momo`

### Expected Results:
- [ ] Request body does **NOT** contain `orderId` field
- [ ] Backend logs: Server generates orderId `MOMO_timestamp_userId_tourId`
- [ ] MongoDB: `Payment.orderId` in format `MOMO_*_*_*`
- [ ] NOT in old format `ORDER_*`

**Result:** ✅ Server-side orderId generation works

---

## Performance Test 🚀

### Steps:
1. [ ] Use tool like Apache Bench or Postman Runner
2. [ ] Send 10 concurrent booking requests for same tour
3. [ ] All requests have 2 guests each
4. [ ] Tour has 10 slots available

### Expected Results:
- [ ] Only 5 bookings succeed (10 slots / 2 guests = 5)
- [ ] Other 5 requests fail with "Tour đã đầy"
- [ ] MongoDB: `tour.currentBookings` = 10 (exactly)
- [ ] No overbooking (NOT 20 or more)

**Result:** ✅ Concurrent booking handling works

---

## Edge Cases 🔬

### Test 9: Invalid Signature
- [ ] Modify signature in return URL query params
- [ ] Expected: Redirect to `/thank-you?success=false&message=invalid_signature`

### Test 10: Payment Not Found
- [ ] Use fake `orderId` in return URL
- [ ] Expected: Redirect to `/thank-you?success=false&message=payment_not_found`

### Test 11: Network Timeout
- [ ] Disconnect internet during payment creation
- [ ] Expected: Transaction aborted, no booking created

---

## ✅ Final Verification

After all tests pass:

```bash
# Check MongoDB
mongosh
use tour_management

# Verify no orphaned bookings
db.bookings.countDocuments({ paymentStatus: "Pending" })
# Should be 0 after all tests

# Verify slots consistency
db.tours.find().forEach(tour => {
  const actual = db.bookings.countDocuments({
    tourId: tour._id,
    paymentStatus: "Confirmed"
  });
  const expected = tour.currentBookings;
  print(`Tour ${tour.title}: actual=${actual}, expected=${expected}, match=${actual === expected}`);
});
```

**All tests passed?** ✅ Ready for production!

---

**Note:** For full IPN testing, you need:
- MoMo test account
- Ngrok tunnel for local development
- Update `MOMO_NOTIFY_URL` in `.env`
