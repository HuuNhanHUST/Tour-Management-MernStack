import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ["ageBracket", "seasonal", "promotion", "surcharge"],
      required: true
    },
    // Age bracket settings (for type: "ageBracket")
    ageBrackets: [
      {
        name: { type: String, required: true }, // e.g., "Adult", "Child", "Infant", "Senior", "Student"
        minAge: { type: Number }, // Minimum age (inclusive)
        maxAge: { type: Number }, // Maximum age (inclusive)
        discountType: { 
          type: String, 
          enum: ["percentage", "fixedAmount"],
          default: "percentage"
        },
        discountValue: { 
          type: Number, 
          default: 0
        }, // percentage (0-100) or fixed amount
        requiredId: {
          type: Boolean,
          default: false
        }, // For "Student" requires ID verification
      }
    ],
    // Seasonal pricing (for type: "seasonal")
    seasonalPricing: [
      {
        name: { type: String, required: true }, // e.g., "High Season", "Low Season"
        startDate: { type: Date },
        endDate: { type: Date },
        priceMultiplier: { type: Number, default: 1 } // e.g., 1.2 for 20% higher price
      }
    ],
    // Promotions (for type: "promotion")
    promotion: {
      name: { type: String }, // e.g., "Early Bird", "Last Minute"
      startDate: { type: Date },
      endDate: { type: Date },
      // For early bird
      daysBeforeDeparture: { type: Number }, // for early bird discounts
      // For last minute
      daysBeforeDepartureMax: { type: Number }, // for last-minute discounts
      discountType: { 
        type: String, 
        enum: ["percentage", "fixedAmount"],
        default: "percentage"
      },
      discountValue: { type: Number, default: 0 } // percentage or fixed amount
    },
    // Surcharges (for type: "surcharge")
    surcharge: {
      name: { type: String }, // e.g., "Single Room", "Weekend", "Holiday"
      applicableType: { 
        type: String, 
        enum: ["singleRoom", "weekend", "holiday", "other"],
      },
      dates: [{ type: Date }], // For specific holidays
      daysOfWeek: [{ type: Number }], // 0-6 (Sunday to Saturday) for weekends
      chargeType: { 
        type: String, 
        enum: ["percentage", "fixedAmount"],
        default: "percentage"
      },
      chargeValue: { type: Number, default: 0 } // percentage or fixed amount
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("PricingRule", pricingRuleSchema);
