const { spawn } = require('child_process');

async function testInvitationManagement() {
  console.log('🔍 Testing Invitation Management...\n');
  
  // Dynamic import for node-fetch
  const { default: fetch } = await import('node-fetch');
  
  // Set environment variables for demo mode
  process.env.SKIP_DB_SETUP = 'true';
  process.env.NODE_ENV = 'development';
  
  // Start the backend server
  console.log('🚀 Starting backend server...');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: './rsvp-backend',
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      SKIP_DB_SETUP: 'true',
      NODE_ENV: 'development'
    }
  });
  
  let serverReady = false;
  let serverError = null;
  
  // Monitor backend output
  backend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server running on port')) {
      serverReady = true;
    }
  });
  
  backend.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('Backend Error:', error.trim());
    serverError = error;
  });
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  let attempts = 0;
  const maxAttempts = 20;
  
  while (!serverReady && !serverError && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    // Try to ping the server
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        serverReady = true;
        console.log('✅ Server is ready!');
        break;
      }
    } catch (error) {
      // Server not ready yet
    }
  }
  
  if (serverError) {
    console.log('❌ Server failed to start');
    backend.kill();
    return;
  }
  
  if (!serverReady) {
    console.log('❌ Server did not start within 20 seconds');
    backend.kill();
    return;
  }
  
  // Test invitation endpoints
  console.log('\n🔍 Testing invitation endpoints...');
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Get invitation schedules
    console.log('1. Testing invitation schedules endpoint...');
    const schedulesResponse = await fetch(`http://localhost:5000/api/invitations/event/${eventId}`);
    console.log('   Status:', schedulesResponse.status);
    
    if (schedulesResponse.ok) {
      const schedulesData = await schedulesResponse.json();
      console.log('   ✅ Schedules loaded successfully');
      console.log('   Schedules count:', schedulesData.data?.length || 0);
    } else {
      const errorText = await schedulesResponse.text();
      console.log('   ❌ Failed to load schedules:', errorText);
    }
    
    // Test 2: Get invitation status
    console.log('\n2. Testing invitation status endpoint...');
    const statusResponse = await fetch(`http://localhost:5000/api/invitations/status/${eventId}`);
    console.log('   Status:', statusResponse.status);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('   ✅ Status loaded successfully');
      console.log('   Total guests:', statusData.data?.totalGuests || 0);
      console.log('   Not invited:', statusData.data?.notInvitedGuests || 0);
      console.log('   Pending:', statusData.data?.pendingGuests || 0);
    } else {
      const errorText = await statusResponse.text();
      console.log('   ❌ Failed to load status:', errorText);
    }
    
    // Test 3: Create a test invitation schedule
    console.log('\n3. Testing create invitation schedule...');
    const createResponse = await fetch('http://localhost:5000/api/invitations/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        schedules: [{
          triggerDays: 0,
          messageTemplate: 'Hi {{guestName}}, you are invited to {{eventTitle}}!',
          isActive: true
        }]
      })
    });
    
    console.log('   Status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('   ✅ Schedule created successfully');
      console.log('   Created schedules:', createData.data?.length || 0);
    } else {
      const errorText = await createResponse.text();
      console.log('   ❌ Failed to create schedule:', errorText);
    }
    
    // Test 4: Get schedules again to verify creation
    console.log('\n4. Verifying schedule creation...');
    const verifyResponse = await fetch(`http://localhost:5000/api/invitations/event/${eventId}`);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('   ✅ Verification successful');
      console.log('   Total schedules now:', verifyData.data?.length || 0);
    } else {
      console.log('   ❌ Verification failed');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
  
  // Stop the server
  console.log('\n⏹️ Stopping backend server...');
  backend.kill();
  
  console.log('\n🏁 Test completed');
  console.log('\nIf all tests passed, the invitation management should work in the web app.');
  console.log('The issue might be that the frontend is not connecting to the backend properly.');
}

testInvitationManagement().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});