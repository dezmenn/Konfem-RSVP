const fetch = require('node-fetch');

async function debugReminderIssue() {
  const eventId = 'demo-event-1';
  
  console.log('=== Debugging Reminder Issue ===\n');
  
  try {
    // 1. Check reminder status
    console.log('1. Checking reminder status...');
    const statusResponse = await fetch(`http://localhost:5000/api/reminders/status/${eventId}`);
    const statusData = await statusResponse.json();
    console.log('Status:', JSON.stringify(statusData, null, 2));
    
    // 2. Check guests data
    console.log('\n2. Checking guests data...');
    const guestsResponse = await fetch(`http://localhost:5000/api/guests/${eventId}`);
    const guestsData = await guestsResponse.json();
    console.log('Total guests:', guestsData.data?.length || 0);
    
    // Filter pending guests
    const pendingGuests = guestsData.data?.filter(guest => 
      guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response'
    ) || [];
    
    console.log('Pending guests:', pendingGuests.length);
    console.log('Pending guest details:');
    pendingGuests.forEach(guest => {
      console.log(`  - ${guest.name}: ${guest.rsvpStatus} (phone: ${guest.phoneNumber})`);
    });
    
    // 3. Check reminder schedules
    console.log('\n3. Checking reminder schedules...');
    const schedulesResponse = await fetch(`http://localhost:5000/api/reminders/event/${eventId}`);
    const schedulesData = await schedulesResponse.json();
    console.log('Schedules:', JSON.stringify(schedulesData, null, 2));
    
    // 4. Try to execute reminders and see what happens
    console.log('\n4. Attempting to execute reminders...');
    const executeResponse = await fetch(`http://localhost:5000/api/reminders/execute-all/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const executeData = await executeResponse.json();
    console.log('Execute result:', JSON.stringify(executeData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugReminderIssue();