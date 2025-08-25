const { spawn } = require('child_process');

async function debugInvitationManagement() {
  console.log('🔍 Debugging Invitation Management 404 Error...\n');
  
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
    console.log('Backend:', output.trim());
    
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
    console.log('❌ Server failed to start:', serverError);
    backend.kill();
    return;
  }
  
  if (!serverReady) {
    console.log('❌ Server did not start within 20 seconds');
    backend.kill();
    return;
  }
  
  // Test various endpoints to see what's available
  console.log('\n🔍 Testing available endpoints...');
  
  const endpoints = [
    '/health',
    '/api',
    '/api/guests/event/demo-event-1',
    '/api/invitations/event/demo-event-1',
    '/api/invitations/status/demo-event-1'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: http://localhost:5000${endpoint}`);
      const response = await fetch(`http://localhost:5000${endpoint}`);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`  ✅ Success:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } catch (e) {
          const text = await response.text();
          console.log(`  ✅ Success (text):`, text.substring(0, 100) + '...');
        }
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error:`, errorText.substring(0, 200) + '...');
      }
    } catch (error) {
      console.log(`  ❌ Network Error:`, error.message);
    }
  }
  
  // Check if invitation routes are loaded
  console.log('\n🔍 Checking if invitation routes are properly loaded...');
  
  // Test a simple POST to see if the route exists
  try {
    const testResponse = await fetch('http://localhost:5000/api/invitations/defaults/demo-event-1', {
      method: 'POST'
    });
    console.log('Invitation routes test status:', testResponse.status);
    
    if (testResponse.status === 404) {
      console.log('❌ Invitation routes are not loaded properly');
      console.log('   This suggests the server.ts file is not importing invitation routes correctly');
    } else {
      console.log('✅ Invitation routes are loaded');
    }
  } catch (error) {
    console.log('❌ Error testing invitation routes:', error.message);
  }
  
  // Keep server running for manual testing
  console.log('\n✅ Backend is running. You can now test manually:');
  console.log('   Health: http://localhost:5000/health');
  console.log('   API: http://localhost:5000/api');
  console.log('   Invitations: http://localhost:5000/api/invitations/event/demo-event-1');
  console.log('\n   Press Ctrl+C to stop the server');
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️ Stopping backend server...');
    backend.kill();
    process.exit(0);
  });
  
  // Keep the process alive
  setInterval(() => {}, 1000);
}

debugInvitationManagement().catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});