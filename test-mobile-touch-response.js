/**
 * Mobile Touch Response Test
 * Comprehensive test for mobile app functionality
 */

const axios = require('axios');

async function testMobileEndpoints() {
  console.log('📱 Testing Mobile App Endpoints...\n');
  
  const baseUrl = 'http://192.168.100.55:5000'; // Mobile app's configured URL
  const eventId = 'demo-event-1';
  
  const endpoints = [
    {
      name: 'Health Check',
      url: `${baseUrl}/health`,
      method: 'GET'
    },
    {
      name: 'API Root',
      url: `${baseUrl}/api`,
      method: 'GET'
    },
    {
      name: 'Guest List',
      url: `${baseUrl}/api/guests/${eventId}`,
      method: 'GET'
    },
    {
      name: 'Invitation Schedules',
      url: `${baseUrl}/api/invitations/event/${eventId}`,
      method: 'GET'
    },
    {
      name: 'Invitation Status',
      url: `${baseUrl}/api/invitations/status/${eventId}`,
      method: 'GET'
    },
    {
      name: 'Invitation Executions',
      url: `${baseUrl}/api/invitations/executions/${eventId}`,
      method: 'GET'
    }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        timeout: 5000
      });
      
      console.log(`✅ SUCCESS (${response.status})`);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`   Found ${response.data.data.length} items`);
      }
      
      successCount++;
    } catch (error) {
      if (error.response) {
        console.log(`❌ HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Connection refused - check if backend is running`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ Timeout - check network connectivity`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  return successCount === endpoints.length;
}

async function testMobileAppButtons() {
  console.log('🔘 Testing Mobile App Button Functionality...\n');
  
  console.log('The mobile app has these buttons:');
  console.log('1. Test Touch - Should show an alert');
  console.log('2. Guest Management - Should load guest list');
  console.log('3. Invitation Management - Should load invitation interface');
  console.log('');
  
  console.log('Expected behavior:');
  console.log('✅ Test Touch: Alert popup saying "Touch is working!"');
  console.log('✅ Guest Management: Switch to guest list view');
  console.log('✅ Invitation Management: Switch to invitation view');
  console.log('');
}

async function provideTroubleshootingSteps() {
  console.log('🔧 Troubleshooting Steps for Mobile App:\n');
  
  console.log('1. Network Configuration:');
  console.log('   - Ensure your phone and computer are on the same WiFi');
  console.log('   - Mobile app is configured to use: http://192.168.100.55:5000');
  console.log('   - Backend server is running on: http://localhost:5000');
  console.log('');
  
  console.log('2. If buttons are not responding:');
  console.log('   - Check Expo console for JavaScript errors');
  console.log('   - Restart the Expo development server');
  console.log('   - Clear React Native cache: expo start -c');
  console.log('   - Check if the app is frozen or crashed');
  console.log('');
  
  console.log('3. If API calls are failing:');
  console.log('   - Verify backend server is running');
  console.log('   - Check Windows Firewall settings for port 5000');
  console.log('   - Test API endpoints from computer first');
  console.log('   - Ensure CORS is configured for mobile URLs');
  console.log('');
  
  console.log('4. Common Issues:');
  console.log('   - Touch events not registering: App may be crashed');
  console.log('   - Blank screens: Check for JavaScript errors');
  console.log('   - Network errors: Check IP address configuration');
  console.log('   - Slow response: Check network connection quality');
  console.log('');
}

async function main() {
  console.log('🚀 Mobile Touch Response Comprehensive Test\n');
  
  const apiWorking = await testMobileEndpoints();
  await testMobileAppButtons();
  await provideTroubleshootingSteps();
  
  console.log('📋 Summary:');
  if (apiWorking) {
    console.log('✅ Backend API is working correctly');
    console.log('✅ Mobile app should be able to connect');
    console.log('');
    console.log('If buttons are still not responding:');
    console.log('1. Check Expo console for errors');
    console.log('2. Restart Expo development server');
    console.log('3. Try shaking the device to open developer menu');
    console.log('4. Enable remote debugging to see console logs');
  } else {
    console.log('❌ Backend API has issues');
    console.log('❌ Fix backend first before testing mobile app');
  }
}

main().catch(console.error);