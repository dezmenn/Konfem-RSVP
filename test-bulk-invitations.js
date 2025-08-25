const axios = require('axios');

async function testBulkInvitations() {
  console.log('Testing Bulk Invitations API...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Test invitation status
    console.log('\n2. Testing invitation status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    console.log('✅ Invitation status:', statusResponse.data);
    
    // Test 3: Test get invitation schedules
    console.log('\n3. Testing get invitation schedules...');
    const schedulesResponse = await axios.get(`${baseURL}/api/invitations/event/${eventId}`);
    console.log('✅ Invitation schedules:', schedulesResponse.data);
    
    // Test 4: Test bulk invitation endpoint
    console.log('\n4. Testing bulk invitation endpoint...');
    const bulkResponse = await axios.post(`${baseURL}/api/invitations/bulk-invite/${eventId}`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Bulk invitation response:', bulkResponse.data);
    
    // Test 5: Test create invitation schedule
    console.log('\n5. Testing create invitation schedule...');
    const createData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 0,
        messageTemplate: 'Test invitation message for {{guestName}}',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/invitations/configure`, createData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Create invitation schedule:', createResponse.data);
    
    console.log('\n🎉 All invitation API tests passed! The backend is working correctly.');
    console.log('\nIf you\'re still getting the HTML error in the frontend:');
    console.log('1. The frontend is using relative URLs that need to be changed to absolute URLs');
    console.log('2. Make sure the web app is running on http://localhost:3000');
    console.log('3. Check browser developer tools for network errors');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 Backend server is not running!');
      console.error('Please start the backend with: npm run dev:backend');
    }
  }
}

testBulkInvitations();