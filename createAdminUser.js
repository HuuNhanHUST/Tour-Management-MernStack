// Script to create an admin user or update an existing user to admin role
// Save this as createAdminUser.js

// First, we need to connect to MongoDB
const { MongoClient } = require('mongodb');

// Replace these with your MongoDB connection string and database name
const uri = "mongodb://localhost:27017";
const dbName = "tour-management"; // Change this to your actual database name

async function createAdminUser() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully");
    
    const db = client.db(dbName);
    
    // Ask for email to update
    console.log("\n=== Create Admin User ===");
    console.log("Enter the email of the user you want to update to admin role:");
    
    // Since this script is meant to be run manually, we'll use a workaround for user input
    // You'll need to replace this email with the actual email before running the script
    const userEmail = "nhansever9999@gmail.com"; // Using the email you provided
    
    // Update user to admin role
    const result = await db.collection('users').updateOne(
      { email: userEmail },
      { $set: { role: "admin" } }
    );
    
    if (result.matchedCount === 0) {
      console.log(`No user found with email: ${userEmail}`);
    } else if (result.modifiedCount === 0) {
      console.log(`User with email ${userEmail} is already an admin.`);
    } else {
      console.log(`Successfully updated user with email ${userEmail} to admin role!`);
    }
    
  } finally {
    // Close the connection
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Execute the function
createAdminUser().catch(console.error);
