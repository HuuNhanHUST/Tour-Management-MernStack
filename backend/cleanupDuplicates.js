import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const cleanupDuplicateBookings = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find duplicate bookings
    console.log('\n🔍 Finding duplicate bookings...');
    const duplicates = await Booking.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['Pending', 'Confirmed'] }
        }
      },
      {
        $group: {
          _id: { userId: '$userId', tourId: '$tourId' },
          count: { $sum: 1 },
          bookings: { 
            $push: { 
              _id: '$_id', 
              bookAt: '$bookAt', 
              createdAt: '$createdAt',
              paymentStatus: '$paymentStatus',
              paymentMethod: '$paymentMethod'
            } 
          }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`\n📋 Found ${duplicates.length} duplicate booking groups\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! Database is clean.');
      return;
    }

    let totalCancelled = 0;

    // Process each duplicate group
    for (const dup of duplicates) {
      console.log(`\n👤 User ${dup._id.userId} - Tour ${dup._id.tourId}`);
      console.log(`   Has ${dup.count} bookings:`);

      // Sort bookings by createdAt descending (most recent first)
      const sorted = dup.bookings.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Keep the most recent one
      const keepBooking = sorted[0];
      const cancelBookings = sorted.slice(1);

      console.log(`   ✅ KEEPING: ${keepBooking._id} (${keepBooking.paymentStatus}, created: ${keepBooking.createdAt})`);

      // Cancel all older bookings
      for (const booking of cancelBookings) {
        console.log(`   ❌ CANCELLING: ${booking._id} (${booking.paymentStatus}, created: ${booking.createdAt})`);
        
        await Booking.findByIdAndUpdate(booking._id, {
          paymentStatus: 'Cancelled',
          cancellationReason: 'Auto-cancelled: Duplicate booking detected',
          cancelledAt: new Date()
        });

        totalCancelled++;
      }
    }

    console.log(`\n✅ Cleanup complete! Cancelled ${totalCancelled} duplicate bookings.`);
    console.log('\n💡 Now you can run createUniqueConstraint.js to add the unique constraint.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

cleanupDuplicateBookings();
