// Script to create pricing rules for all tours in MongoDB
// Save this as createPricingRulesDB.js

// First, we need to connect to MongoDB
const { MongoClient, ObjectId } = require('mongodb');

// Replace these with your MongoDB connection string and database name
const uri = "mongodb://localhost:27017";
const dbName = "tour-management"; // Change this to your actual database name

async function createPricingRules() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully");
    
    const db = client.db(dbName);
    
    // Get all tours
    const tours = await db.collection('tours').find({}, { projection: { _id: 1, title: 1 } }).toArray();
    console.log(`Found ${tours.length} tours`);
    
    if (tours.length === 0) {
      console.log("No tours found. Please create tours first.");
      return;
    }
    
    // Create pricing rules for each tour
    let successCount = 0;
    let failCount = 0;
    
    for (const tour of tours) {
      try {
        // Create a standard pricing rule for this tour
        const pricingRule = {
          tourId: tour._id,
          name: `Standard Pricing for ${tour.title}`,
          description: "Default pricing rule with standard age brackets",
          type: "ageBracket",
          ageBrackets: [
            {
              name: "Adult",
              minAge: 18,
              maxAge: 65,
              discountType: "percentage",
              discountValue: 0,
              requiredId: false
            },
            {
              name: "Child",
              minAge: 2,
              maxAge: 17,
              discountType: "percentage",
              discountValue: 50,
              requiredId: false
            },
            {
              name: "Infant",
              minAge: 0,
              maxAge: 1,
              discountType: "percentage",
              discountValue: 100,
              requiredId: false
            },
            {
              name: "Senior",
              minAge: 66,
              maxAge: 120,
              discountType: "percentage",
              discountValue: 30,
              requiredId: false
            }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Insert the pricing rule
        const result = await db.collection('pricingrules').insertOne(pricingRule);
        console.log(`Created pricing rule for "${tour.title}" with ID: ${result.insertedId}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to create pricing rule for "${tour.title}": ${error.message}`);
        failCount++;
      }
    }
    
    console.log("\n========================================");
    console.log(`Successfully created ${successCount} pricing rules`);
    if (failCount > 0) {
      console.log(`Failed to create ${failCount} pricing rules`);
    }
    console.log("========================================");
    
  } finally {
    // Close the connection
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Execute the function
createPricingRules().catch(console.error);
