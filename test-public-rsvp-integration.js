// Integration test to simulate exactly what the frontend is doing
const http = require('http');

console.log('🔄 Testing Public RSVP Integration (Frontend Simulation)...\n');

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
        console.log(`${res.statusCode < 400 ? '✅' : '❌'} ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response OK: ${res.statusCode >= 200 && res.statusCode < 300}`);
        
        try {
          const jsonData = JSON.parse(responseData);
          console.log(`   JSON Parse: Success`);
          if (jsonData.success !== undefined) {
            console.log(`   Success Field: ${jsonData.success}`);
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
          if (jsonData.errors && Array.isArray(jsonData.errors)) {
            console.log(`   Errors: ${jsonData.errors.join(', ')}`);
          }
          if (jsonData.data && jsonData.data.name) {
            console.log(`   Updated Guest: ${jsonData.data.name}`);
          }
          console.log('');
          resolve({ 
            success: res.statusCode >= 200 && res.statusCode < 300, 
            data: jsonData, 
            status: res.statusCode,
            responseOk: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          console.log(`   JSON Parse: Failed - ${error.message}`);
          console.log(`   Raw response: ${responseData.substring(0, 300)}...`);
          console.log('');
          resolve({ 
            success: false, 
            data: { error: 'JSON parse error', raw: responseData }, 
            status: res.statusCode,
            responseOk: res.statusCode >= 200 && res.statusCode < 300
          });
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

// Simulate exactly what the frontend does
async function simulateFrontendRSVPUpdate() {
  try {
    console.log('🔄 Simulating Frontend RSVP Update Process\\n');
    
    // Step 1: Get a guest to update (simulate phone lookup)
    console.log('🔹 Step 1: Get guest list (simulate phone lookup)');
    const guestsResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get Guest List');
    
    if (!guestsResponse.success || !guestsResponse.data.data.length) {
      console.log('❌ No guests found for testing');
      return;
    }
    
    const testGuest = guestsResponse.data.data[0];
    console.log(`   Found guest: ${testGuest.name} (${testGuest.id})`);
    console.log(`   Phone: ${testGuest.phoneNumber}`);
    console.log(`   Current Status: ${testGuest.rsvpStatus}`);
    
    // Step 2: Simulate the exact update data that frontend sends
    console.log('🔹 Step 2: Simulate frontend update request');
    const frontendUpdateData = {
      name: testGuest.name,
      email: testGuest.email || 'test@example.com',
      relationshipType: testGuest.relationshipType || 'Friend',
      brideOrGroomSide: testGuest.brideOrGroomSide || 'bride',
      rsvpStatus: 'accepted', // Change status
      mealPreference: 'Chicken',
      dietaryRestrictions: ['Vegetarian', 'No nuts'],
      additionalGuestCount: 1,
      specialRequests: 'Updated via public RSVP form - integration test'
    };
    
    console.log('   Update data:');
    console.log(`     Name: ${frontendUpdateData.name}`);
    console.log(`     Email: ${frontendUpdateData.email}`);
    console.log(`     RSVP Status: ${frontendUpdateData.rsvpStatus}`);
    console.log(`     Dietary Restrictions: ${frontendUpdateData.dietaryRestrictions.join(', ')}`);
    
    // Step 3: Make the exact same request as frontend
    const updateResult = await testAPI(
      'PUT', 
      `/api/guests/${testGuest.id}`, 
      frontendUpdateData, 
      'Frontend-style Update Request'
    );
    
    // Step 4: Analyze the response like frontend would
    console.log('🔹 Step 3: Analyze response (frontend perspective)');
    console.log(`   Response OK (frontend check): ${updateResult.responseOk}`);
    console.log(`   Would frontend throw error: ${!updateResult.responseOk ? 'YES' : 'NO'}`);
    
    if (!updateResult.responseOk) {
      console.log('   ❌ Frontend would show \"Failed to update RSVP\" error');
      console.log('   This is the issue!');
      
      // Try to parse error like frontend does
      if (updateResult.data && updateResult.data.error) {
        console.log(`   Error message: ${updateResult.data.error}`);
      } else if (updateResult.data && updateResult.data.errors) {
        console.log(`   Error messages: ${updateResult.data.errors.join(', ')}`);
      } else {
        console.log('   Generic error: Failed to update RSVP');
      }
    } else {
      console.log('   ✅ Frontend would proceed to confirmation page');
    }
    
    // Step 5: Verify the update actually worked
    if (updateResult.responseOk) {
      console.log('🔹 Step 4: Verify update was successful');
      const verifyResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Verify Update');
      
      if (verifyResponse.success) {
        const updatedGuest = verifyResponse.data.data.find(g => g.id === testGuest.id);
        if (updatedGuest) {
          console.log('   ✅ Update verified:');
          console.log(`     RSVP Status: ${updatedGuest.rsvpStatus}`);
          console.log(`     Dietary Restrictions: ${updatedGuest.dietaryRestrictions.join(', ')}`);
          console.log(`     Additional Guests: ${updatedGuest.additionalGuestCount}`);
          console.log(`     Special Requests: ${updatedGuest.specialRequests}`);
        }
      }
    }
    
    console.log('\\n📊 Integration Test Results:');
    console.log('');
    
    if (updateResult.responseOk) {
      console.log('✅ RSVP UPDATE INTEGRATION: Working');
      console.log('   ✅ Backend API responds correctly');
      console.log('   ✅ Frontend should receive success response');
      console.log('   ✅ Data is updated in demo storage');
      console.log('');
      console.log('🤔 If frontend still shows error, check:');
      console.log('   • Browser console for JavaScript errors');
      console.log('   • Network tab for actual request/response');
      console.log('   • CORS issues (check browser console)');
      console.log('   • Frontend URL configuration');
    } else {
      console.log('❌ RSVP UPDATE INTEGRATION: Failed');
      console.log('   The backend is returning an error response');
      console.log('   This explains the \"Failed to update RSVP\" message');
    }
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
  }
}

simulateFrontendRSVPUpdate();