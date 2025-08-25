async function testSimplePost() {
  console.log('🔍 Testing Simple POST Request...\n');
  
  // Dynamic import for node-fetch
  const { default: fetch } = await import('node-fetch');
  
  try {
    console.log('Testing POST /api/invitations/configure...');
    
    const response = await fetch('http://localhost:5000/api/invitations/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: 'demo-event-1',
        schedules: [{
          triggerDays: 0,
          messageTemplate: 'Test message',
          isActive: true
        }]
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText.substring(0, 200));
    
    if (responseText.includes('<!DOCTYPE')) {
      console.log('\n❌ Receiving HTML error page instead of JSON');
      console.log('This means the POST route is not registered in the server');
    } else {
      console.log('\n✅ Receiving proper response');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testSimplePost().catch(console.error);