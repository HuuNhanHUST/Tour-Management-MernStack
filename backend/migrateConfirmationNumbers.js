import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const migrateConfirmationNumbers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all bookings without confirmationNumber
    const bookingsWithoutCode = await Booking.find({
      confirmationNumber: { $exists: false }
    });

    console.log(`📋 Found ${bookingsWithoutCode.length} bookings without confirmation number`);

    if (bookingsWithoutCode.length === 0) {
      console.log('✅ All bookings already have confirmation numbers!');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const booking of bookingsWithoutCode) {
      try {
        // Generate confirmation number based on bookAt date
        const date = new Date(booking.bookAt || booking.createdAt);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const confirmationNumber = `TOUR-${dateStr}-${randomStr}`;

        // Update booking
        booking.confirmationNumber = confirmationNumber;
        await booking.save();

        updated++;
        console.log(`✅ [${updated}/${bookingsWithoutCode.length}] Updated booking ${booking._id} with ${confirmationNumber}`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed to update booking ${booking._id}:`, err.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${bookingsWithoutCode.length}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

migrateConfirmationNumbers();
