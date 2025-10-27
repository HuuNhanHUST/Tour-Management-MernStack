import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendCancellationEmail, sendPaymentWarningEmail } from './emailSender.js';

/**
 * Send warning emails to users with pending bookings
 * Runs 10 minutes after booking creation (5 minutes before timeout)
 */
export const sendPaymentWarnings = async () => {
  try {
    const warningTime = 10; // Send warning at 10 minutes
    const warningCutoff = new Date(Date.now() - warningTime * 60 * 1000);
    const warningGrace = new Date(Date.now() - (warningTime + 1) * 60 * 1000);
    
    console.log(`⚠️ [Warning] Checking for bookings needing payment warning...`);
    
    // Find bookings that are 10 minutes old (±1 minute window)
    const warningBookings = await Booking.find({
      paymentStatus: "Pending",
      paymentMethod: "MoMo",
      createdAt: { $lte: warningCutoff, $gte: warningGrace },
      warningEmailSent: { $ne: true } // Only send once
    }).populate('tourId').populate('userId');
    
    if (warningBookings.length === 0) {
      console.log("✅ [Warning] No bookings need payment warning");
      return { warned: 0 };
    }
    
    console.log(`⚠️ [Warning] Found ${warningBookings.length} bookings needing warning`);
    
    let warnedCount = 0;
    
    for (const booking of warningBookings) {
      try {
        const user = booking.userId;
        const tour = booking.tourId;
        const payment = await Payment.findOne({ bookingId: booking._id });
        
        if (user && user.email && tour && payment) {
          await sendPaymentWarningEmail(
            user.email,
            payment.orderId,
            tour.title,
            booking.fullName || user.username,
            5 // 5 minutes left
          );
          
          // Mark as warned to avoid duplicate emails
          booking.warningEmailSent = true;
          await booking.save();
          
          warnedCount++;
          console.log(`✅ [Warning] Sent warning email to ${user.email} for booking ${booking._id}`);
        }
      } catch (error) {
        console.error(`❌ [Warning] Error sending warning for booking ${booking._id}:`, error.message);
      }
    }
    
    console.log(`✅ [Warning] Sent ${warnedCount}/${warningBookings.length} warning emails`);
    return { warned: warnedCount };
    
  } catch (error) {
    console.error("❌ [Warning] Error during warning check:", error.message);
    throw error;
  }
};

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
    const timeoutMinutes = 15; // Payment timeout
    const graceMinutes = 5; // Grace period after timeout
    const totalTimeout = timeoutMinutes + graceMinutes; // 20 minutes total
    const cutoffTime = new Date(Date.now() - totalTimeout * 60 * 1000);
    
    console.log(`🧹 [Cleanup] Checking for pending bookings older than ${totalTimeout} minutes (${timeoutMinutes}m timeout + ${graceMinutes}m grace)...`);
    
    // Find expired pending bookings
    const expiredBookings = await Booking.find({
      paymentStatus: "Pending",
      paymentMethod: "MoMo",
      createdAt: { $lte: cutoffTime }
    }).populate('tourId').populate('userId').session(session);
    
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
        
        // Send cancellation email (async, don't wait)
        if (booking.userId && booking.userId.email && booking.tourId && payment) {
          sendCancellationEmail(
            booking.userId.email,
            payment.orderId,
            booking.tourId.title,
            booking.fullName || booking.userId.username,
            "auto-timeout"
          ).catch(err => {
            console.error(`❌ [Cleanup] Failed to send cancellation email for booking ${booking._id}:`, err.message);
          });
        }
        
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
 * Start periodic cleanup and warning jobs
 * - Warning job runs every 1 minute (checks for 10-minute old bookings)
 * - Cleanup job runs every 1 minute (checks for 20-minute old bookings)
 */
export const startCleanupJob = () => {
  const intervalMinutes = 1; // Industry standard: check every 1 minute
  
  console.log(`🔄 [Jobs] Starting periodic jobs (every ${intervalMinutes} minute)`);
  console.log(`⚠️ [Jobs] Warning sent at: 10 minutes`);
  console.log(`🧹 [Jobs] Cleanup timeout: 15 minutes + 5 minutes grace = 20 minutes total`);
  
  // Run immediately on startup
  sendPaymentWarnings().catch(err => {
    console.error("❌ [Warning] Initial warning check failed:", err.message);
  });
  
  cleanupPendingBookings().catch(err => {
    console.error("❌ [Cleanup] Initial cleanup failed:", err.message);
  });
  
  // Then run periodically every 1 minute
  setInterval(() => {
    sendPaymentWarnings().catch(err => {
      console.error("❌ [Warning] Periodic warning check failed:", err.message);
    });
  }, intervalMinutes * 60 * 1000);
  
  setInterval(() => {
    cleanupPendingBookings().catch(err => {
      console.error("❌ [Cleanup] Periodic cleanup failed:", err.message);
    });
  }, intervalMinutes * 60 * 1000);
};
