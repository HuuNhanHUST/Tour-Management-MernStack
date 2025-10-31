import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    userEmail: {
      type: String,
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Tour"
    },
    tourName: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    guestSize: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: [
      {
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
      }
    ],
    singleRoomCount: {
      type: Number,
      default: 0
    },
    phone: {
      type: String,
      required: true,
    },
    bookAt: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    basePrice: {
      type: Number,
      required: true,
      default: 100000,  // Set a higher default value to prevent validation errors
    },
    appliedDiscounts: [{
      name: { type: String },
      amount: { type: Number }
    }],
    appliedSurcharges: [{
      name: { type: String },
      amount: { type: Number }
    }],
    paymentMethod: {
      type: String,
      default: "Cash", // hoặc "MoMo"
      enum: ["Cash", "MoMo"]
    },
    // ✅ OPTION A: Add payment status tracking in Booking
    paymentStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Failed", "Cancelled"],
      default: "Pending"
    },
    // Track if warning email has been sent (to avoid duplicates)
    warningEmailSent: {
      type: Boolean,
      default: false
    },
    // Cancellation tracking
    cancellationReason: {
      type: String
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
province: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
district: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
ward: {
  code: { type: String, required: true },
  name: { type: String, required: true },
},
addressDetail: {
  type: String,
  required: true,
}
  },
  { timestamps: true }
);

// ✅ OPTION A: Virtual getter to access payment details
bookingSchema.virtual('payment', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'bookingId',
  justOne: true
});

// Ensure virtuals are included in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

export default mongoose.model("Booking", bookingSchema);
