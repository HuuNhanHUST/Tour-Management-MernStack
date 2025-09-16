// Script to test pricing rules API
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';

async function testPricingAPI() {
  try {
    console.log("Testing pricing rules API...");
    
    // Get all tours to find tours with pricing rules
    console.log("\n1. Getting all tours...");
    const toursResponse = await axios.get(`${BASE_URL}/tour`);
    const tours = toursResponse.data.data;
    
    if (!tours || tours.length === 0) {
      console.log("No tours found");
      return;
    }
    
    console.log(`Found ${tours.length} tours`);
    
    // Check each tour for pricing rules
    for (let i = 0; i < Math.min(3, tours.length); i++) {
      const tour = tours[i];
      console.log(`\n=== Tour ${i + 1}: ${tour.title} ===`);
      console.log(`ID: ${tour._id}`);
      console.log(`Price: ${tour.price} VND`);
      
      try {
        // Get pricing rules for this tour
        const pricingResponse = await axios.get(`${BASE_URL}/pricing/tour/${tour._id}`);
        const pricingRules = pricingResponse.data.data;
        
        console.log(`Found ${pricingRules.length} pricing rules`);
        
        // Analyze each rule
        pricingRules.forEach((rule, index) => {
          console.log(`\n--- Rule ${index + 1} ---`);
          console.log(`Name: ${rule.name}`);
          console.log(`Type: ${rule.type}`);
          
          if (rule.type === 'ageBracket' && rule.ageBrackets) {
            console.log(`Age Brackets:`);
            rule.ageBrackets.forEach((bracket) => {
              const discountedPrice = bracket.discountType === 'percentage' 
                ? Math.round(tour.price * (1 - bracket.discountValue / 100))
                : tour.price - bracket.discountValue;
              console.log(`  ${bracket.name}: ${bracket.discountValue}% discount = ${discountedPrice.toLocaleString()} VND`);
            });
          }
          
          if (rule.type === 'seasonal' || rule.type === 'surcharge' || rule.type === 'promotion') {
            console.log(`Details:`, JSON.stringify(rule, null, 2));
          }
        });
        
      } catch (error) {
        console.log(`No pricing rules for this tour or error: ${error.response?.status}`);
      }
    }
    
    // Get all pricing rules to check for misclassified ones
    console.log("\n=== Checking all pricing rules ===");
    try {
      const allRulesResponse = await axios.get(`${BASE_URL}/pricing`);
      const allRules = allRulesResponse.data.data;
      
      console.log(`Total pricing rules in system: ${allRules.length}`);
      
      // Look for seasonal/surcharge rules
      const seasonalSurchargeRules = allRules.filter(rule => 
        rule.type === 'seasonal' || rule.type === 'surcharge' || 
        (rule.type === 'promotion' && rule.name && (
          rule.name.toLowerCase().includes('season') ||
          rule.name.toLowerCase().includes('winter') ||
          rule.name.toLowerCase().includes('summer') ||
          rule.name.toLowerCase().includes('surcharge') ||
          rule.name.toLowerCase().includes('phụ thu')
        ))
      );
      
      if (seasonalSurchargeRules.length > 0) {
        console.log(`\nFound ${seasonalSurchargeRules.length} seasonal/surcharge rules:`);
        seasonalSurchargeRules.forEach((rule, idx) => {
          console.log(`  ${idx + 1}. "${rule.name}" (Type: ${rule.type})`);
        });
      }
      
    } catch (error) {
      console.log("Could not get all pricing rules:", error.response?.status);
    }
    
  } catch (error) {
    console.error("Error testing API:", error.response?.data || error.message);
  }
}

testPricingAPI();