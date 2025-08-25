/**
 * Test Backend Routes
 * Directly tests if the backend routes are working
 */

const axios = require('axios');

async function testBackendRoutes() {
  console.log('🔍 Testing Backend Routes...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  // Test basic endpoints first
  console.log('1. Testing basic endpoints...');
  try {
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health endpoint working');
    
    const apiResponse = await axios.get(`${baseUrl}/api`);
    console.log('✅ API endpoint working');
  } catch (error) {
    console.log('❌ Basic endpoints failed');
    return;
  }
  
  // Test specific API routes
  console.log('\n2. Testing API routes...');
  const routes = [
    '/api/guests',
    '/api/invitations',
    '/api/tables',
    '/api/venue-layout'
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${baseUrl}${route}`);
      console.log(`✅ ${route} - SUCCESS (${response.status})`);
      
      if (Array.isArray(response.data)) {
        console.log(`   Found ${response.data.length} items`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${route} - HTTP ${error.response.status}`);
      } else {
        console.log(`❌ ${route} - ${error.message}`);
      }
    }
  }
  
  // Test POST to create a guest (should work in demo mode)
  console.log('\n3. Testing POST request...');
  try {
    const newGuest = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      rsvpStatus: 'pending',
      eventId: 'demo-event-1'
    };
    
    const response = await axios.post(`${baseUrl}/api/guests`, newGuest);
    console.log('✅ POST /api/guests - SUCCESS');
    console.log(`   Created guest with ID: ${response.data.id}`);
  } catch (error) {
    if (error.response) {
      console.log(`❌ POST /api/guests - HTTP ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`❌ POST /api/guests - ${error.message}`);
    }
  }
}

async function main() {
  await testBackendRoutes();
  
  console.log('\n💡 If routes are failing:');
  console.log('1. Check backend console for TypeScript compilation errors');
  console.log('2. Restart the backend server');
  console.log('3. Verify SKIP_DB_SETUP=true in .env file');
  console.log('4. Check if all route files exist and export correctly');
}

main().catch(console.error);