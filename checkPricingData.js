// Script to check and fix pricing rules data
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb://localhost:27017";
const dbName = "tour-management";

async function checkPricingRulesData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
    
    const db = client.db(dbName);
    
    // Get all pricing rules
    const pricingRules = await db.collection('pricingrules').find({}).toArray();
    console.log(`Found ${pricingRules.length} pricing rules`);
    
    // Analyze each rule
    pricingRules.forEach((rule, index) => {
      console.log(`\n--- Rule ${index + 1} ---`);
      console.log(`ID: ${rule._id}`);
      console.log(`Name: ${rule.name}`);
      console.log(`Type: ${rule.type}`);
      console.log(`Tour ID: ${rule.tourId}`);
      
      if (rule.type === 'ageBracket' && rule.ageBrackets) {
        console.log(`Age Brackets (${rule.ageBrackets.length}):`);
        rule.ageBrackets.forEach((bracket, idx) => {
          console.log(`  ${idx + 1}. ${bracket.name}: ${bracket.discountValue}% discount`);
        });
      }
      
      if (rule.type === 'seasonal' && rule.seasonalPricing) {
        console.log(`Seasonal Pricing (${rule.seasonalPricing.length}):`);
        rule.seasonalPricing.forEach((season, idx) => {
          console.log(`  ${idx + 1}. ${season.name}: ${season.priceMultiplier}x multiplier`);
        });
      }
      
      if (rule.type === 'surcharge' && rule.surcharge) {
        console.log(`Surcharge:`);
        console.log(`  Name: ${rule.surcharge.name}`);
        console.log(`  Charge: ${rule.surcharge.chargeValue}% / ${rule.surcharge.chargeType}`);
      }
      
      if (rule.type === 'promotion' && rule.promotion) {
        console.log(`Promotion:`);
        console.log(`  Name: ${rule.promotion.name}`);
        console.log(`  Discount: ${rule.promotion.discountValue}% / ${rule.promotion.discountType}`);
      }
    });
    
    // Check for any rules that might be miscategorized
    console.log("\n=== Analysis ===");
    const ageRules = pricingRules.filter(r => r.type === 'ageBracket');
    const seasonalRules = pricingRules.filter(r => r.type === 'seasonal');
    const surchargeRules = pricingRules.filter(r => r.type === 'surcharge');
    const promotionRules = pricingRules.filter(r => r.type === 'promotion');
    
    console.log(`Age Bracket Rules: ${ageRules.length}`);
    console.log(`Seasonal Rules: ${seasonalRules.length}`);
    console.log(`Surcharge Rules: ${surchargeRules.length}`);
    console.log(`Promotion Rules: ${promotionRules.length}`);
    
    // Look for potential misclassified seasonal/surcharge rules
    const suspiciousPromotions = promotionRules.filter(rule => 
      rule.name && (
        rule.name.toLowerCase().includes('season') ||
        rule.name.toLowerCase().includes('winter') ||
        rule.name.toLowerCase().includes('summer') ||
        rule.name.toLowerCase().includes('surcharge') ||
        rule.name.toLowerCase().includes('phụ thu')
      )
    );
    
    if (suspiciousPromotions.length > 0) {
      console.log("\n⚠️  Potentially misclassified rules:");
      suspiciousPromotions.forEach(rule => {
        console.log(`  - "${rule.name}" (Type: ${rule.type}) - might be seasonal/surcharge`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkPricingRulesData();