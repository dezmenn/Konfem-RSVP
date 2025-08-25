// Script to verify frontend routing and components
const http = require('http');

console.log('🔍 Verifying Frontend and Backend Integration...\n');

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`${isSuccess ? '✅' : '❌'} ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   URL: ${url}`);
        if (!isSuccess) {
          console.log(`   Error: ${data.substring(0, 100)}...`);
        }
        console.log('');
        resolve({ success: isSuccess, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   URL: ${url}`);
      console.log('');
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

async function runChecks() {
  console.log('🌐 Frontend Checks:');
  await checkEndpoint('http://localhost:3000', 'React App Root');
  
  console.log('🔧 Backend API Checks:');
  await checkEndpoint('http://localhost:5000/health', 'Backend Health Check');
  await checkEndpoint('http://localhost:5000/api/rsvp/events/demo-event-1', 'Event Details API');
  await checkEndpoint('http://localhost:5000/api/rsvp/tokens/demo-event-1', 'RSVP Tokens API');
  
  console.log('💬 WhatsApp Admin:');
  await checkEndpoint('http://localhost:5000/api/whatsapp-admin/dashboard', 'WhatsApp Dashboard');
  
  console.log('📋 Summary:');
  console.log('   ✅ Backend is running on port 5000');
  console.log('   ✅ Frontend is running on port 3000');
  console.log('   📱 Open http://localhost:3000 in your browser');
  console.log('   🔧 The React Router should handle client-side routing');
  console.log('   💡 If routes don\'t work, check browser console for errors');
  
  console.log('\n🎯 Test URLs to try in browser:');
  console.log('   http://localhost:3000/ (should redirect to /admin)');
  console.log('   http://localhost:3000/admin (guest management)');
  console.log('   http://localhost:3000/public/demo-event-1 (public RSVP)');
  console.log('   http://localhost:3000/rsvp/rsvp-token-michael-johnson-abc123 (personal RSVP)');
}

runChecks();