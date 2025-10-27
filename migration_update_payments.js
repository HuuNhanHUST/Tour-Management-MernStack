import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "./backend/models/Payment.js";
import Booking from "./backend/models/Booking.js";

dotenv.config();

async function migratePayments() {
  try {
    console.log("🚀 Starting payment migration...");
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    let successCount = 0;
    let errorCount = 0;

    // 1. Update existing MoMo Payment records with missing fields
    console.log("\n📝 Step 1: Updating existing MoMo payments...");
    const momoPayments = await Payment.find({ payType: "MoMo" });
    
    for (const payment of momoPayments) {
      try {
        let updated = false;
        
        // If payment has a linked booking, copy missing data from booking
        if (payment.bookingId) {
          const booking = await Booking.findById(payment.bookingId);
          if (booking) {
            if (!payment.guests || payment.guests.length === 0) {
              payment.guests = booking.guests;
              updated = true;
            }
            if (!payment.basePrice) {
              payment.basePrice = booking.basePrice;
              updated = true;
            }
            if (!payment.appliedDiscounts || payment.appliedDiscounts.length === 0) {
              payment.appliedDiscounts = booking.appliedDiscounts;
              updated = true;
            }
            if (!payment.appliedSurcharges || payment.appliedSurcharges.length === 0) {
              payment.appliedSurcharges = booking.appliedSurcharges;
              updated = true;
            }
            if (!payment.singleRoomCount) {
              payment.singleRoomCount = booking.singleRoomCount;
              updated = true;
            }
          }
        }
        
        if (updated) {
          await payment.save();
          console.log(`  ✅ Updated MoMo payment ${payment._id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error updating payment ${payment._id}:`, err.message);
        errorCount++;
      }
    }

    // 2. Create Payment records for existing Cash bookings without payment
    console.log("\n📝 Step 2: Creating Payment records for Cash bookings...");
    const cashBookings = await Booking.find({ paymentMethod: "Cash" });
    
    for (const booking of cashBookings) {
      try {
        // Check if payment already exists
        const existingPayment = await Payment.findOne({
          userId: booking.userId,
          tourId: booking.tourId,
          bookingId: booking._id
        });

        if (!existingPayment) {
          // Create new payment record
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

          console.log(`  ✅ Created Payment for Cash Booking ${booking._id} → Payment ${newPayment._id}`);
          successCount++;
        } else {
          console.log(`  ⏭️  Payment already exists for Booking ${booking._id}`);
        }
      } catch (err) {
        console.error(`  ❌ Error creating payment for booking ${booking._id}:`, err.message);
        errorCount++;
      }
    }

    // 3. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log(`📦 Total MoMo payments: ${momoPayments.length}`);
    console.log(`📦 Total Cash bookings: ${cashBookings.length}`);
    console.log("=".repeat(60));
    
    console.log("\n✅ Migration completed!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migratePayments();
