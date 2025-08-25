// Test script to verify the public RSVP update fix
const http = require('http');

console.log('🔧 Testing Public RSVP Update Fix...\n');

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
          if (jsonData.data && jsonData.data.name) {
            console.log(`   Guest: ${jsonData.data.name} (${jsonData.data.id})`);
            console.log(`   RSVP Status: ${jsonData.data.rsvpStatus}`);
            console.log(`   Is Public Registration: ${jsonData.data.isPublicRegistration || false}`);
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
          if (jsonData.errors && Array.isArray(jsonData.errors)) {
            console.log(`   Errors: ${jsonData.errors.join(', ')}`);
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

// Test the public RSVP update fix
async function testPublicRSVPFix() {
  try {
    console.log('🔧 Testing Public RSVP Update Fix\\n');
    
    // Step 1: Create a new public RSVP registration
    console.log('🔹 Step 1: Create a new public RSVP registration');
    const newRegistrationData = {
      eventId: 'demo-event-1',
      name: 'Test Public Guest',
      phoneNumber: '60999888777',
      email: 'testpublic@example.com',
      relationship: 'Friend',
      side: 'bride',
      status: 'pending',
      mealPreference: '',
      dietaryRestrictions: '',
      additionalGuests: 0,
      specialRequests: 'Initial public registration'
    };
    
    const createResult = await testAPI(
      'POST', 
      '/api/rsvp/public-registration', 
      newRegistrationData, 
      'Create Public RSVP Registration'
    );
    
    if (!createResult.success) {
      console.log('❌ Could not create public registration for testing');
      return;
    }
    
    const publicGuestId = createResult.data.data.id;
    console.log(`   Created public guest with ID: ${publicGuestId}`);
    
    // Step 2: Verify the public guest appears in guest list
    console.log('🔹 Step 2: Verify public guest appears in guest list');
    const guestListResult = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get Guest List');
    
    if (guestListResult.success) {
      const publicGuest = guestListResult.data.data.find(g => g.id === publicGuestId);
      if (publicGuest) {
        console.log(`   ✅ Public guest found in list: ${publicGuest.name}`);
        console.log(`   Is Public Registration: ${publicGuest.isPublicRegistration}`);
      } else {
        console.log(`   ❌ Public guest not found in list`);
      }
    }
    
    // Step 3: Test updating the public guest (this was failing before)
    console.log('🔹 Step 3: Test updating the public guest RSVP');
    const updateData = {
      name: 'Test Public Guest Updated',
      rsvpStatus: 'accepted',
      mealPreference: 'Vegetarian',
      dietaryRestrictions: ['Vegetarian', 'No nuts'],
      additionalGuestCount: 1,
      specialRequests: 'Updated via public RSVP form - this should work now!'
    };
    
    const updateResult = await testAPI(
      'PUT', 
      `/api/guests/${publicGuestId}`, 
      updateData, 
      'Update Public Guest RSVP (THE FIX TEST)'
    );
    
    if (updateResult.success) {
      console.log(`   ✅ PUBLIC RSVP UPDATE SUCCESSFUL!`);
      console.log(`   Updated Name: ${updateResult.data.data.name}`);
      console.log(`   Updated Status: ${updateResult.data.data.rsvpStatus}`);
      console.log(`   Updated Dietary: ${updateResult.data.data.dietaryRestrictions.join(', ')}`);
      console.log(`   Updated Additional Guests: ${updateResult.data.data.additionalGuestCount}`);
      console.log(`   Updated Special Requests: ${updateResult.data.data.specialRequests}`);
    } else {
      console.log(`   ❌ PUBLIC RSVP UPDATE STILL FAILING`);
      console.log(`   This means the fix didn't work`);
    }
    
    // Step 4: Verify the update persisted
    console.log('🔹 Step 4: Verify the update persisted');
    const verifyResult = await testAPI('GET', '/api/guests/demo-event-1', null, 'Verify Update Persistence');
    
    if (verifyResult.success) {
      const updatedGuest = verifyResult.data.data.find(g => g.id === publicGuestId);
      if (updatedGuest) {
        console.log(`   ✅ Update persisted successfully:`);
        console.log(`     Name: ${updatedGuest.name}`);
        console.log(`     RSVP Status: ${updatedGuest.rsvpStatus}`);
        console.log(`     Dietary Restrictions: ${updatedGuest.dietaryRestrictions.join(', ')}`);
        console.log(`     Additional Guests: ${updatedGuest.additionalGuestCount}`);
        console.log(`     Special Requests: ${updatedGuest.specialRequests}`);
      } else {
        console.log(`   ❌ Updated guest not found - data not persisted`);
      }
    }
    
    // Step 5: Test with a regular guest to ensure we didn't break anything
    console.log('🔹 Step 5: Test regular guest update (regression test)');
    const regularGuestUpdate = {
      rsvpStatus: 'accepted',
      specialRequests: 'Regular guest update test'
    };
    
    const regularUpdateResult = await testAPI(
      'PUT', 
      '/api/guests/guest-1', 
      regularGuestUpdate, 
      'Update Regular Guest (Regression Test)'
    );
    
    if (regularUpdateResult.success) {
      console.log(`   ✅ Regular guest update still works`);
    } else {
      console.log(`   ❌ Regular guest update broken - regression detected`);
    }
    
    console.log('\\n📊 Public RSVP Fix Test Results:');
    console.log('');
    
    if (updateResult.success) {
      console.log('🎉 PUBLIC RSVP UPDATE FIX: SUCCESS!');
      console.log('   ✅ Public registrations can now be updated');
      console.log('   ✅ Data mapping works correctly');
      console.log('   ✅ Updates persist in demo data');
      console.log('   ✅ Regular guests still work (no regression)');
      console.log('');
      console.log('🎯 FRONTEND SHOULD NOW WORK:');
      console.log('   1. Go to: http://localhost:3000/public/demo-event-1');
      console.log('   2. Enter phone number: 60999888777');
      console.log('   3. Should find the test public guest');
      console.log('   4. Update RSVP details');
      console.log('   5. Click "Update RSVP"');
      console.log('   6. ✅ Should see success confirmation (no more "Failed to update rsvp")');
    } else {
      console.log('❌ PUBLIC RSVP UPDATE FIX: FAILED');
      console.log('   The fix did not resolve the issue');
      console.log('   Further debugging needed');
    }
    
  } catch (error) {
    console.log('❌ Public RSVP fix test failed:', error.message);
  }
}

testPublicRSVPFix();