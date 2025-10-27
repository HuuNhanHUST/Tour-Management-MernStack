# 🎯 OPTION A REFACTOR STRATEGY - Simplified Payment Model

**Date:** October 20, 2025  
**Goal:** Eliminate data duplication between Payment and Booking models  
**Approach:** Payment becomes minimal tracking layer, Booking is single source of truth

---

## 📊 CURRENT STATE ANALYSIS

### Current Data Duplication (17 fields - 70.8%)

| Category | Duplicated Fields | Impact |
|----------|-------------------|---------|
| **Core References** | userId, userEmail, tourId, tourName | 🔴 HIGH |
| **Guest Info** | fullName, phone, guestSize, guests[], singleRoomCount | 🔴 HIGH |
| **Pricing** | basePrice, appliedDiscounts[], appliedSurcharges[], amount/totalAmount | 🔴 HIGH |
| **Address** | province, district, ward, addressDetail | 🟡 MEDIUM |

### Current Usage Analysis

#### 1️⃣ **Payment Model Usages**
- ✅ `payment.js` - Create/Read/Update operations
- ✅ `migration_update_payments.js` - Data migration
- ✅ Frontend: Payment history display
- ✅ Admin: Payment confirmation/rejection
- ✅ MoMo IPN: Automatic payment processing

#### 2️⃣ **Booking Model Usages**
- ✅ `bookingController.js` - CRUD operations (deprecated POST)
- ✅ `payment.js` - Created after successful payment
- ✅ `dashboardController.js` - Revenue/order statistics
- ✅ Admin: Booking management
- ✅ Users: Booking history

#### 3️⃣ **Critical Dependencies**
```javascript
// Payment → Booking reference
Payment.bookingId → Booking._id

// Dashboard statistics use Booking
await Booking.countDocuments({ totalAmount: { $gt: 0 } })
await Booking.aggregate([...]) // Revenue calculations

// Payment queries populate bookingId
.populate("bookingId", "_id guestSize tourName")
```

---

## 🏗️ REFACTOR STRATEGY: Option A Implementation

### Phase 1: Model Restructuring

#### NEW Payment Schema (Minimized)
```javascript
const PaymentSchema = new mongoose.Schema({
  // ✅ KEEP: Core payment tracking
  bookingId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Booking",
    required: true,
    unique: true // ✅ 1-to-1 relationship
  },
  
  // ✅ KEEP: Payment-specific fields only
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
    enum: ["Pending", "Confirmed", "Failed", "Cancelled"], 
    default: "Pending" 
  },
  payType: { 
    type: String, 
    enum: ["Cash", "MoMo"],
    required: true
  },
  
  // ✅ KEEP: Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  paidAt: Date,
  
  // ✅ KEEP: MoMo specific
  momoTransId: String,
  momoRequestId: String,
  
  // ❌ REMOVE: All duplicated fields
  // userId, userEmail, tourId, tourName, fullName, phone,
  // guestSize, guests[], singleRoomCount, basePrice,
  // appliedDiscounts[], appliedSurcharges[], province, etc.
});

// ✅ ADD: Virtual getter for accessing booking data
PaymentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});
```

#### UPDATED Booking Schema (Enhanced)
```javascript
const bookingSchema = new mongoose.Schema({
  // ✅ KEEP: All existing fields (single source of truth)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
  tourName: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  guestSize: { type: Number, required: true, min: 1 },
  guests: [{ /* detailed guest info */ }],
  singleRoomCount: { type: Number, default: 0 },
  basePrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  appliedDiscounts: [{ name: String, amount: Number }],
  appliedSurcharges: [{ name: String, amount: Number }],
  province: { code: String, name: String },
  district: { code: String, name: String },
  ward: { code: String, name: String },
  addressDetail: { type: String, required: true },
  
  // ✅ ADD: Payment status tracking
  paymentStatus: {
    type: String,
    enum: ["Pending", "Confirmed", "Failed", "Cancelled"],
    default: "Pending"
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "MoMo"],
    required: true
  },
  
  bookAt: { type: Date, required: true }
}, { timestamps: true });

// ✅ ADD: Virtual getter for accessing payment data
bookingSchema.virtual('payment', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'bookingId',
  justOne: true
});
```

---

### Phase 2: Code Migration Plan

#### Step 1: Update Payment Creation (payment.js)

**BEFORE (Current):**
```javascript
// ❌ Duplicating all data in Payment
const newPayment = new Payment({
  userId, userEmail, tourId, tourName, fullName, phone,
  guestSize, guests, singleRoomCount, basePrice,
  appliedDiscounts, appliedSurcharges, province, district,
  ward, addressDetail, amount, payType, orderId
});

const newBooking = new Booking({ /* same data */ });
await newBooking.save();
newPayment.bookingId = newBooking._id;
await newPayment.save();
```

**AFTER (Simplified):**
```javascript
// ✅ Create Booking first (single source of truth)
const newBooking = new Booking({
  userId, userEmail, tourId, tourName, fullName, phone,
  guestSize, guests, singleRoomCount, basePrice,
  appliedDiscounts, appliedSurcharges, province, district,
  ward, addressDetail, 
  totalAmount, 
  paymentMethod: "Cash",
  paymentStatus: "Confirmed", // Cash is auto-confirmed
  bookAt: new Date()
});
await newBooking.save();

// ✅ Create minimal Payment record
const newPayment = new Payment({
  bookingId: newBooking._id,
  orderId: `CASH_${Date.now()}_${newBooking._id}`,
  amount: totalAmount,
  payType: "Cash",
  status: "Confirmed",
  paidAt: new Date()
});
await newPayment.save();
```

**Benefits:**
- ✅ Single save for booking data
- ✅ Payment is just tracking layer
- ✅ No data duplication
- ✅ Clearer separation of concerns

---

#### Step 2: Update MoMo Flow (payment.js)

**BEFORE (Current):**
```javascript
// ❌ Save all data in Payment during request
const newPayment = new Payment({
  userId, userEmail, tourId, tourName, fullName, phone,
  guestSize, guests, /* ... all fields ... */
  status: "Pending"
});
await newPayment.save();

// Then in IPN: Create Booking from Payment data
const newBooking = new Booking({
  userId: payment.userId,
  userEmail: payment.userEmail,
  /* ... copy all from payment ... */
});
```

**AFTER (Simplified):**
```javascript
// ✅ CREATE BOOKING IMMEDIATELY (even before payment)
const newBooking = new Booking({
  userId, userEmail, tourId, tourName, fullName, phone,
  guestSize, guests, /* ... all booking fields ... */
  totalAmount,
  paymentMethod: "MoMo",
  paymentStatus: "Pending", // ✅ Status tracks payment state
  bookAt: new Date()
});
await newBooking.save();

// ✅ Create minimal Payment tracking
const newPayment = new Payment({
  bookingId: newBooking._id,
  orderId: `MOMO_${Date.now()}`,
  amount: totalAmount,
  payType: "MoMo",
  status: "Pending",
  momoRequestId: /* MoMo API response */
});
await newPayment.save();

// In IPN handler:
const payment = await Payment.findOne({ orderId: req.body.orderId });
const booking = await Booking.findById(payment.bookingId);

if (resultCode === 0) {
  // ✅ Update both records
  payment.status = "Confirmed";
  payment.momoTransId = req.body.transId;
  payment.paidAt = new Date();
  await payment.save();
  
  booking.paymentStatus = "Confirmed";
  await booking.save();
  
  // Update tour slots
  tour.currentBookings += booking.guestSize;
  await tour.save();
}
```

**Benefits:**
- ✅ Booking created immediately (single source)
- ✅ Payment is just status tracking
- ✅ Clearer flow: Booking → Payment → Confirmation
- ✅ No data sync issues

---

#### Step 3: Update Dashboard (dashboardController.js)

**BEFORE (Current):**
```javascript
// ❌ Using Booking for statistics
const count = await Booking.countDocuments({ totalAmount: { $gt: 0 } });
const revenue = await Booking.aggregate([...]);
```

**AFTER (Options):**

**Option 3A: Keep using Booking (RECOMMENDED)**
```javascript
// ✅ Booking is still source of truth for business data
const count = await Booking.countDocuments({ 
  paymentStatus: "Confirmed" // ✅ More accurate
});

const revenue = await Booking.aggregate([
  { $match: { paymentStatus: "Confirmed" } },
  { $group: { _id: null, total: { $sum: "$totalAmount" } } }
]);
```

**Option 3B: Use Payment with populate**
```javascript
// Alternative: Use Payment and populate booking data
const payments = await Payment.find({ status: "Confirmed" })
  .populate('bookingId', 'tourName guestSize totalAmount');

const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
```

**Recommendation:** Keep using Booking for statistics (Option 3A) since it's the operational record.

---

#### Step 4: Update Admin Payment UI

**BEFORE (Current):**
```javascript
// ❌ Display duplicated data from Payment
{payment.fullName} - {payment.tourName}
```

**AFTER (Populate Booking):**
```javascript
// ✅ Populate booking to access details
const payments = await Payment.find()
  .populate('bookingId', 'fullName tourName guestSize totalAmount userId')
  .sort({ createdAt: -1 });

// In frontend:
{payment.bookingId.fullName} - {payment.bookingId.tourName}
```

---

### Phase 3: Data Migration Script

```javascript
// migration_refactor_to_option_a.js
import mongoose from "mongoose";
import Payment from "./backend/models/Payment.js";
import Booking from "./backend/models/Booking.js";

async function migrateToOptionA() {
  try {
    console.log("🚀 Starting Option A migration...\n");
    
    // Step 1: Add paymentStatus to all existing Bookings
    console.log("📝 Step 1: Adding paymentStatus to Bookings...");
    const bookings = await Booking.find();
    
    for (const booking of bookings) {
      // Find associated payment
      const payment = await Payment.findOne({ bookingId: booking._id });
      
      if (payment) {
        // Sync payment status to booking
        booking.paymentStatus = payment.status;
        await booking.save();
        console.log(`  ✅ Updated Booking ${booking._id} with status: ${payment.status}`);
      } else {
        // No payment found - mark as Confirmed (legacy cash booking)
        booking.paymentStatus = "Confirmed";
        await booking.save();
        console.log(`  ✅ Updated legacy Booking ${booking._id} as Confirmed`);
      }
    }
    
    console.log(`\n✅ Step 1 Complete: ${bookings.length} bookings updated\n`);
    
    // Step 2: Remove duplicated fields from Payment schema
    // (This happens via model update - just verify data)
    console.log("📝 Step 2: Verifying Payment-Booking linkage...");
    const payments = await Payment.find();
    let validLinks = 0;
    let brokenLinks = 0;
    
    for (const payment of payments) {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        validLinks++;
      } else {
        brokenLinks++;
        console.warn(`  ⚠️ Payment ${payment._id} has invalid bookingId: ${payment.bookingId}`);
      }
    }
    
    console.log(`\n✅ Step 2 Complete:`);
    console.log(`   Valid links: ${validLinks}`);
    console.log(`   Broken links: ${brokenLinks}\n`);
    
    // Step 3: Summary
    console.log("========================================");
    console.log("  MIGRATION COMPLETE");
    console.log("========================================");
    console.log(`✅ Bookings with paymentStatus: ${bookings.length}`);
    console.log(`✅ Valid Payment-Booking links: ${validLinks}`);
    if (brokenLinks > 0) {
      console.log(`⚠️ Broken links to fix: ${brokenLinks}`);
    }
    console.log("\n📝 Next steps:");
    console.log("   1. Deploy new Payment model (without duplicated fields)");
    console.log("   2. Update payment.js to use new structure");
    console.log("   3. Update admin UI to populate bookingId");
    console.log("   4. Test all payment flows\n");
    
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.connection.close();
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected for migration");
    return migrateToOptionA();
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] **Backup production database**
- [ ] **Test on development environment first**
- [ ] **Review all Payment/Booking usages** (done above)
- [ ] **Create rollback plan**

### Phase 1: Model Changes
- [ ] 1. Add `paymentStatus` field to Booking schema
- [ ] 2. Add virtual `payment` getter to Booking
- [ ] 3. Create NEW Payment schema (simplified)
- [ ] 4. Add virtual `booking` getter to Payment
- [ ] 5. Test model validation

### Phase 2: Backend Code Updates
- [ ] 6. Update `payment.js` - Cash payment endpoint
- [ ] 7. Update `payment.js` - MoMo payment request
- [ ] 8. Update `payment.js` - MoMo IPN handler
- [ ] 9. Update `payment.js` - Admin confirm/reject
- [ ] 10. Update `dashboardController.js` - Use `paymentStatus`
- [ ] 11. Remove validation checks (no longer needed)

### Phase 3: Frontend Updates
- [ ] 12. Update Admin Payment UI - populate bookingId
- [ ] 13. Update Payment History - populate bookingId
- [ ] 14. Test all payment displays

### Phase 4: Migration
- [ ] 15. Run migration script on DEV database
- [ ] 16. Verify data integrity
- [ ] 17. Test all payment flows on DEV
- [ ] 18. Run migration on STAGING
- [ ] 19. Test on STAGING
- [ ] 20. Run migration on PRODUCTION (with backup)

### Phase 5: Validation
- [ ] 21. Monitor logs for errors
- [ ] 22. Verify Cash payments work
- [ ] 23. Verify MoMo payments work
- [ ] 24. Verify IPN callbacks work
- [ ] 25. Verify dashboard statistics correct
- [ ] 26. Verify admin UI displays correctly

---

## 🎯 BENEFITS OF OPTION A

| Benefit | Impact | Details |
|---------|--------|---------|
| **Eliminate Duplication** | 🟢 HIGH | Remove 17 duplicated fields (70.8% reduction) |
| **Single Source of Truth** | 🟢 HIGH | Booking is canonical record, Payment is tracking |
| **Simplified Maintenance** | 🟢 HIGH | Update data in one place only |
| **Clear Separation** | 🟢 MEDIUM | Payment = financial, Booking = operational |
| **Better Performance** | 🟡 MEDIUM | Less data to save/sync |
| **Reduced Storage** | 🟡 LOW | Smaller database size |

---

## ⚠️ RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Data loss during migration** | LOW | 🔴 CRITICAL | Full database backup before migration |
| **Broken Payment-Booking links** | MEDIUM | 🟠 HIGH | Validation script + manual verification |
| **Admin UI breaks** | MEDIUM | 🟡 MEDIUM | Update all `.populate()` calls |
| **Dashboard stats incorrect** | LOW | 🟡 MEDIUM | Use `paymentStatus` instead of querying Payment |
| **MoMo IPN fails** | LOW | 🟠 HIGH | Extensive testing on staging with test MoMo account |

---

## 🔄 ROLLBACK PLAN

If migration fails:

1. **Stop all services immediately**
2. **Restore database from backup**
3. **Revert code to previous commit**
4. **Deploy old version**
5. **Verify system operational**
6. **Analyze failure cause**
7. **Fix issues in development**
8. **Retry migration after thorough testing**

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Planning & Review** | 1 day | Review this document, team alignment |
| **Model Updates** | 2 hours | Update schemas, add virtuals |
| **Backend Code Updates** | 4 hours | Update payment.js, dashboardController.js |
| **Frontend Updates** | 2 hours | Update admin UI, payment history |
| **Testing on DEV** | 4 hours | Test all flows thoroughly |
| **Migration DEV→STAGING** | 1 hour | Run migration + verify |
| **Testing on STAGING** | 4 hours | Full regression testing |
| **Migration PRODUCTION** | 2 hours | Backup + migrate + verify |
| **Monitoring** | 1 week | Watch logs, fix issues |
| **TOTAL** | **~3-4 days** | (Excluding monitoring) |

---

## 📝 CONCLUSION

**Option A is the CLEANEST long-term solution** but requires significant refactoring effort.

**Recommendation:**
1. ✅ **Short-term:** Keep current implementation (Option B) with validation
2. ✅ **Monitor** production for 1-2 months
3. ✅ **Plan Option A** for v2.0 release
4. ✅ **Allocate 1 week** for full implementation + testing

**Decision needed from team:**
- Proceed with Option A now? (3-4 days effort)
- Postpone to v2.0? (safer, allows production monitoring)

---

**Document prepared by:** GitHub Copilot  
**Review needed:** Tech Lead, Backend Lead, QA Lead  
**Approval required before:** Any model schema changes  
