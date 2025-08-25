/**
 * Test Mobile API Connection
 * Verify the mobile app can connect to backend with new config
 */

async function testMobileApiConnection() {
  console.log('📱 Testing Mobile API Connection...\n');
  
  // Test the WiFi IP that mobile app will now use
  const mobileApiUrl = 'http://192.168.100.55:5000';
  
  console.log(`Testing mobile API endpoint: ${mobileApiUrl}`);
  
  try {
    // Test the exact same endpoint the mobile app uses
    const response = await fetch(`${mobileApiUrl}/api/guests/demo-event-1`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Mobile API Connection Successful!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Guests found: ${data.data?.length || 0}`);
      
      // Show first few guests to verify data
      if (data.data && data.data.length > 0) {
        console.log('\n📋 Sample guests:');
        data.data.slice(0, 3).forEach(guest => {
          console.log(`   - ${guest.name} (${guest.rsvpStatus})`);
        });
      }
      
      console.log('\n🎉 Your mobile app should now work!');
      console.log('💡 If still having issues:');
      console.log('   1. Restart your mobile app/simulator');
      console.log('   2. Clear Metro cache: npx expo start --clear');
      console.log('   3. Make sure your device is on the same WiFi network');
      
    } else {
      console.log(`❌ HTTP Error: ${response.status}`);
      console.log('   Backend is running but returned an error');
    }
    
  } catch (error) {
    console.log(`❌ Connection Failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if backend is running: npm run dev:backend');
    console.log('   2. Verify your WiFi IP hasn\'t changed');
    console.log('   3. Check Windows Firewall settings');
    console.log('   4. Try using 10.0.2.2:5000 for Android emulator');
  }
}

testMobileApiConnection().catch(console.error);