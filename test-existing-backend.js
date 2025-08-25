async function testExistingBackend() {
  console.log('🔍 Testing Existing Backend on Port 5000...\n');
  
  // Dynamic import for node-fetch
  const { default: fetch } = await import('node-fetch');
  
  // Test if backend is running
  try {
    const healthResponse = await fetch('http://localhost:5000/health');
    if (!healthResponse.ok) {
      console.log('❌ Backend is not responding on port 5000');
      console.log('   Please make sure you have started the backend with: npm run dev');
      return;
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend is running:', healthData.status);
  } catch (error) {
    console.log('❌ Cannot connect to backend on port 5000');
    console.log('   Please make sure you have started the backend with: npm run dev');
    return;
  }
  
  // Test various endpoints to see what's available
  console.log('\n🔍 Testing available endpoints...');
  
  const endpoints = [
    { path: '/api', description: 'API Root' },
    { path: '/api/guests/event/demo-event-1', description: 'Guests API' },
    { path: '/api/invitations/event/demo-event-1', description: 'Invitations Schedules' },
    { path: '/api/invitations/status/demo-event-1', description: 'Invitations Status' },
    { path: '/api/reminders/event/demo-event-1', description: 'Reminders API' },
    { path: '/api/tables/event/demo-event-1', description: 'Tables API' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n${endpoint.description}: http://localhost:5000${endpoint.path}`);
      const response = await fetch(`http://localhost:5000${endpoint.path}`);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            console.log(`  ✅ Success: ${data.data.length} items returned`);
          } else if (data.message) {
            console.log(`  ✅ Success: ${data.message}`);
          } else {
            console.log(`  ✅ Success: Valid JSON response`);
          }
        } catch (e) {
          const text = await response.text();
          console.log(`  ✅ Success: ${text.substring(0, 50)}...`);
        }
      } else {
        const errorText = await response.text();
        if (errorText.includes('Cannot GET')) {
          console.log(`  ❌ Route not found (404)`);
        } else {
          console.log(`  ❌ Error: ${errorText.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}`);
    }
  }
  
  // Check if the issue is with route loading
  console.log('\n🔍 Diagnosing route loading issues...');
  
  // Test if any API routes work
  const workingRoutes = [];
  const failingRoutes = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint.path}`);
      if (response.status !== 404) {
        workingRoutes.push(endpoint.path);
      } else {
        failingRoutes.push(endpoint.path);
      }
    } catch (error) {
      failingRoutes.push(endpoint.path);
    }
  }
  
  console.log('\n📊 Route Status Summary:');
  console.log(`  ✅ Working routes: ${workingRoutes.length}`);
  workingRoutes.forEach(route => console.log(`    - ${route}`));
  
  console.log(`  ❌ Failing routes: ${failingRoutes.length}`);
  failingRoutes.forEach(route => console.log(`    - ${route}`));
  
  // Provide diagnosis
  console.log('\n🔧 Diagnosis:');
  if (failingRoutes.length === endpoints.length - 1) { // Only /api works
    console.log('  ❌ All API routes are failing (404 errors)');
    console.log('  📋 Possible causes:');
    console.log('    1. Routes are not being imported properly in server.ts');
    console.log('    2. There\'s an error during route initialization');
    console.log('    3. The server started but route setup failed');
    console.log('  🔧 Solutions:');
    console.log('    1. Check the backend terminal for error messages');
    console.log('    2. Restart the backend server');
    console.log('    3. Check if SKIP_DB_SETUP=true is set in environment');
  } else if (failingRoutes.includes('/api/invitations/event/demo-event-1')) {
    console.log('  ❌ Invitation routes specifically are failing');
    console.log('  📋 This suggests the invitation routes module has an issue');
    console.log('  🔧 Check the invitation routes file for syntax errors');
  } else {
    console.log('  ✅ Some routes are working, this is a partial failure');
  }
  
  // Test creating an invitation schedule if routes work
  if (workingRoutes.includes('/api/invitations/event/demo-event-1')) {
    console.log('\n🧪 Testing invitation functionality...');
    try {
      const createResponse = await fetch('http://localhost:5000/api/invitations/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: 'demo-event-1',
          schedules: [{
            triggerDays: 0,
            messageTemplate: 'Test invitation for {{guestName}}',
            isActive: true
          }]
        })
      });
      
      if (createResponse.ok) {
        console.log('  ✅ Invitation creation works');
      } else {
        console.log('  ❌ Invitation creation failed:', createResponse.status);
      }
    } catch (error) {
      console.log('  ❌ Error testing invitation creation:', error.message);
    }
  }
  
  console.log('\n🏁 Test completed');
}

testExistingBackend().catch(error => {
  console.error('Test failed:', error);
});