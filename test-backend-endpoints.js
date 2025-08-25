/**
 * Test Backend Endpoints
 * Verify that all required endpoints are working for mobile app
 */

const https = require('http');

console.log('🧪 Testing Backend Endpoints for Mobile App');
console.log('=' .repeat(60));

const baseUrl = 'http://localhost:5000';
const eventId = 'demo-event-1';

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test endpoints
const endpoints = [
  { name: 'Health Check', url: `${baseUrl}/health` },
  { name: 'API Root', url: `${baseUrl}/api` },
  { name: 'Analytics', url: `${baseUrl}/api/analytics/events/${eventId}` },
  { name: 'Invitations Status', url: `${baseUrl}/api/invitations/status/${eventId}` },
  { name: 'Guests', url: `${baseUrl}/api/guests/${eventId}` },
  { name: 'Tables', url: `${baseUrl}/api/tables/events/${eventId}` },
  { name: 'Venue Layout', url: `${baseUrl}/api/venue-layout/events/${eventId}` }
];

async function testEndpoints() {
  console.log('\n🔍 Testing Backend Endpoints:');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.name}`);
      console.log(`🌐 URL: ${endpoint.url}`);
      
      const result = await makeRequest(endpoint.url);
      
      if (result.status === 200) {
        console.log(`✅ Status: ${result.status} OK`);
        
        // Try to parse JSON response
        try {
          const jsonData = JSON.parse(result.data);
          if (jsonData.success !== undefined) {
            console.log(`📊 Success: ${jsonData.success}`);
          }
          if (jsonData.data) {
            console.log(`📄 Data: ${typeof jsonData.data} (${Array.isArray(jsonData.data) ? jsonData.data.length + ' items' : 'object'})`);
          }
          if (jsonData.error) {
            console.log(`⚠️  Error: ${jsonData.error}`);
          }
        } catch (parseError) {
          console.log(`📄 Response: ${result.data.substring(0, 100)}${result.data.length > 100 ? '...' : ''}`);
        }
      } else {
        console.log(`❌ Status: ${result.status}`);
        console.log(`📄 Response: ${result.data.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

async function checkDemoMode() {
  console.log('\n🎭 Checking Demo Mode Configuration:');
  
  try {
    // Check if backend is in demo mode by testing a known demo endpoint
    const result = await makeRequest(`${baseUrl}/api/guests/${eventId}`);
    
    if (result.status === 200) {
      const jsonData = JSON.parse(result.data);
      if (jsonData.success && jsonData.data && jsonData.data.length > 0) {
        console.log('✅ Demo mode appears to be working');
        console.log(`📊 Found ${jsonData.data.length} demo guests`);
      } else {
        console.log('⚠️  Demo mode may not be properly configured');
        console.log('💡 Make sure SKIP_DB_SETUP=true in backend .env file');
      }
    } else {
      console.log('❌ Cannot access demo data');
    }
  } catch (error) {
    console.log(`❌ Demo mode check failed: ${error.message}`);
  }
}

async function generateMobileFix() {
  console.log('\n🔧 MOBILE APP FIX RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  
  // Test if analytics endpoint works
  try {
    const analyticsResult = await makeRequest(`${baseUrl}/api/analytics/events/${eventId}`);
    
    if (analyticsResult.status === 200) {
      console.log('✅ Analytics endpoint is working');
      console.log('💡 Mobile dashboard should load successfully');
    } else {
      console.log('❌ Analytics endpoint is not working');
      console.log('💡 This explains why mobile dashboard shows loading/error');
      
      // Check if it's a demo data issue
      if (analyticsResult.status === 404) {
        console.log('🔧 SOLUTION: Backend needs demo data setup');
        console.log('   1. Make sure backend .env has SKIP_DB_SETUP=true');
        console.log('   2. Restart backend server: cd rsvp-backend && npm run dev');
      }
    }
  } catch (error) {
    console.log('❌ Cannot reach analytics endpoint');
    console.log('🔧 SOLUTION: Backend server connectivity issue');
    console.log('   1. Make sure backend is running: cd rsvp-backend && npm run dev');
    console.log('   2. Check if port 5000 is available');
  }
  
  console.log('\n📱 MOBILE CONFIG VERIFICATION:');
  console.log('Current mobile config should use:');
  console.log('- Android Emulator: http://10.0.2.2:5000');
  console.log('- iOS Simulator: http://localhost:5000');
  console.log('- Physical Device: http://192.168.100.55:5000 (your WiFi IP)');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Verify backend is running with demo data');
  console.log('2. Test mobile app connectivity');
  console.log('3. Check mobile app logs for specific errors');
}

// Run all tests
async function runAllTests() {
  await testEndpoints();
  await checkDemoMode();
  await generateMobileFix();
  
  console.log('\n🚀 Backend endpoint testing complete!');
}

runAllTests().catch(console.error);