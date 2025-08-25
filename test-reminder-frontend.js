const fetch = require('node-fetch');

async function testReminderFrontend() {
  const eventId = 'demo-event-1';
  
  console.log('=== Testing Reminder Frontend Integration ===\n');
  
  try {
    // 1. Check WhatsApp messages before sending reminders
    console.log('1. Checking WhatsApp messages before sending reminders...');
    const beforeResponse = await fetch('http://localhost:5000/api/whatsapp-admin/messages');
    const beforeData = await beforeResponse.json();
    console.log(`Messages before: ${beforeData.total} messages`);
    
    // Show last few messages
    if (beforeData.data && beforeData.data.length > 0) {
      console.log('Last 3 messages:');
      beforeData.data.slice(-3).forEach((msg, index) => {
        console.log(`  ${index + 1}. To: ${msg.to}, Type: ${msg.messageType || 'unknown'}, Status: ${msg.deliveryStatus || 'unknown'}`);
      });
    }
    
    // 2. Send reminders
    console.log('\n2. Sending reminders...');
    const executeResponse = await fetch(`http://localhost:5000/api/reminders/execute-all/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const executeData = await executeResponse.json();
    console.log('Execute result:', JSON.stringify(executeData, null, 2));
    
    // 3. Check WhatsApp messages after sending reminders
    console.log('\n3. Checking WhatsApp messages after sending reminders...');
    const afterResponse = await fetch('http://localhost:5000/api/whatsapp-admin/messages');
    const afterData = await afterResponse.json();
    console.log(`Messages after: ${afterData.total} messages`);
    
    // Show new messages
    if (afterData.data && afterData.data.length > beforeData.total) {
      console.log('New messages:');
      const newMessages = afterData.data.slice(beforeData.total);
      newMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. To: ${msg.to}, Content: ${msg.content.substring(0, 50)}...`);
      });
    }
    
    // 4. Check WhatsApp stats
    console.log('\n4. Checking WhatsApp stats...');
    const statsResponse = await fetch('http://localhost:5000/api/whatsapp-admin/stats');
    const statsData = await statsResponse.json();
    console.log('WhatsApp stats:', JSON.stringify(statsData.data.messageStats, null, 2));
    
    // 5. Check delivery statuses
    console.log('\n5. Checking delivery statuses...');
    const deliveryResponse = await fetch('http://localhost:5000/api/whatsapp-admin/delivery-status');
    const deliveryData = await deliveryResponse.json();
    console.log(`Total delivery statuses: ${deliveryData.total}`);
    
    if (deliveryData.data && deliveryData.data.length > 0) {
      console.log('Recent delivery statuses:');
      deliveryData.data.slice(-5).forEach((status, index) => {
        console.log(`  ${index + 1}. Message: ${status.messageId}, Status: ${status.status}, Error: ${status.error || 'none'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReminderFrontend();