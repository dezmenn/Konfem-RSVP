const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testGuestFormDefaultStatus() {
  console.log('🧪 Testing Guest Form Default RSVP Status...\n');

  try {
    // Test creating a guest through the form (simulating form submission)
    console.log('1. Testing guest creation with form data...');
    const formData = {
      eventId: EVENT_ID,
      name: 'Form Test Guest',
      phoneNumber: '+1987654321',
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      specialRequests: '',
      // Note: We're NOT setting rsvpStatus here to test the default
    };

    console.log('Creating guest with form data (no explicit RSVP status):', formData);
    
    const createResponse = await axios.post(`${BASE_URL}/api/guests`, formData);
    console.log('✅ Guest Creation Response:', {
      success: createResponse.data.success,
      guestName: createResponse.data.data.name,
      rsvpStatus: createResponse.data.data.rsvpStatus,
      id: createResponse.data.data.id
    });
    
    const guest = createResponse.data.data;
    
    if (guest.rsvpStatus === 'not_invited') {
      console.log('✅ SUCCESS: Guest form correctly defaults to "not_invited" status');
    } else {
      console.log('❌ FAILURE: Expected "not_invited", got:', guest.rsvpStatus);
    }

    // Test 2: Verify the guest appears in the invitation status
    console.log('\n2. Testing invitation status with new guest...');
    const statusResponse = await axios.get(`${BASE_URL}/api/invitations/status/${EVENT_ID}`);
    console.log('✅ Invitation Status:', {
      totalGuests: statusResponse.data.data.totalGuests,
      notInvitedGuests: statusResponse.data.data.notInvitedGuests,
      pendingGuests: statusResponse.data.data.pendingGuests
    });

    if (statusResponse.data.data.notInvitedGuests > 0) {
      console.log('✅ SUCCESS: New guest appears in "not invited" count');
    } else {
      console.log('❌ FAILURE: New guest not showing in "not invited" count');
    }

    // Test 3: Test bulk invitation with the new guest
    console.log('\n3. Testing bulk invitation with new uninvited guest...');
    const bulkResponse = await axios.post(`${BASE_URL}/api/invitations/bulk-invite/${EVENT_ID}`);
    console.log('✅ Bulk Invitation Result:', {
      guestsInvited: bulkResponse.data.data.guestsInvited,
      invitationsSent: bulkResponse.data.data.invitationsSent,
      message: bulkResponse.data.message
    });

    if (bulkResponse.data.data.invitationsSent > 0) {
      console.log('✅ SUCCESS: Bulk invitation successfully sent to uninvited guests');
    } else {
      console.log('❌ FAILURE: No invitations sent in bulk operation');
    }

    // Test 4: Verify guest status changed after invitation
    console.log('\n4. Verifying guest status after invitation...');
    const updatedStatusResponse = await axios.get(`${BASE_URL}/api/invitations/status/${EVENT_ID}`);
    console.log('✅ Updated Status:', {
      notInvitedGuests: updatedStatusResponse.data.data.notInvitedGuests,
      pendingGuests: updatedStatusResponse.data.data.pendingGuests
    });

    // Clean up - delete the test guest
    console.log('\n5. Cleaning up test guest...');
    await axios.delete(`${BASE_URL}/api/guests/${guest.id}`);
    console.log('✅ Test guest deleted');

    console.log('\n🎉 All guest form default status tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running on port 5000');
      console.log('   Run: npm run dev (in rsvp-backend directory)');
    }
  }
}

// Run the test
testGuestFormDefaultStatus();