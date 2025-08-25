const { spawn } = require('child_process');

// Dynamic import for node-fetch
let fetch;
(async () => {
  const fetchModule = await import('node-fetch');
  fetch = fetchModule.default;
})();

async function testBackendStartup() {
  console.log('🚀 Starting backend server for invitation management test...\n');
  
  // Set environment variables for demo mode
  process.env.SKIP_DB_SETUP = 'true';
  process.env.NODE_ENV = 'development';
  
  // Start the backend server
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
  
  backend.on('error', (error) => {
    console.error('Failed to start backend:', error);
    serverError = error;
  });
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds
  
  while (!serverReady && !serverError && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    // Try to ping the server
    try {
      const response = await fetch('http://localhost:5000/health', { timeout: 1000 });
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
    console.log('❌ Server did not start within 30 seconds');
    backend.kill();
    return;
  }
  
  // Test invitation endpoints
  console.log('\n🔍 Testing invitation endpoints...');
  
  try {
    // Test invitation schedules
    const schedulesResponse = await fetch('http://localhost:5000/api/invitations/event/demo-event-1');
    console.log('Schedules endpoint status:', schedulesResponse.status);
    
    if (schedulesResponse.ok) {
      const schedulesData = await schedulesResponse.json();
      console.log('✅ Schedules loaded:', schedulesData);
    } else {
      const errorText = await schedulesResponse.text();
      console.log('❌ Schedules error:', errorText);
    }
    
    // Test invitation status
    const statusResponse = await fetch('http://localhost:5000/api/invitations/status/demo-event-1');
    console.log('Status endpoint status:', statusResponse.status);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Status loaded:', statusData);
    } else {
      const errorText = await statusResponse.text();
      console.log('❌ Status error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
  
  // Keep server running for manual testing
  console.log('\n✅ Backend is running. Press Ctrl+C to stop.');
  console.log('   You can now test the invitation management in the web app.');
  console.log('   Server will be stopped automatically in 60 seconds...');
  
  // Auto-stop after 60 seconds
  setTimeout(() => {
    console.log('\n⏹️ Stopping backend server...');
    backend.kill();
    process.exit(0);
  }, 60000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️ Stopping backend server...');
    backend.kill();
    process.exit(0);
  });
}

testBackendStartup().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});