// Script to send a test message and verify dashboard updates
const http = require('http');

console.log('📱 Sending test message to WhatsApp Mock Service...\n');

const testMessage = {
  to: '+1555123456',
  content: 'Test message from dashboard verification script - ' + new Date().toLocaleTimeString(),
  messageId: 'test-msg-' + Date.now()
};

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/demo/send-message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(`✅ Message sent successfully!`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${response.success}`);
      console.log(`   Message: ${response.message}`);
      console.log(`   To: ${testMessage.to}`);
      console.log(`   Content: ${testMessage.content}`);
      console.log(`   Message ID: ${testMessage.messageId}`);
      console.log('');
      console.log('🔄 Now check the dashboard to see if the new message appears:');
      console.log('   http://localhost:5000/api/whatsapp-admin/dashboard');
      console.log('');
      console.log('📊 The dashboard should auto-refresh every 5 seconds and show:');
      console.log('   - Updated message count in statistics');
      console.log('   - New message in the Recent Messages table');
      console.log('   - Updated delivery status');
    } catch (error) {
      console.log(`❌ Error parsing response:`, error.message);
      console.log(`   Raw response: ${data}`);
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ Request error:`, error.message);
});

req.write(postData);
req.end();