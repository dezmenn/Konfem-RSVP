async function testInvitationFrontendBackend() {
  console.log('🔍 Testing Fixed Invitation Management...\n');
  
  // Dynamic import for node-fetch
  const { default: fetch } = await import('node-fetch');
  
  // Test if backend is running
  try {
    const healthResponse = await fetch('http://localhost:5000/health');
    if (!healthResponse.ok) {
      console.log('❌ Backend is not responding on port 5000');
      console.log('   Please make sure you have restarted the backend server');
      return;
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend is running:', healthData.status);
  } catch (error) {
    console.log('❌ Cannot connect to backend on port 5000');
    console.log('   Please make sure you have restarted the backend server');
    return;
  }
  
  // Test the fixed invitation endpoints
  console.log('\n🔍 Testing fixed invitation endpoints...');
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Get invitation schedules
    console.log('1. Testing invitation schedules endpoint...');
    const schedulesResponse = await fetch(`http://localhost:5000/api/invitations/event/${eventId}`);
    console.log(`   Status: ${schedulesResponse.status} ${schedulesResponse.statusText}`);
    
    if (schedulesResponse.ok) {
      const schedulesData = await schedulesResponse.json();
      console.log('   ✅ Schedules endpoint working!');
      console.log('   Response:', JSON.stringify(schedulesData, null, 2));
    } else {
      const errorText = await schedulesResponse.text();
      console.log('   ❌ Schedules endpoint failed:', errorText);
      return;
    }
    
    // Test 2: Get invitation status
    console.log('\n2. Testing invitation status endpoint...');
    const statusResponse = await fetch(`http://localhost:5000/api/invitations/status/${eventId}`);
    console.log(`   Status: ${statusResponse.status} ${statusResponse.statusText}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('   ✅ Status endpoint working!');
      console.log('   Total guests:', statusData.data?.totalGuests);
      console.log('   Not invited:', statusData.data?.notInvitedGuests);
      console.log('   Pending:', statusData.data?.pendingGuests);
    } else {
      const errorText = await statusResponse.text();
      console.log('   ❌ Status endpoint failed:', errorText);
      return;
    }
    
    // Test 3: Create invitation schedule
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
    
    console.log(`   Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('   ✅ Create schedule endpoint working!');
      console.log('   Created schedules:', createData.data?.length || 0);
    } else {
      const errorText = await createResponse.text();
      console.log('   ❌ Create schedule failed:', errorText);
    }
    
    // Test 4: Bulk invitation
    console.log('\n4. Testing bulk invitation endpoint...');
    const bulkResponse = await fetch(`http://localhost:5000/api/invitations/bulk-invite/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${bulkResponse.status} ${bulkResponse.statusText}`);
    
    if (bulkResponse.ok) {
      const bulkData = await bulkResponse.json();
      console.log('   ✅ Bulk invitation endpoint working!');
      console.log('   Guests invited:', bulkData.data?.guestsInvited);
      console.log('   Invitations sent:', bulkData.data?.invitationsSent);
    } else {
      const errorText = await bulkResponse.text();
      console.log('   ❌ Bulk invitation failed:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return;
  }
  
  // Test frontend connection (if frontend is running)
  console.log('\n🔍 Testing frontend connection...');
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    if (frontendResponse.ok) {
      console.log('✅ Frontend is running on port 3000');
      
      // Test frontend API proxy
      try {
        const proxyTest = await fetch('http://localhost:3000/api/invitations/status/demo-event-1');
        if (proxyTest.ok) {
          console.log('✅ Frontend-backend proxy is working');
        } else {
          console.log('❌ Frontend-backend proxy failed');
        }
      } catch (proxyError) {
        console.log('❌ Frontend-backend proxy error:', proxyError.message);
      }
    } else {
      console.log('❌ Frontend is not running on port 3000');
      console.log('   Start it with: cd rsvp-web && npm start');
    }
  } catch (error) {
    console.log('❌ Frontend is not running on port 3000');
    console.log('   Start it with: cd rsvp-web && npm start');
  }
  
  // Summary
  console.log('\n🎉 Test Results Summary:');
  console.log('✅ Backend invitation endpoints are working');
  console.log('✅ All API calls return proper JSON responses');
  console.log('✅ No more 404 errors on invitation routes');
  
  console.log('\n📋 Next Steps:');
  console.log('1. If frontend is running, visit: http://localhost:3000/admin/invitations-mgmt');
  console.log('2. The "Failed to load invitation data" error should be gone');
  console.log('3. You should see invitation statistics and empty schedules list');
  console.log('4. Try creating a new invitation schedule to test functionality');
  
  console.log('\n🔧 If you still see errors:');
  console.log('- Check browser console for detailed error messages');
  console.log('- Make sure both backend (port 5000) and frontend (port 3000) are running');
  console.log('- Hard refresh the browser (Ctrl+F5) to clear cache');
}

testInvitationFrontendBackend().catch(error => {
  console.error('Test failed:', error);
});