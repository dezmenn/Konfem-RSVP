// Direct test script for WhatsApp messaging functionality
const http = require('http');

console.log('📱 Testing WhatsApp Messaging (Direct)...\n');

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
          if (jsonData.data && jsonData.data.id) {
            console.log(`   Message ID: ${jsonData.data.id}`);
          }
          console.log('');
          resolve({ success: res.statusCode < 400, data: jsonData, status: res.statusCode });
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

// Run direct messaging test
async function runDirectMessagingTest() {
  try {
    console.log('📱 Testing WhatsApp Messaging (Direct)\\n');
    
    // Test 1: Test reminder message with known guest ID
    console.log('🔹 Test 1: Send reminder message to guest-1');
    const reminderPayload = {
      eventId: 'demo-event-1',
      content: 'Hi! This is a test reminder message from the admin dashboard. Please confirm your attendance for our upcoming event. Thank you!'
    };
    
    const reminderResult = await testAPI(
      'POST', 
      '/api/messaging/guests/guest-1/reminder', 
      reminderPayload, 
      'Send Reminder Message to guest-1'
    );
    
    // Test 2: Test invitation message
    console.log('🔹 Test 2: Send invitation message to guest-1');
    const invitationPayload = {
      eventId: 'demo-event-1'
    };
    
    const invitationResult = await testAPI(
      'POST', 
      '/api/messaging/guests/guest-1/invitation', 
      invitationPayload, 
      'Send Invitation Message to guest-1'
    );
    
    // Test 3: Test with a different guest
    console.log('🔹 Test 3: Send reminder to guest-2');
    const reminder2Payload = {
      eventId: 'demo-event-1',
      content: 'Hello! Just a friendly reminder about our event. Looking forward to seeing you there!'
    };
    
    const reminder2Result = await testAPI(
      'POST', 
      '/api/messaging/guests/guest-2/reminder', 
      reminder2Payload, 
      'Send Reminder Message to guest-2'
    );
    
    // Test 4: Check WhatsApp admin stats
    console.log('🔹 Test 4: Check WhatsApp service statistics');
    const statsResult = await testAPI(
      'GET', 
      '/api/whatsapp-admin/stats', 
      null, 
      'Get WhatsApp Service Stats'
    );
    
    if (statsResult && statsResult.success && statsResult.data.data) {
      const stats = statsResult.data.data;
      console.log(`   📊 Total sent: ${stats.messageStats.totalSent}`);
      console.log(`   📊 Total delivered: ${stats.messageStats.totalDelivered}`);
      console.log(`   📊 Delivery rate: ${stats.messageStats.deliveryRate}%`);
    }
    
    console.log('\\n📊 Direct Messaging Test Results:');
    console.log('');
    
    let successCount = 0;
    if (reminderResult && reminderResult.success) {
      console.log('✅ REMINDER MESSAGING: Working');
      successCount++;
    } else {
      console.log('❌ REMINDER MESSAGING: Failed');
    }
    
    if (invitationResult && invitationResult.success) {
      console.log('✅ INVITATION MESSAGING: Working');
      successCount++;
    } else {
      console.log('❌ INVITATION MESSAGING: Failed');
    }
    
    if (reminder2Result && reminder2Result.success) {
      console.log('✅ MULTI-GUEST MESSAGING: Working');
      successCount++;
    } else {
      console.log('❌ MULTI-GUEST MESSAGING: Failed');
    }
    
    console.log('');
    console.log(`🎯 SUCCESS RATE: ${successCount}/3 tests passed`);
    
    if (successCount >= 2) {
      console.log('');
      console.log('🎉 WHATSAPP MESSAGING IS WORKING!');
      console.log('');
      console.log('🎯 FRONTEND TESTING STEPS:');
      console.log('   1. Go to: http://localhost:3000/admin');
      console.log('   2. Look for the \"Send Message\" button (green) in the guest list');
      console.log('   3. Click \"Send Message\" on any guest');
      console.log('   4. Choose message type: Custom, Invitation, or Reminder');
      console.log('   5. Enter your message content');
      console.log('   6. Click \"Send Message\"');
      console.log('   7. ✅ Message should be sent successfully');
      console.log('');
      console.log('📱 CHECK WHATSAPP DASHBOARD:');
      console.log('   • http://localhost:5000/api/whatsapp-admin/dashboard');
      console.log('   • View all sent messages and delivery status');
      console.log('   • Real-time message statistics');
    } else {
      console.log('');
      console.log('❌ MESSAGING FUNCTIONALITY NEEDS DEBUGGING');
      console.log('   Check the backend server logs for errors');
    }
    
  } catch (error) {
    console.log('❌ Direct messaging test failed:', error.message);
  }
}

runDirectMessagingTest();