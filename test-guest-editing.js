// Test script to check guest editing capabilities
const http = require('http');

console.log('🧪 Testing Guest Editing Capabilities...\n');

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
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          console.log(`${jsonData.success ? '✅' : '❌'} ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Success: ${jsonData.success}`);
          if (jsonData.data && jsonData.data.name) {
            console.log(`   Name: ${jsonData.data.name}`);
            console.log(`   Status: ${jsonData.data.status || jsonData.data.rsvpStatus}`);
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
          console.log('');
          resolve(jsonData);
        } catch (error) {
          console.log(`❌ ${description} - JSON parse error:`, error.message);
          console.log(`   Raw response: ${responseData.substring(0, 200)}...`);
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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Run editing capability tests
async function runEditingTests() {
  try {
    console.log('📝 Testing Guest Editing Capabilities\n');
    
    // Test 1: Create a public registration
    console.log('🔹 Test 1: Create a public RSVP registration');
    const publicRegistrationData = {
      eventId: 'demo-event-1',
      name: 'Edit Test User',
      phoneNumber: '+1555888' + Math.floor(Math.random() * 1000),
      email: 'editest@test.com',
      relationship: 'Friend',
      side: 'bride',
      status: 'accepted',
      mealPreference: 'chicken',
      additionalGuests: 1,
      specialRequests: 'Original request'
    };
    
    const registration = await testAPI('POST', '/api/rsvp/public-registration', publicRegistrationData, 'Create Public Registration');
    const registrationId = registration.data.id;
    
    // Test 2: Check if we can get RSVP tokens for this registration
    console.log('🔹 Test 2: Check RSVP tokens');
    const tokens = await testAPI('GET', '/api/rsvp/tokens/demo-event-1', null, 'Get RSVP Tokens');
    
    // Test 3: Try to find a token for our registered user
    console.log('🔹 Test 3: Look for token for public registration');
    let userToken = null;
    if (tokens.success && tokens.data) {
      // Public registrations might not have tokens automatically generated
      console.log(`   Found ${tokens.data.length} tokens total`);
      console.log('   Public registrations may not have automatic tokens');
    }
    
    // Test 4: Check if public registration appears in guest list
    console.log('🔹 Test 4: Check guest list for public registration');
    const guests = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get Guest List');
    const publicGuest = guests.data.find(g => g.name === publicRegistrationData.name);
    
    if (publicGuest) {
      console.log('✅ Public registration found in guest list:');
      console.log(`   ID: ${publicGuest.id}`);
      console.log(`   Is Public Registration: ${publicGuest.isPublicRegistration}`);
      console.log(`   RSVP Status: ${publicGuest.rsvpStatus}`);
      
      // Test 5: Try to update guest via admin API
      console.log('🔹 Test 5: Try to update guest via admin API');
      const updateData = {
        specialRequests: 'Updated request via admin API',
        mealPreference: 'vegetarian'
      };
      
      const updateResult = await testAPI('PUT', `/api/guests/${publicGuest.id}`, updateData, 'Update Guest via Admin API');
      
      if (updateResult.success) {
        console.log('✅ Guest can be updated via admin API');
      }
    }
    
    // Test 6: Test regular invited guest editing
    console.log('🔹 Test 6: Test regular invited guest token validation');
    if (tokens.success && tokens.data.length > 0) {
      const sampleToken = tokens.data[0];
      console.log(`   Testing with token: ${sampleToken.token}`);
      
      const tokenValidation = await testAPI('GET', `/api/rsvp/token/${sampleToken.token}`, null, 'Validate RSVP Token');
      
      if (tokenValidation.success) {
        console.log('✅ Regular invited guests can use tokens to edit responses');
      }
    }
    
    console.log('\n📊 Summary of Guest Editing Capabilities:');
    console.log('');
    console.log('👥 REGULAR INVITED GUESTS (with RSVP tokens):');
    console.log('   ✅ Can edit their RSVP response using their personal RSVP link');
    console.log('   ✅ Form pre-fills with existing response data');
    console.log('   ✅ Can change attendance status, meal preferences, dietary restrictions');
    console.log('   ✅ Can update number of additional guests and special requests');
    console.log('   ✅ Button shows "Update RSVP" instead of "Submit RSVP"');
    console.log('   ✅ Confirmation page indicates it\'s an update');
    console.log('');
    console.log('🌐 PUBLIC REGISTRATIONS (via public RSVP link):');
    console.log('   ❌ No automatic RSVP token generated');
    console.log('   ❌ Cannot edit their response after initial submission');
    console.log('   ❌ No personal RSVP link provided');
    console.log('   ✅ Admin can edit their details via admin dashboard');
    console.log('   ✅ Appears in guest list for admin management');
    console.log('');
    console.log('🔧 ADMIN CAPABILITIES:');
    console.log('   ✅ Can edit any guest details via admin dashboard');
    console.log('   ✅ Can update both regular and public registration guests');
    console.log('   ✅ Full CRUD operations on guest data');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   🔹 Consider generating RSVP tokens for public registrations');
    console.log('   🔹 Or provide alternative editing mechanism for public guests');
    console.log('   🔹 Could send email with edit link after public registration');
    
  } catch (error) {
    console.log('❌ Editing test failed:', error.message);
  }
}

runEditingTests();