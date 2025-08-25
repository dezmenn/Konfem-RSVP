// Test script to verify guest messaging functionality
const http = require('http');

console.log('💬 Testing Guest Messaging Functionality...\n');

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
          if (jsonData.data && jsonData.data.id) {
            console.log(`   Message ID: ${jsonData.data.id}`);
            console.log(`   Message Type: ${jsonData.data.messageType}`);
            console.log(`   Delivery Status: ${jsonData.data.deliveryStatus}`);
          }
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
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

// Test guest messaging functionality
async function testGuestMessaging() {
  try {
    console.log('💬 Testing Guest Messaging Functionality\\n');
    
    // Step 1: Get guest list to find a test guest
    console.log('🔹 Step 1: Get guest list to find a test guest');
    const guestsResponse = await testAPI('GET', '/api/guests/demo-event-1', null, 'Get Guest List');
    
    if (!guestsResponse.success || !guestsResponse.data.data.length) {
      console.log('❌ No guests found for testing');
      return;
    }
    
    const testGuest = guestsResponse.data.data[0];
    console.log(`   Selected test guest: ${testGuest.name} (${testGuest.id})`);
    console.log(`   Phone: ${testGuest.phoneNumber}`);
    console.log(`   RSVP Status: ${testGuest.rsvpStatus}`);
    
    // Step 2: Test sending a reminder message (like frontend does)
    console.log('🔹 Step 2: Test sending reminder message');
    const reminderPayload = {
      eventId: 'demo-event-1',
      content: 'Hi! This is a test reminder message from the admin dashboard. Please confirm your attendance for our upcoming event. Thank you!'
    };
    
    const reminderResult = await testAPI(
      'POST', 
      `/api/messaging/guests/${testGuest.id}/reminder`, 
      reminderPayload, 
      'Send Reminder Message'
    );
    
    // Step 3: Test sending an invitation message
    console.log('🔹 Step 3: Test sending invitation message');
    const invitationPayload = {
      eventId: 'demo-event-1'
    };
    
    const invitationResult = await testAPI(
      'POST', 
      `/api/messaging/guests/${testGuest.id}/invitation`, 
      invitationPayload, 
      'Send Invitation Message'
    );
    
    // Step 4: Test with different guest types (regular vs public)
    console.log('🔹 Step 4: Test messaging with different guest types');
    
    const regularGuest = guestsResponse.data.data.find(g => !g.isPublicRegistration);
    const publicGuest = guestsResponse.data.data.find(g => g.isPublicRegistration);
    
    if (regularGuest) {
      console.log(`   Testing regular guest: ${regularGuest.name} (${regularGuest.id})`);
      const regularReminderResult = await testAPI(
        'POST', 
        `/api/messaging/guests/${regularGuest.id}/reminder`, 
        { eventId: 'demo-event-1', content: 'Test message to regular guest' }, 
        'Send Message to Regular Guest'
      );
    }
    
    if (publicGuest) {
      console.log(`   Testing public guest: ${publicGuest.name} (${publicGuest.id})`);
      const publicReminderResult = await testAPI(
        'POST', 
        `/api/messaging/guests/${publicGuest.id}/reminder`, 
        { eventId: 'demo-event-1', content: 'Test message to public guest' }, 
        'Send Message to Public Guest'
      );
    }
    
    // Step 5: Check WhatsApp service statistics
    console.log('🔹 Step 5: Check WhatsApp service statistics');
    const statsResult = await testAPI('GET', '/api/whatsapp-admin/stats', null, 'Get WhatsApp Stats');
    
    if (statsResult.success && statsResult.data.data) {
      const stats = statsResult.data.data;
      console.log(`   📊 Total sent: ${stats.messageStats.totalSent}`);
      console.log(`   📊 Total delivered: ${stats.messageStats.totalDelivered}`);
      console.log(`   📊 Delivery rate: ${stats.messageStats.deliveryRate}%`);
    }
    
    console.log('\\n📊 Guest Messaging Test Results:');
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
    
    console.log('');
    console.log(`🎯 SUCCESS RATE: ${successCount}/2 core messaging tests passed`);
    
    if (successCount >= 1) {
      console.log('');
      console.log('✅ MESSAGING BACKEND: Working');
      console.log('');
      console.log('🔍 FRONTEND DEBUGGING STEPS:');
      console.log('   If the "Send Message" button is not clickable:');
      console.log('');
      console.log('   1. CHECK BROWSER CONSOLE:');
      console.log('      • Open Developer Tools (F12)');
      console.log('      • Go to Console tab');
      console.log('      • Look for JavaScript errors');
      console.log('');
      console.log('   2. CHECK BUTTON ELEMENT:');
      console.log('      • Right-click on "Send Message" button');
      console.log('      • Select "Inspect Element"');
      console.log('      • Check if button has disabled attribute');
      console.log('      • Check if CSS is hiding/blocking the button');
      console.log('');
      console.log('   3. CHECK EVENT HANDLERS:');
      console.log('      • In Console, type: document.querySelector(".btn-message")');
      console.log('      • Check if button element exists');
      console.log('      • Check if onClick handler is attached');
      console.log('');
      console.log('   4. TEST BUTTON MANUALLY:');
      console.log('      • In Console, try clicking programmatically:');
      console.log('      • document.querySelector(".btn-message").click()');
      console.log('');
      console.log('   5. CHECK REACT STATE:');
      console.log('      • Look for state issues in React DevTools');
      console.log('      • Check if component is in loading state');
      console.log('      • Check if modal state is blocking interactions');
    } else {
      console.log('');
      console.log('❌ MESSAGING BACKEND: Failed');
      console.log('   Backend messaging is not working');
      console.log('   Fix backend issues first before debugging frontend');
    }
    
    console.log('');
    console.log('📱 QUICK FRONTEND TEST:');
    console.log('   1. Go to: http://localhost:3000/admin');
    console.log('   2. Look for green "Send Message" buttons in guest list');
    console.log('   3. Try clicking on one');
    console.log('   4. Should open messaging modal');
    console.log('   5. If not working, follow debugging steps above');
    
  } catch (error) {
    console.log('❌ Guest messaging test failed:', error.message);
  }
}

testGuestMessaging();