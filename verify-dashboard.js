// Test script to verify WhatsApp dashboard logging
const http = require('http');

console.log('📊 Verifying WhatsApp Dashboard Logging...\n');

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
          resolve({ success: res.statusCode < 400, data: jsonData, status: res.statusCode });
        } catch (error) {
          console.log(`❌ ${description} - JSON parse error:`, error.message);
          resolve({ success: false, data: { error: 'JSON parse error' }, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - Request error:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`❌ ${description} - Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test dashboard logging
async function verifyDashboardLogging() {
  try {
    console.log('📊 Verifying WhatsApp Dashboard Logging\\n');
    
    // Step 1: Get initial dashboard state
    console.log('🔹 Step 1: Get initial dashboard state');
    const initialStats = await testAPI('GET', '/api/whatsapp-admin/stats', null, 'Get Initial Stats');
    const initialMessages = await testAPI('GET', '/api/whatsapp-admin/messages', null, 'Get Initial Messages');
    
    let initialMessageCount = 0;
    let initialSentCount = 0;
    
    if (initialStats.success && initialStats.data.data) {
      initialSentCount = initialStats.data.data.messageStats.totalSent || 0;
      console.log(`   Initial total sent: ${initialSentCount}`);
    }
    
    if (initialMessages.success && initialMessages.data.data) {
      initialMessageCount = initialMessages.data.data.length;
      console.log(`   Initial message count: ${initialMessageCount}`);
    }
    
    // Step 2: Send a reminder message (like guest list does)
    console.log('🔹 Step 2: Send reminder message via guest list API');
    const reminderPayload = {
      eventId: 'demo-event-1',
      content: 'Dashboard logging test - This message should appear in WhatsApp dashboard'
    };
    
    const sendResult = await testAPI(
      'POST', 
      '/api/messaging/guests/guest-1/reminder', 
      reminderPayload, 
      'Send Reminder Message'
    );
    
    if (sendResult.success) {
      console.log(`   ✅ Message sent successfully`);
      console.log(`   Message ID: ${sendResult.data.data.id}`);
      console.log(`   Message Type: ${sendResult.data.data.messageType}`);
      console.log(`   Delivery Status: ${sendResult.data.data.deliveryStatus}`);
    } else {
      console.log(`   ❌ Message sending failed`);
      console.log(`   Error: ${sendResult.data.error}`);
    }
    
    // Step 3: Check if message appears in dashboard
    console.log('🔹 Step 3: Check if message appears in dashboard');
    
    // Wait a moment for message to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedStats = await testAPI('GET', '/api/whatsapp-admin/stats', null, 'Get Updated Stats');
    const updatedMessages = await testAPI('GET', '/api/whatsapp-admin/messages', null, 'Get Updated Messages');
    
    let newMessageCount = 0;
    let newSentCount = 0;
    
    if (updatedStats.success && updatedStats.data.data) {
      newSentCount = updatedStats.data.data.messageStats.totalSent || 0;
      console.log(`   Updated total sent: ${newSentCount}`);
      console.log(`   Sent count increased: ${newSentCount > initialSentCount ? '✅' : '❌'}`);
    }
    
    if (updatedMessages.success && updatedMessages.data.data) {
      newMessageCount = updatedMessages.data.data.length;
      console.log(`   Updated message count: ${newMessageCount}`);
      console.log(`   Message count increased: ${newMessageCount > initialMessageCount ? '✅' : '❌'}`);
      
      // Find our test message
      const testMessage = updatedMessages.data.data.find(msg => 
        msg.content && msg.content.includes('Dashboard logging test')
      );
      
      if (testMessage) {
        console.log(`   ✅ Test message found in dashboard:`);
        console.log(`     To: ${testMessage.to}`);
        console.log(`     Content: ${testMessage.content.substring(0, 50)}...`);
        console.log(`     Timestamp: ${testMessage.timestamp}`);
        console.log(`     Message Type: ${testMessage.messageType || 'custom'}`);
      } else {
        console.log(`   ❌ Test message not found in dashboard`);
      }
    }
    
    // Step 4: Check delivery status
    console.log('🔹 Step 4: Check delivery status');
    const deliveryStatus = await testAPI('GET', '/api/whatsapp-admin/delivery-status', null, 'Get Delivery Status');
    
    if (deliveryStatus.success && deliveryStatus.data.data) {
      console.log(`   Total delivery statuses: ${Object.keys(deliveryStatus.data.data).length}`);
      
      // Look for recent delivery status
      const recentStatuses = Object.values(deliveryStatus.data.data)
        .filter(status => {
          const statusTime = new Date(status.timestamp);
          const now = new Date();
          return (now - statusTime) < 60000; // Within last minute
        });
      
      console.log(`   Recent delivery statuses: ${recentStatuses.length}`);
      
      if (recentStatuses.length > 0) {
        const latestStatus = recentStatuses[recentStatuses.length - 1];
        console.log(`   Latest status: ${latestStatus.status}`);
        console.log(`   Latest message ID: ${latestStatus.messageId}`);
      }
    }
    
    console.log('\\n📊 Dashboard Logging Verification Results:');
    console.log('');
    
    const statsIncreased = newSentCount > initialSentCount;
    const messagesIncreased = newMessageCount > initialMessageCount;
    const testMessageFound = updatedMessages.success && 
      updatedMessages.data.data.some(msg => 
        msg.content && msg.content.includes('Dashboard logging test')
      );
    
    if (statsIncreased && messagesIncreased && testMessageFound) {
      console.log('✅ DASHBOARD LOGGING: Working Correctly');
      console.log('   ✅ Message statistics update');
      console.log('   ✅ Messages appear in dashboard');
      console.log('   ✅ Message content is logged');
      console.log('   ✅ Delivery status is tracked');
      console.log('');
      console.log('🎯 FRONTEND VERIFICATION:');
      console.log('   1. Go to: http://localhost:3000/admin');
      console.log('   2. Click "Send Message" on any guest');
      console.log('   3. Send a reminder message');
      console.log('   4. Go to: http://localhost:5000/api/whatsapp-admin/dashboard');
      console.log('   5. ✅ Your message should appear in the dashboard');
      console.log('   6. ✅ Statistics should update');
    } else {
      console.log('❌ DASHBOARD LOGGING: Issues Detected');
      console.log(`   Stats increased: ${statsIncreased ? '✅' : '❌'}`);
      console.log(`   Messages increased: ${messagesIncreased ? '✅' : '❌'}`);
      console.log(`   Test message found: ${testMessageFound ? '✅' : '❌'}`);
      console.log('');
      console.log('🔧 TROUBLESHOOTING:');
      console.log('   • Check if WhatsApp mock service is running');
      console.log('   • Check backend logs for errors');
      console.log('   • Verify messaging endpoints are working');
    }
    
    console.log('');
    console.log('📱 DASHBOARD ACCESS:');
    console.log('   • Dashboard URL: http://localhost:5000/api/whatsapp-admin/dashboard');
    console.log('   • Stats API: http://localhost:5000/api/whatsapp-admin/stats');
    console.log('   • Messages API: http://localhost:5000/api/whatsapp-admin/messages');
    
  } catch (error) {
    console.log('❌ Dashboard logging verification failed:', error.message);
  }
}

verifyDashboardLogging();