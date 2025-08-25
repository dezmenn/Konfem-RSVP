// Simple test script to verify WhatsApp messaging functionality
const http = require('http');

console.log('📱 Testing WhatsApp Messaging (Simple)...\n');

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
      timeout: 5000
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

// Run simple messaging test
async function runSimpleMessagingTest() {
  try {
    console.log('📱 Testing WhatsApp Messaging (Simple)\\n');
    
    // Test 1: Check if server is running
    console.log('🔹 Test 1: Check server status');
    try {
      const healthCheck = await testAPI('GET', '/api/health', null, 'Server Health Check');
    } catch (error) {
      console.log('❌ Server appears to be down. Please start the backend server first.');
      console.log('   Run: cd rsvp-backend && npm run dev');
      return;
    }
    
    // Test 2: Test direct messaging with known guest ID
    console.log('🔹 Test 2: Test messaging with known guest ID');
    const testGuestId = 'guest-1'; // Known guest ID from demo data
    const reminderPayload = {
      eventId: 'demo-event-1',
      content: 'Hi! This is a test message from the admin dashboard. Please confirm your attendance. Thank you!'
    };
    
    const reminderResult = await testAPI(
      'POST', 
      `/api/messaging/guests/${testGuestId}/reminder`, 
      reminderPayload, 
      'Send Test Reminder Message'
    );
    
    // Test 3: Test invitation message
    console.log('🔹 Test 3: Test invitation message');
    const invitationPayload = {
      eventId: 'demo-event-1'
    };
    
    const invitationResult = await testAPI(
      'POST', 
      `/api/messaging/guests/${testGuestId}/invitation`, 
      invitationPayload, 
      'Send Test Invitation Message'
    );
    
    console.log('\\n📊 Simple Messaging Test Results:');
    console.log('');
    if (reminderResult && reminderResult.success) {
      console.log('✅ REMINDER MESSAGING: Working');
    } else {
      console.log('❌ REMINDER MESSAGING: Failed');
    }
    
    if (invitationResult && invitationResult.success) {
      console.log('✅ INVITATION MESSAGING: Working');
    } else {
      console.log('❌ INVITATION MESSAGING: Failed');
    }
    
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('   1. If tests passed: Go to http://localhost:3000/admin');
    console.log('   2. Click \"Send Message\" button on any guest');
    console.log('   3. Test the messaging modal');
    console.log('   4. Check WhatsApp dashboard: http://localhost:5000/api/whatsapp-admin/dashboard');
    
  } catch (error) {
    console.log('❌ Simple messaging test failed:', error.message);
  }
}

runSimpleMessagingTest();