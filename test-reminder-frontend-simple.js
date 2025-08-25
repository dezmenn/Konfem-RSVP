const fetch = require('node-fetch');

async function testReminderFrontendSimple() {
  const eventId = 'demo-event-1';
  
  console.log('=== Testing Reminder Frontend with Full Message Preview ===\n');
  
  try {
    // 1. Send a single reminder to test the full message display
    console.log('1. Sending reminders to test full message preview...');
    const executeResponse = await fetch(`http://localhost:5000/api/reminders/execute-all/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const executeData = await executeResponse.json();
    console.log(`Sent ${executeData.data?.length || 0} reminder schedules`);
    
    // 2. Check WhatsApp messages to see the content
    console.log('\n2. Checking WhatsApp messages...');
    const messagesResponse = await fetch('http://localhost:5000/api/whatsapp-admin/messages');
    const messagesData = await messagesResponse.json();
    console.log(`Total messages: ${messagesData.total}`);
    
    // Show the last few reminder messages
    if (messagesData.data && messagesData.data.length > 0) {
      console.log('\nLast 3 reminder messages:');
      const recentMessages = messagesData.data.slice(-3);
      recentMessages.forEach((msg, index) => {
        console.log(`\n--- Message ${index + 1} ---`);
        console.log(`To: ${msg.to}`);
        console.log(`Message ID: ${msg.messageId}`);
        console.log(`Content Length: ${msg.content.length} characters`);
        console.log(`Content Preview (first 150 chars):`);
        console.log(msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''));
        console.log(`Full content available in dashboard: ${msg.content.length > 100 ? 'YES (expandable)' : 'NO (shown in full)'}`);
      });
    }
    
    console.log('\n3. Dashboard URL for full message preview:');
    console.log('🌐 http://localhost:5000/api/whatsapp-admin/dashboard');
    console.log('\nFeatures:');
    console.log('- Messages longer than 100 characters will show "[Click to expand]"');
    console.log('- Click on the preview to see the full message');
    console.log('- Click "[Click to collapse]" to hide the full message');
    console.log('- Messages shorter than 100 characters are shown in full');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReminderFrontendSimple();