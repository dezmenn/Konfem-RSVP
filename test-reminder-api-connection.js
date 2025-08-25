const axios = require('axios');

async function testReminderAPI() {
  console.log('Testing Reminder API Connection...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Reminder status
    console.log('\n2. Testing reminder status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/reminders/status/${eventId}`);
    console.log('✅ Reminder status:', statusResponse.data);
    
    // Test 3: Get reminder schedules
    console.log('\n3. Testing get reminder schedules...');
    const schedulesResponse = await axios.get(`${baseURL}/api/reminders/event/${eventId}`);
    console.log('✅ Reminder schedules:', schedulesResponse.data);
    
    // Test 4: Create a test reminder schedule
    console.log('\n4. Testing create reminder schedule...');
    const createData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 7,
        messageTemplate: 'Test reminder message for {{guestName}}',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/reminders/configure`, createData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Create reminder schedule:', createResponse.data);
    
    // Test 5: Get updated schedules
    console.log('\n5. Testing updated reminder schedules...');
    const updatedSchedulesResponse = await axios.get(`${baseURL}/api/reminders/event/${eventId}`);
    console.log('✅ Updated reminder schedules:', updatedSchedulesResponse.data);
    
    console.log('\n🎉 All API tests passed! The backend is working correctly.');
    console.log('\nIf you\'re still getting the HTML error in the frontend:');
    console.log('1. Make sure the web app is running on http://localhost:3000');
    console.log('2. Check browser developer tools for network errors');
    console.log('3. Try clearing browser cache and hard refresh (Ctrl+Shift+R)');
    console.log('4. Verify the web app proxy is working by checking Network tab in DevTools');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testReminderAPI();