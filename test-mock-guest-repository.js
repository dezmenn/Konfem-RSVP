const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testMockGuestRepository() {
  console.log('🧪 Testing MockGuestRepository directly...\n');

  try {
    // Test creating a guest with a unique name to avoid conflicts
    const uniqueName = `Test Guest ${Date.now()}`;
    const newGuestData = {
      eventId: 'demo-event-1',
      name: uniqueName,
      phoneNumber: `+123456789${Math.floor(Math.random() * 100)}`,
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      specialRequests: ''
    };

    console.log('Creating guest with data:', newGuestData);
    
    const createResponse = await axios.post(`${BASE_URL}/api/guests`, newGuestData);
    console.log('✅ Full Response:', JSON.stringify(createResponse.data, null, 2));
    
    const guest = createResponse.data.data;
    if (guest) {
      console.log('\n✅ Guest Created Successfully:');
      console.log('   - Name:', guest.name);
      console.log('   - ID:', guest.id);
      console.log('   - RSVP Status:', guest.rsvpStatus);
      console.log('   - Created At:', guest.createdAt);
      
      if (guest.rsvpStatus === 'not_invited') {
        console.log('✅ SUCCESS: RSVP status is correctly set to "not_invited"');
      } else {
        console.log('❌ FAILURE: RSVP status is incorrect. Expected "not_invited", got:', guest.rsvpStatus);
      }
    } else {
      console.log('❌ No guest data in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMockGuestRepository();