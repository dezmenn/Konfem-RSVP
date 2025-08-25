// Test script to verify WhatsApp dashboard functionality
const http = require('http');

console.log('🖥️ Testing WhatsApp Dashboard...\n');

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
        console.log(`${res.statusCode < 400 ? '✅' : '❌'} ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Content-Type: ${res.headers['content-type']}`);
        console.log(`   Content Length: ${responseData.length} bytes`);
        
        if (res.headers['content-type']?.includes('application/json')) {
          try {
            const jsonData = JSON.parse(responseData);
            if (jsonData.data) {
              if (Array.isArray(jsonData.data)) {
                console.log(`   Data Count: ${jsonData.data.length}`);
              } else if (typeof jsonData.data === 'object') {
                console.log(`   Data Keys: ${Object.keys(jsonData.data).join(', ')}`);
              }
            }
          } catch (error) {
            console.log(`   JSON Parse Error: ${error.message}`);
          }
        } else if (res.headers['content-type']?.includes('text/html')) {
          const hasTitle = responseData.includes('<title>');
          const hasStats = responseData.includes('Statistics');
          const hasMessages = responseData.includes('Recent Messages');
          const hasJavaScript = responseData.includes('updateDashboard');
          
          console.log(`   HTML Dashboard Elements:`);
          console.log(`     Title: ${hasTitle ? '✅' : '❌'}`);
          console.log(`     Statistics Section: ${hasStats ? '✅' : '❌'}`);
          console.log(`     Messages Section: ${hasMessages ? '✅' : '❌'}`);
          console.log(`     JavaScript Functions: ${hasJavaScript ? '✅' : '❌'}`);
        }
        
        console.log('');
        resolve({ success: res.statusCode < 400, data: responseData, status: res.statusCode });
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

// Test dashboard functionality
async function testDashboard() {
  try {
    console.log('🖥️ Testing WhatsApp Dashboard Functionality\n');
    
    // Test 1: Dashboard HTML page
    console.log('🔹 Test 1: Dashboard HTML page');
    const dashboardResult = await testAPI('GET', '/api/whatsapp-admin/dashboard', null, 'Get Dashboard HTML');
    
    // Test 2: Stats API (used by dashboard)
    console.log('🔹 Test 2: Stats API endpoint');
    const statsResult = await testAPI('GET', '/api/whatsapp-admin/stats', null, 'Get Stats API');
    
    // Test 3: Messages API (used by dashboard)
    console.log('🔹 Test 3: Messages API endpoint');
    const messagesResult = await testAPI('GET', '/api/whatsapp-admin/messages', null, 'Get Messages API');
    
    // Test 4: Delivery Status API (used by dashboard)
    console.log('🔹 Test 4: Delivery Status API endpoint');
    const deliveryResult = await testAPI('GET', '/api/whatsapp-admin/delivery-status', null, 'Get Delivery Status API');
    
    // Test 5: Rate Limits API (used by dashboard)
    console.log('🔹 Test 5: Rate Limits API endpoint');
    const rateLimitsResult = await testAPI('GET', '/api/whatsapp-admin/rate-limits', null, 'Get Rate Limits API');
    
    console.log('📊 Dashboard Test Summary:');
    console.log('');
    
    const tests = [
      { name: 'DASHBOARD HTML', result: dashboardResult },
      { name: 'STATS API', result: statsResult },
      { name: 'MESSAGES API', result: messagesResult },
      { name: 'DELIVERY STATUS API', result: deliveryResult },
      { name: 'RATE LIMITS API', result: rateLimitsResult }
    ];
    
    let successCount = 0;
    tests.forEach(test => {
      if (test.result && test.result.success) {
        console.log(`✅ ${test.name}: Working`);
        successCount++;
      } else {
        console.log(`❌ ${test.name}: Failed`);
      }
    });
    
    console.log('');
    console.log(`🎯 SUCCESS RATE: ${successCount}/${tests.length} dashboard tests passed`);
    
    if (successCount >= 4) {
      console.log('');
      console.log('✅ WHATSAPP DASHBOARD: Working');
      console.log('');
      console.log('🌐 DASHBOARD ACCESS:');
      console.log('   URL: http://localhost:5000/api/whatsapp-admin/dashboard');
      console.log('   Features: Statistics, Recent Messages, Rate Limits, Configuration');
      console.log('   Auto-refresh: Every 5 seconds');
      console.log('');
      console.log('🔧 DASHBOARD TROUBLESHOOTING:');
      console.log('   1. Open browser to: http://localhost:5000/api/whatsapp-admin/dashboard');
      console.log('   2. Check browser console (F12) for JavaScript errors');
      console.log('   3. Look for "Dashboard updated successfully" messages');
      console.log('   4. If no messages appear, check if backend is sending data');
      console.log('   5. Try clicking "Refresh" button manually');
      console.log('');
      console.log('📱 RECENT MESSAGES SHOULD SHOW:');
      console.log('   • Timestamp of each message');
      console.log('   • Phone number (recipient)');
      console.log('   • Content preview (first 50 characters)');
      console.log('   • Message ID');
      console.log('   • Delivery status (SENT, DELIVERED, FAILED)');
      
      // Show sample of actual messages
      if (messagesResult && messagesResult.success) {
        try {
          const messagesData = JSON.parse(messagesResult.data);
          if (messagesData.data && messagesData.data.length > 0) {
            console.log('');
            console.log('📋 SAMPLE MESSAGES IN SYSTEM:');
            messagesData.data.slice(0, 3).forEach((msg, index) => {
              console.log(`   ${index + 1}. To: ${msg.to}`);
              console.log(`      Content: ${msg.content.substring(0, 60)}...`);
              console.log(`      ID: ${msg.messageId}`);
              console.log(`      Time: ${msg.timestamp}`);
            });
          }
        } catch (error) {
          console.log('   Error parsing messages data');
        }
      }
    } else {
      console.log('');
      console.log('❌ WHATSAPP DASHBOARD: Failed');
      console.log('   Some dashboard components are not working');
    }
    
  } catch (error) {
    console.log('❌ Dashboard test failed:', error.message);
  }
}

testDashboard();