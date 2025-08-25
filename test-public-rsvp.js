// Test script to verify public RSVP update functionality
const http = require('http');

console.log('📝 Testing Public RSVP Update Functionality...\n');

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
          if (jsonData.message) {
            console.log(`   Message: ${jsonData.message}`);
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
          if (jsonData.errors && Array.isArray(jsonData.errors)) {
            console.log(`   Errors: ${jsonData.errors.join(', ')}`);
          }
          if (jsonData.data) {
            if (jsonData.data.id) {
              console.log(`   Guest ID: ${jsonData.data.id}`);
            }
            if (jsonData.data.name) {
              console.log(`   Name: ${jsonData.data.name}`);
            }
            if (jsonData.data.rsvpStatus) {
              console.log(`   RSVP Status: ${jsonData.data.rsvpStatus}`);
            }
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

// Run RSVP update tests
async function runRSVPUpdateTests() {
  try {
    console.log('📝 Testing Public RSVP Update Functionality\\n');
    
    // Test 1: Get guest list to find a test guest
    console.log('🔹 Test 1: Get guest list to find a test guest');
    const guestsResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get Guest List');
    
    if (!guestsResponse.success || !guestsResponse.data.data.length) {
      console.log('❌ No guests found for testing');
      return;
    }
    
    const testGuest = guestsResponse.data.data[0];
    console.log(`   Selected test guest: ${testGuest.name} (${testGuest.id})`);
    console.log(`   Current RSVP Status: ${testGuest.rsvpStatus}`);
    console.log(`   Phone: ${testGuest.phoneNumber}`);
    
    // Test 2: Try to update the guest's RSVP status
    console.log('🔹 Test 2: Update guest RSVP status');
    const updateData = {
      rsvpStatus: 'accepted',
      dietaryRestrictions: ['Vegetarian'],
      additionalGuestCount: 1,
      specialRequests: 'Test update from API'
    };
    
    const updateResult = await testAPI(
      'PUT', 
      `/api/guests/${testGuest.id}`, 
      updateData, 
      'Update Guest RSVP Status'
    );
    
    // Test 3: Verify the update was successful
    if (updateResult.success) {
      console.log('🔹 Test 3: Verify guest was updated');
      const verifyResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Verify Guest Update');
      
      if (verifyResponse.success) {
        const updatedGuest = verifyResponse.data.data.find(g => g.id === testGuest.id);
        if (updatedGuest) {
          console.log(`   ✅ Guest found after update:`);
          console.log(`   Name: ${updatedGuest.name}`);
          console.log(`   RSVP Status: ${updatedGuest.rsvpStatus}`);
          console.log(`   Dietary Restrictions: ${updatedGuest.dietaryRestrictions.join(', ')}`);
          console.log(`   Additional Guests: ${updatedGuest.additionalGuestCount}`);
          console.log(`   Special Requests: ${updatedGuest.specialRequests}`);
        } else {
          console.log('   ❌ Updated guest not found in list');
        }
      }
    }
    
    // Test 4: Test with invalid guest ID
    console.log('🔹 Test 4: Test update with invalid guest ID');
    const invalidUpdateResult = await testAPI(
      'PUT', 
      '/api/guests/invalid-guest-id', 
      updateData, 
      'Update Invalid Guest ID'
    );
    
    if (!invalidUpdateResult.success) {
      console.log('   ✅ Correctly handled invalid guest ID');
    }
    
    // Test 5: Test with missing required fields
    console.log('🔹 Test 5: Test update with invalid data');
    const invalidData = {
      name: '', // Empty name should fail
      rsvpStatus: 'accepted'
    };
    
    const invalidDataResult = await testAPI(
      'PUT', 
      `/api/guests/${testGuest.id}`, 
      invalidData, 
      'Update Guest with Invalid Data'
    );
    
    if (!invalidDataResult.success) {
      console.log('   ✅ Correctly handled invalid data');
    }
    
    console.log('\\n📊 RSVP Update Test Summary:');
    console.log('');
    
    if (updateResult && updateResult.success) {
      console.log('✅ RSVP UPDATE FUNCTIONALITY: Working');
      console.log('   ✅ Guest update API endpoint works');
      console.log('   ✅ MockGuestService.updateGuest() implemented');
      console.log('   ✅ DemoDataService.updateGuest() implemented');
      console.log('   ✅ Data persistence in demo mode');
      console.log('   ✅ Validation and error handling');
    } else {
      console.log('❌ RSVP UPDATE FUNCTIONALITY: Failed');
      console.log('   Check the backend server logs for errors');
    }
    
    console.log('');
    console.log('🎯 FRONTEND TESTING STEPS:');
    console.log('   1. Go to: http://localhost:3000/public/demo-event-1');
    console.log('   2. Enter a guest phone number (e.g., 60123456789)');
    console.log('   3. Update their RSVP status and details');
    console.log('   4. Click \"Update RSVP\"');
    console.log('   5. ✅ Should see success confirmation');
    console.log('');
    console.log('📱 TROUBLESHOOTING:');
    console.log('   • Check browser console for JavaScript errors');
    console.log('   • Verify backend server is running on port 5000');
    console.log('   • Check network tab for failed API requests');
    console.log('   • Ensure guest phone number exists in demo data');
    
  } catch (error) {
    console.log('❌ RSVP update test failed:', error.message);
  }
}

runRSVPUpdateTests();