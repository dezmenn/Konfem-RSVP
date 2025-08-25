/**
 * Mobile Touch Response Debug Test
 * Tests mobile app touch functionality and API connectivity
 */

const axios = require('axios');

// Test API connectivity from different endpoints
const testEndpoints = [
  'http://localhost:5000',
  'http://10.0.2.2:5000',
  'http://192.168.1.100:5000', // Common IP range - adjust as needed
  'http://192.168.0.100:5000'  // Another common IP range
];

async function testApiConnectivity() {
  console.log('🔍 Testing API connectivity for mobile app...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${endpoint}/api/guests`, {
        timeout: 3000
      });
      console.log(`✅ ${endpoint} - SUCCESS (${response.status})`);
      console.log(`   Found ${response.data.length} guests\n`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint} - Connection refused (server not running)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`⏱️  ${endpoint} - Timeout (wrong IP or firewall)`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
  }
}

async function checkMobileAppStructure() {
  console.log('\n📱 Checking mobile app structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  const mobileFiles = [
    'rsvp-mobile/App.tsx',
    'rsvp-mobile/config.ts',
    'rsvp-mobile/components/GuestManagement.tsx',
    'rsvp-mobile/components/InvitationManagement.tsx'
  ];
  
  for (const file of mobileFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
}

async function getNetworkInfo() {
  console.log('\n🌐 Network Information:');
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   ${name}: ${net.address}`);
      }
    }
  }
  
  console.log('\n💡 For Android physical device testing:');
  console.log('   1. Use your computer\'s IP address (shown above)');
  console.log('   2. Make sure your phone and computer are on the same WiFi');
  console.log('   3. Update rsvp-mobile/config.ts with the correct IP');
  console.log('   4. Restart the Expo development server');
}

async function main() {
  console.log('🚀 Mobile Touch Response Debug Test\n');
  
  await checkMobileAppStructure();
  await getNetworkInfo();
  await testApiConnectivity();
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Make sure backend is running on port 5000');
  console.log('2. Check if your firewall is blocking port 5000');
  console.log('3. For Android emulator: use 10.0.2.2:5000');
  console.log('4. For Android device: use your computer\'s IP address');
  console.log('5. Restart Expo development server after config changes');
  console.log('6. Check Expo console for any JavaScript errors');
}

main().catch(console.error);