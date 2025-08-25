const axios = require('axios');

async function debugGuestIds() {
  console.log('🔍 Debugging Guest ID Issues...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Get guest data
    console.log('1. 📋 Getting guest data...');
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.data || guestsResponse.data;
    
    console.log(`Total guests: ${guests.length}`);
    
    // Show first few guests with their IDs and status
    console.log('\nFirst 5 guests:');
    guests.slice(0, 5).forEach((guest, index) => {
      console.log(`  ${index + 1}. ID: ${guest.id}`);
      console.log(`     Name: ${guest.name}`);
      console.log(`     RSVP Status: ${guest.rsvpStatus}`);
      console.log(`     Phone: ${guest.phoneNumber}`);
      console.log('');
    });
    
    // Find pending guests specifically
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');
    console.log(`Pending guests (${pendingGuests.length}):`);
    pendingGuests.forEach((guest, index) => {
      console.log(`  ${index + 1}. ID: ${guest.id} | Name: ${guest.name} | Phone: ${guest.phoneNumber}`);
    });
    
    // Check if there are any not_invited guests
    const notInvitedGuests = guests.filter(g => g.rsvpStatus === 'not_invited');
    console.log(`\nNot invited guests (${notInvitedGuests.length}):`);
    notInvitedGuests.forEach((guest, index) => {
      console.log(`  ${index + 1}. ID: ${guest.id} | Name: ${guest.name} | Phone: ${guest.phoneNumber}`);
    });
    
    // Test individual guest lookup
    if (pendingGuests.length > 0) {
      const testGuest = pendingGuests[0];
      console.log(`\n2. 🧪 Testing individual guest lookup for: ${testGuest.name} (ID: ${testGuest.id})`);
      
      try {
        const individualGuestResponse = await axios.get(`${baseURL}/api/guests/guest/${testGuest.id}`);
        console.log('✅ Individual guest lookup successful:', individualGuestResponse.data);
      } catch (error) {
        console.log('❌ Individual guest lookup failed:', error.response?.status, error.response?.data);
      }
    }
    
    // Check all RSVP statuses
    const statusBreakdown = guests.reduce((counts, guest) => {
      counts[guest.rsvpStatus] = (counts[guest.rsvpStatus] || 0) + 1;
      return counts;
    }, {});
    
    console.log('\n3. 📊 Complete RSVP Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Recommendations
    console.log('\n4. 💡 Analysis:');
    if (notInvitedGuests.length === 0) {
      console.log('  ❌ No "not_invited" guests found');
      console.log('  🔧 This means bulk invitation has nothing to send');
      console.log('  💡 You may need to manually set some guests to "not_invited" status for testing');
    }
    
    if (pendingGuests.length > 0) {
      console.log(`  ✅ Found ${pendingGuests.length} pending guests for reminder testing`);
      console.log('  🔧 The "Guest not found" error suggests messaging service can\'t find these guest IDs');
      console.log('  💡 This might be a repository/service mismatch issue');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugGuestIds();