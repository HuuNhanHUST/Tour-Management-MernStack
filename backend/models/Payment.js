import mongoose from "mongoose";

// ✅ OPTION A: SIMPLIFIED PAYMENT MODEL
// Payment is now just a tracking layer for financial transactions
// All booking/guest/pricing data lives in Booking model (single source of truth)

const PaymentSchema = new mongoose.Schema({
  // ✅ CORE: Reference to Booking (1-to-1 relationship)
  bookingId: { 
    type: mongoose.Types.ObjectId, 
    ref: "Booking",
    required: true,
    unique: true // Each payment linked to exactly one booking
  },
  
  // ✅ PAYMENT TRACKING: Financial transaction details only
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
  
  // ✅ TIMESTAMPS: Payment lifecycle tracking
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  paidAt: Date, // When payment was actually confirmed
  
  // ✅ MOMO SPECIFIC: Integration fields
  momoTransId: String, // MoMo transaction ID from callback
  momoRequestId: String // MoMo request ID for tracking
  
  // ❌ REMOVED: All duplicated booking data
  // Previously had: userId, userEmail, tourId, tourName, fullName, phone,
  // guestSize, guests[], singleRoomCount, basePrice, appliedDiscounts[],
  // appliedSurcharges[], province, district, ward, addressDetail
  // → Now accessed via bookingId.populate()
});

// ✅ VIRTUAL GETTER: Access booking data easily
PaymentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included when converting to JSON/Object
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

// ✅ INDEX: Speed up queries
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ payType: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model("Payment", PaymentSchema);
