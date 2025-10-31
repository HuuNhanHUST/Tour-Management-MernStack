import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const createUniqueConstraint = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop existing index if it exists (without unique constraint)
    try {
      await Booking.collection.dropIndex('userId_1_tourId_1');
      console.log('🗑️ Dropped old userId_1_tourId_1 index');
    } catch (err) {
      console.log('ℹ️ No old userId_1_tourId_1 index to drop');
    }

    // Get current indexes
    console.log('\n📊 Current indexes before creation:');
    const indexesBefore = await Booking.collection.getIndexes();
    console.log(Object.keys(indexesBefore));

    // Create unique constraint: User can only have ONE active booking per tour
    console.log('\n🔨 Creating unique constraint...');
    await Booking.collection.createIndex(
      { userId: 1, tourId: 1 },
      { 
        unique: true,
        partialFilterExpression: { 
          paymentStatus: { $in: ['Pending', 'Confirmed'] }
        },
        name: 'unique_user_tour_active_booking'
      }
    );
    console.log('✅ Unique constraint created: unique_user_tour_active_booking');

    // Verify index was created
    console.log('\n📊 Indexes after creation:');
    const indexesAfter = await Booking.collection.getIndexes();
    console.log(Object.keys(indexesAfter));

    // Check if our index exists
    if (indexesAfter.unique_user_tour_active_booking) {
      console.log('\n✅ SUCCESS! Unique constraint verified:');
      console.log(JSON.stringify(indexesAfter.unique_user_tour_active_booking, null, 2));
    } else {
      console.log('\n❌ ERROR: Index was not created properly');
    }

    console.log('\n✅ Done! Database updated successfully.');
    console.log('ℹ️ This constraint prevents users from having multiple Pending/Confirmed bookings for the same tour.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 11000) {
      console.log('\n⚠️ DUPLICATE KEY ERROR: There are existing duplicate bookings in the database.');
      console.log('You need to clean up duplicate bookings first before creating the unique constraint.');
      console.log('\nFinding duplicate bookings...');
      
      // Find duplicates
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
            bookings: { $push: { _id: '$_id', bookAt: '$bookAt', paymentStatus: '$paymentStatus' } }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      console.log(`\n📋 Found ${duplicates.length} duplicate booking groups:`);
      duplicates.forEach((dup, index) => {
        console.log(`\n${index + 1}. User ${dup._id.userId} has ${dup.count} bookings for Tour ${dup._id.tourId}:`);
        dup.bookings.forEach(b => {
          console.log(`   - Booking ID: ${b._id}, Status: ${b.paymentStatus}, BookAt: ${b.bookAt}`);
        });
      });

      console.log('\n💡 Solution: Cancel or delete the older duplicate bookings, keeping only the most recent one.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createUniqueConstraint();
