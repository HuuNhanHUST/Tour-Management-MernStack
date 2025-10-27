import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Tour from '../models/Tour.js';
import mongoose from 'mongoose';

/**
 * Cleanup pending bookings that are older than timeout duration
 * This handles cases where:
 * 1. User clicks "Back" button on MoMo gateway (no callback)
 * 2. User closes browser during payment
 * 3. Network issues prevent callbacks
 */
export const cleanupPendingBookings = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const timeoutMinutes = 15; // Configurable timeout
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    console.log(`🧹 [Cleanup] Checking for pending bookings older than ${timeoutMinutes} minutes...`);
    
    // Find expired pending bookings
    const expiredBookings = await Booking.find({
      paymentStatus: "Pending",
      paymentMethod: "MoMo",
      createdAt: { $lte: cutoffTime }
    }).session(session);
    
    if (expiredBookings.length === 0) {
      console.log("✅ [Cleanup] No expired pending bookings found");
      await session.commitTransaction();
      return { cleaned: 0 };
    }
    
    console.log(`⚠️ [Cleanup] Found ${expiredBookings.length} expired pending bookings`);
    
    let cleanedCount = 0;
    
    for (const booking of expiredBookings) {
      try {
        // Update booking status
        booking.paymentStatus = "Cancelled";
        await booking.save({ session });
        
        // Update payment status
        const payment = await Payment.findOne({ bookingId: booking._id }).session(session);
        if (payment && payment.status === "Pending") {
          payment.status = "Cancelled";
          await payment.save({ session });
        }
        
        // Rollback tour slots
        const tour = await Tour.findById(booking.tourId).session(session);
        if (tour) {
          const oldBookings = tour.currentBookings;
          tour.currentBookings -= booking.guestSize;
          await tour.save({ session });
          console.log(`✅ [Cleanup] Booking ${booking._id}: Slots rolled back ${oldBookings} → ${tour.currentBookings}`);
        }
        
        cleanedCount++;
        console.log(`✅ [Cleanup] Cancelled expired booking ${booking._id} (created at ${booking.createdAt})`);
        
      } catch (error) {
        console.error(`❌ [Cleanup] Error processing booking ${booking._id}:`, error.message);
        // Continue with other bookings
      }
    }
    
    await session.commitTransaction();
    console.log(`✅ [Cleanup] Successfully cleaned up ${cleanedCount}/${expiredBookings.length} expired bookings`);
    
    return { cleaned: cleanedCount, total: expiredBookings.length };
    
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ [Cleanup] Error during cleanup:", error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Start periodic cleanup job
 * Runs every 5 minutes
 */
export const startCleanupJob = () => {
  const intervalMinutes = 5;
  
  console.log(`🔄 [Cleanup] Starting periodic cleanup job (every ${intervalMinutes} minutes)`);
  
  // Run immediately on startup
  cleanupPendingBookings().catch(err => {
    console.error("❌ [Cleanup] Initial cleanup failed:", err.message);
  });
  
  // Then run periodically
  setInterval(() => {
    cleanupPendingBookings().catch(err => {
      console.error("❌ [Cleanup] Periodic cleanup failed:", err.message);
    });
  }, intervalMinutes * 60 * 1000);
};
