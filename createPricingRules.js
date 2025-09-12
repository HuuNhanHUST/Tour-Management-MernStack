const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base URL - Change this if your server runs on a different port
const BASE_URL = 'http://localhost:4000/api/v1';

// Function to authenticate as admin and get token
async function loginAsAdmin() {
  try {
    console.log('Logging in as admin...');
    const credentials = {
      email: '', // We'll get this from user input
      password: '' // We'll get this from user input
    };

    // Get admin credentials
    credentials.email = await new Promise(resolve => {
      rl.question('Enter admin email: ', (answer) => resolve(answer));
    });
    
    credentials.password = await new Promise(resolve => {
      rl.question('Enter admin password: ', (answer) => resolve(answer));
    });

    // Make the login request
    const response = await axios.post(
      `${BASE_URL}/auth/login`, 
      credentials,
      { withCredentials: true }
    );

    if (response.data.success) {
      console.log('✅ Login successful!');
      // Return the cookie for subsequent requests
      return response.headers['set-cookie'][0];
    } else {
      console.error('⚠️ Login failed:', response.data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('⚠️ Authentication error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Function to get all tours
async function getAllTours(cookie) {
  try {
    console.log('Fetching all tours...');
    const response = await axios.get(
      `${BASE_URL}/tour/all`,
      { 
        headers: { Cookie: cookie },
        withCredentials: true
      }
    );

    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.length} tours`);
      return response.data.data;
    } else {
      console.error('⚠️ Failed to fetch tours:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('⚠️ Error fetching tours:', error.response?.data?.message || error.message);
    return [];
  }
}

// Function to create a basic pricing rule for a tour
async function createPricingRule(tourId, tourTitle, cookie) {
  try {
    // Basic age bracket pricing rule
    const pricingRule = {
      tourId: tourId,
      name: `Standard Pricing for ${tourTitle}`,
      description: 'Default pricing rule with standard age brackets',
      type: 'ageBracket',
      ageBrackets: [
        {
          name: 'Adult',
          minAge: 18,
          maxAge: 65,
          discountType: 'percentage',
          discountValue: 0, // No discount (base price)
          requiredId: false
        },
        {
          name: 'Child',
          minAge: 2,
          maxAge: 17,
          discountType: 'percentage',
          discountValue: 50, // 50% discount for children
          requiredId: false
        },
        {
          name: 'Infant',
          minAge: 0,
          maxAge: 1,
          discountType: 'percentage',
          discountValue: 100, // Free for infants (100% discount)
          requiredId: false
        },
        {
          name: 'Senior',
          minAge: 66,
          maxAge: 120,
          discountType: 'percentage',
          discountValue: 30, // 30% discount for seniors
          requiredId: false
        }
      ],
      isActive: true
    };

    const response = await axios.post(
      `${BASE_URL}/pricing`,
      pricingRule,
      { 
        headers: { Cookie: cookie },
        withCredentials: true
      }
    );

    if (response.data.success) {
      console.log(`✅ Created pricing rule for "${tourTitle}"`);
      return true;
    } else {
      console.error(`⚠️ Failed to create pricing rule for "${tourTitle}":`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`⚠️ Error creating pricing rule for "${tourTitle}":`, error.response?.data?.message || error.message);
    return false;
  }
}

// Main function to execute the script
async function main() {
  console.log('========================================');
  console.log('🚀 Tour Management - Create Pricing Rules');
  console.log('========================================');
  
  try {
    // Step 1: Login as admin
    const cookie = await loginAsAdmin();
    
    // Step 2: Get all tours
    const tours = await getAllTours(cookie);
    
    if (tours.length === 0) {
      console.log('⚠️ No tours found. Please create tours first.');
      rl.close();
      return;
    }
    
    console.log('\nCreating basic pricing rules for all tours...\n');
    
    // Step 3: Create a basic pricing rule for each tour
    let successCount = 0;
    let failCount = 0;
    
    for (const tour of tours) {
      const success = await createPricingRule(tour._id, tour.title, cookie);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\n========================================');
    console.log(`✅ Successfully created ${successCount} pricing rules`);
    if (failCount > 0) {
      console.log(`⚠️ Failed to create ${failCount} pricing rules`);
    }
    console.log('========================================');
    console.log('\nNow you should be able to book tours successfully!');
    
  } catch (error) {
    console.error('❌ An unexpected error occurred:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
main();
