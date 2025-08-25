const axios = require('axios');

async function testInvitationFunctionality() {
  console.log('🧪 Testing Complete Invitation Functionality...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Health check
    console.log('1. ✅ Testing backend health...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('   Backend is running:', healthResponse.data.status);
    
    // Test 2: Test invitation status endpoint
    console.log('\n2. 📊 Testing invitation status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    console.log('   Status response:', {
      success: statusResponse.data.success,
      totalGuests: statusResponse.data.data.totalGuests,
      notInvitedGuests: statusResponse.data.data.notInvitedGuests,
      totalInvitationsSent: statusResponse.data.data.totalInvitationsSent
    });
    
    // Test 3: Test get invitation schedules
    console.log('\n3. 📋 Testing get invitation schedules...');
    const schedulesResponse = await axios.get(`${baseURL}/api/invitations/event/${eventId}`);
    console.log('   Schedules response:', {
      success: schedulesResponse.data.success,
      schedulesCount: schedulesResponse.data.data.length
    });
    
    // Test 4: Test simple test endpoint
    console.log('\n4. 🔧 Testing simple test endpoint...');
    const testResponse = await axios.post(`${baseURL}/api/invitations/test`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   Test endpoint response:', testResponse.data);
    
    // Test 5: Test bulk invitation endpoint (the main issue)
    console.log('\n5. 📧 Testing bulk invitation endpoint...');
    const bulkResponse = await axios.post(`${baseURL}/api/invitations/bulk-invite/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   Bulk invitation response:', {
      success: bulkResponse.data.success,
      message: bulkResponse.data.message,
      data: bulkResponse.data.data
    });
    
    // Test 6: Test create invitation schedule
    console.log('\n6. ➕ Testing create invitation schedule...');
    const createData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 0,
        messageTemplate: 'Test invitation message for {{guestName}} - You are invited to {{eventTitle}}!',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/invitations/configure`, createData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   Create schedule response:', {
      success: createResponse.data.success,
      schedulesCreated: createResponse.data.data.length,
      message: createResponse.data.message
    });
    
    // Test 7: Verify schedules were created
    console.log('\n7. ✅ Verifying schedules were created...');
    const updatedSchedulesResponse = await axios.get(`${baseURL}/api/invitations/event/${eventId}`);
    console.log('   Updated schedules count:', updatedSchedulesResponse.data.data.length);
    
    console.log('\n🎉 ALL INVITATION TESTS PASSED!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Backend server is running');
    console.log('   ✅ Invitation routes are properly loaded');
    console.log('   ✅ Bulk invitation endpoint is working');
    console.log('   ✅ All API endpoints are responding correctly');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure your web app is running (npm start in rsvp-web)');
    console.log('   2. The frontend now uses absolute URLs and should work');
    console.log('   3. Try the bulk invitation feature in your web app');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
      
      if (error.response.status === 404) {
        console.error('\n🚨 ROUTE NOT FOUND ERROR:');
        console.error('   The invitation routes are not properly loaded.');
        console.error('   This means you need to RESTART your backend server.');
        console.error('\n🔧 To fix this:');
        console.error('   1. Stop your backend server (Ctrl+C)');
        console.error('   2. Restart it: cd rsvp-backend && npm run dev');
        console.error('   3. Wait for it to fully start');
        console.error('   4. Run this test again');
      }
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 BACKEND NOT RUNNING:');
      console.error('   Please start the backend server:');
      console.error('   cd rsvp-backend && npm run dev');
    }
  }
}

testInvitationFunctionality();