// Test script to verify phone lookup functionality for RSVP
const http = require('http');

console.log('📞 Testing Phone Lookup for RSVP...\n');

// Test function to make HTTP requests
function testAPI(method, path, data, description) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          console.log(`${res.statusCode < 400 ? '✅' : '❌'} ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          if (jsonData.data && Array.isArray(jsonData.data)) {
            console.log(`   Results: ${jsonData.data.length} guests found`);
            jsonData.data.forEach((guest, index) => {
              console.log(`     ${index + 1}. ${guest.name} - ${guest.phoneNumber} - ${guest.rsvpStatus}`);
            });
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
          console.log('');
          resolve({ success: res.statusCode < 400, data: jsonData, status: res.statusCode });
        } catch (error) {
          console.log(`❌ ${description} - JSON parse error:`, error.message);
          console.log(`   Raw response: ${responseData.substring(0, 300)}...`);
          console.log('');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - Request error:`, error.message);
      console.log('');
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`❌ ${description} - Request timeout`);
      console.log('');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test phone lookup functionality
async function testPhoneLookup() {
  try {
    console.log('📞 Testing Phone Lookup for RSVP\\n');
    
    // Test 1: Get all guests to see available phone numbers
    console.log('🔹 Test 1: Get all guests to see available phone numbers');
    const allGuestsResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get All Guests');
    
    if (!allGuestsResponse.success || !allGuestsResponse.data.data.length) {
      console.log('❌ No guests found for testing');
      return;
    }
    
    const testGuest = allGuestsResponse.data.data[0];
    const testPhoneNumber = testGuest.phoneNumber;
    console.log(`   Selected test phone: ${testPhoneNumber} (${testGuest.name})`);
    
    // Test 2: Test phone lookup using search endpoint (like frontend does)
    console.log('🔹 Test 2: Test phone lookup using search endpoint');
    const searchUrl = `/api/guests/demo-event-1/search?search=${encodeURIComponent(testPhoneNumber)}`;
    console.log(`   Search URL: ${searchUrl}`);
    
    const searchResponse = await testAPI('GET', searchUrl, null, 'Phone Number Search');
    
    if (searchResponse.success && searchResponse.data.data) {
      const matchingGuest = searchResponse.data.data.find(guest => guest.phoneNumber === testPhoneNumber);
      if (matchingGuest) {
        console.log(`   ✅ Phone lookup successful!`);
        console.log(`   Found: ${matchingGuest.name} (${matchingGuest.id})`);
        console.log(`   RSVP Status: ${matchingGuest.rsvpStatus}`);
        console.log(`   Email: ${matchingGuest.email || 'Not provided'}`);
      } else {
        console.log(`   ❌ Phone number not found in search results`);
        console.log(`   This could cause the \"existing guest\" logic to fail`);
      }
    }
    
    // Test 3: Test with different phone number formats
    console.log('🔹 Test 3: Test different phone number formats');
    const phoneFormats = [
      testPhoneNumber,
      testPhoneNumber.replace(/^60/, '+60'),
      testPhoneNumber.replace(/^60/, '0'),
      testPhoneNumber.replace(/\\D/g, '') // Remove all non-digits
    ];
    
    for (const phoneFormat of phoneFormats) {
      const formatSearchUrl = `/api/guests/demo-event-1/search?search=${encodeURIComponent(phoneFormat)}`;
      const formatResponse = await testAPI('GET', formatSearchUrl, null, `Phone Format: ${phoneFormat}`);
      
      if (formatResponse.success && formatResponse.data.data) {
        const match = formatResponse.data.data.find(guest => guest.phoneNumber === testPhoneNumber);
        console.log(`     Format ${phoneFormat}: ${match ? '✅ Found' : '❌ Not found'}`);
      }
    }
    
    // Test 4: Test the complete RSVP flow simulation
    console.log('🔹 Test 4: Simulate complete RSVP update flow');
    
    // Step 1: Phone lookup (like frontend does)
    const lookupResponse = await testAPI(
      'GET', 
      `/api/guests/demo-event-1/search?search=${encodeURIComponent(testPhoneNumber)}`, 
      null, 
      'Step 1: Phone Lookup'
    );
    
    if (lookupResponse.success && lookupResponse.data.data) {
      const existingGuest = lookupResponse.data.data.find(guest => guest.phoneNumber === testPhoneNumber);
      
      if (existingGuest) {
        console.log(`   ✅ Step 1 successful: Found existing guest ${existingGuest.name}`);
        
        // Step 2: Update the guest (like frontend does)
        const updateData = {
          name: existingGuest.name,
          email: existingGuest.email || 'test@example.com',
          relationshipType: existingGuest.relationshipType || 'Friend',
          brideOrGroomSide: existingGuest.brideOrGroomSide || 'bride',
          rsvpStatus: 'accepted',
          mealPreference: 'Chicken',
          dietaryRestrictions: ['Vegetarian', 'No shellfish'],
          additionalGuestCount: 1,
          specialRequests: 'Phone lookup RSVP test - ' + new Date().toISOString()
        };
        
        const updateResponse = await testAPI(
          'PUT', 
          `/api/guests/${existingGuest.id}`, 
          updateData, 
          'Step 2: Update Guest RSVP'
        );
        
        if (updateResponse.success) {
          console.log(`   ✅ Step 2 successful: RSVP updated`);
          console.log(`   Updated Status: ${updateResponse.data.data.rsvpStatus}`);
          console.log(`   Updated Dietary: ${updateResponse.data.data.dietaryRestrictions.join(', ')}`);
        } else {
          console.log(`   ❌ Step 2 failed: RSVP update failed`);
          console.log(`   This is likely the source of the \"Failed to update rsvp\" error`);
        }
      } else {
        console.log(`   ❌ Step 1 failed: Phone number not found in search results`);
        console.log(`   This would cause the frontend to show \"new guest\" form instead of update form`);
      }
    }
    
    console.log('\\n📊 Phone Lookup Test Summary:');
    console.log('');
    
    const searchWorking = searchResponse.success && searchResponse.data.data.find(g => g.phoneNumber === testPhoneNumber);
    
    if (searchWorking) {
      console.log('✅ PHONE LOOKUP FUNCTIONALITY: Working');
      console.log('   ✅ Search endpoint responds correctly');
      console.log('   ✅ Phone number matching works');
      console.log('   ✅ Guest data is returned properly');
    } else {
      console.log('❌ PHONE LOOKUP FUNCTIONALITY: Failed');
      console.log('   ❌ Phone number search not working');
      console.log('   This could cause the RSVP update to fail');
    }
    
    console.log('');
    console.log('🎯 DEBUGGING STEPS:');
    console.log('   1. Open: http://localhost:3000/public/demo-event-1');
    console.log(`   2. Enter phone number: ${testPhoneNumber}`);
    console.log('   3. Check if it finds the existing guest');
    console.log('   4. If not found, check phone number format in demo data');
    console.log('   5. If found but update fails, check browser console for errors');
    
  } catch (error) {
    console.log('❌ Phone lookup test failed:', error.message);
  }
}

testPhoneLookup();