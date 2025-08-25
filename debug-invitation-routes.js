async function debugInvitationRoutes() {
  console.log('🔍 Debugging Invitation Routes...\n');
  
  // Dynamic import for node-fetch
  const { default: fetch } = await import('node-fetch');
  
  const eventId = 'demo-event-1';
  
  // Test all invitation endpoints
  const endpoints = [
    { method: 'GET', url: `/api/invitations/event/${eventId}`, description: 'Get Schedules' },
    { method: 'GET', url: `/api/invitations/status/${eventId}`, description: 'Get Status' },
    { method: 'POST', url: '/api/invitations/configure', description: 'Create Schedule', body: { eventId, schedules: [{ triggerDays: 0, messageTemplate: 'Test', isActive: true }] } },
    { method: 'POST', url: `/api/invitations/bulk-invite/${eventId}`, description: 'Bulk Invite' },
    { method: 'DELETE', url: '/api/invitations/schedule/test-id', description: 'Delete Schedule' },
    { method: 'POST', url: '/api/invitations/schedule/test-id/toggle', description: 'Toggle Schedule', body: { isActive: true } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.method} ${endpoint.url} (${endpoint.description})`);
      
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`http://localhost:5000${endpoint.url}`, options);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`  ✅ Success: ${data.message || 'Valid JSON response'}`);
        } catch (e) {
          console.log(`  ✅ Success: Valid response`);
        }
      } else {
        const errorText = await response.text();
        if (errorText.includes('<!DOCTYPE')) {
          console.log(`  ❌ HTML Error Page (404/500) - Route not found or server error`);
        } else {
          console.log(`  ❌ Error: ${errorText.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🔧 Diagnosis:');
  console.log('If you see "HTML Error Page" or "Cannot POST/DELETE" errors,');
  console.log('it means the backend server needs to be restarted to load the updated routes.');
  console.log('');
  console.log('📋 Solution:');
  console.log('1. Stop your backend server (Ctrl+C)');
  console.log('2. Restart it with: npm run dev');
  console.log('3. Wait for "Server running on port 5000" message');
  console.log('4. Then test the invitation management again');
}

debugInvitationRoutes().catch(error => {
  console.error('Debug failed:', error);
});