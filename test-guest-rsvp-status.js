const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testGuestRSVPStatus() {
  console.log('🧪 Testing Guest RSVP Status (not_invited default)...\n');

  try {
    // Test 1: Create a new guest and verify default RSVP status
    console.log('1. Creating a new guest...');
    const newGuestData = {
      eventId: EVENT_ID,
      name: 'Test Guest for Invitation',
      phoneNumber: '+1234567890',
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      specialRequests: ''
    };

    const createResponse = await axios.post(`${BASE_URL}/api/guests`, newGuestData);
    console.log('✅ Guest Creation Response:', createResponse.data);
    
    const guest = createResponse.data.data || createResponse.data.guest;
    if (guest) {
      console.log('✅ Guest Created:', guest.name);
      console.log('   - RSVP Status:', guest.rsvpStatus);
    } else {
      console.log('❌ No guest data in response');
      return;
    }
    
    if (guest.rsvpStatus === 'not_invited') {
      console.log('✅ Default RSVP status is correctly set to "not_invited"');
    } else {
      console.log('❌ Default RSVP status is incorrect. Expected "not_invited", got:', guest.rsvpStatus);
    }

    const guestId = guest.id;

    // Test 2: Get all guests and check RSVP status distribution
    console.log('\n2. Checking RSVP status distribution...');
    const guestsResponse = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
    console.log('✅ Guests Response:', guestsResponse.data);
    const guests = guestsResponse.data.data || guestsResponse.data.guests;
    
    const statusCounts = guests.reduce((acc, guest) => {
      acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ RSVP Status Distribution:', statusCounts);

    // Test 3: Update guest RSVP status to pending (simulating invitation sent)
    console.log('\n3. Updating guest RSVP status to pending...');
    const updateResponse = await axios.put(`${BASE_URL}/api/guests/${guestId}`, {
      rsvpStatus: 'pending'
    });
    console.log('✅ Update Response:', updateResponse.data);
    
    const updatedGuest = updateResponse.data.data || updateResponse.data.guest;
    if (updatedGuest) {
      console.log('✅ Guest Updated:', updatedGuest.name);
      console.log('   - New RSVP Status:', updatedGuest.rsvpStatus);
    } else {
      console.log('❌ No updated guest data in response');
    }

    // Test 4: Test invitation status endpoint
    console.log('\n4. Testing invitation status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/api/invitations/status/${EVENT_ID}`);
    console.log('✅ Invitation Status:', {
      totalGuests: statusResponse.data.data.totalGuests,
      notInvitedGuests: statusResponse.data.data.notInvitedGuests,
      pendingGuests: statusResponse.data.data.pendingGuests
    });

    // Test 5: Clean up - delete the test guest
    console.log('\n5. Cleaning up test guest...');
    await axios.delete(`${BASE_URL}/api/guests/${guestId}`);
    console.log('✅ Test guest deleted');

    console.log('\n🎉 All RSVP status tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running on port 5000');
      console.log('   Run: npm run dev:backend');
    }
  }
}

// Run the test
testGuestRSVPStatus();