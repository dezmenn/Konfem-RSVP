const axios = require('axios');

async function debugInvitationIssue() {
  console.log('🔍 Debugging Invitation Status Issue...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Get guest data
    console.log('1. 📋 Analyzing Guest Data...');
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.data || guestsResponse.data;
    
    console.log(`Total guests found: ${guests.length}\n`);
    
    // Analyze RSVP statuses
    const rsvpStatusCounts = {};
    const invitationStatusCounts = {};
    
    guests.forEach((guest, index) => {
      // Count RSVP statuses
      rsvpStatusCounts[guest.rsvpStatus] = (rsvpStatusCounts[guest.rsvpStatus] || 0) + 1;
      
      // Count invitation statuses (if they exist)
      const invitationStatus = guest.invitationStatus || 'unknown';
      invitationStatusCounts[invitationStatus] = (invitationStatusCounts[invitationStatus] || 0) + 1;
      
      // Show first few guests for debugging
      if (index < 5) {
        console.log(`Guest ${index + 1}: ${guest.name}`);
        console.log(`  - RSVP Status: ${guest.rsvpStatus}`);
        console.log(`  - Invitation Status: ${guest.invitationStatus || 'not set'}`);
        console.log(`  - Phone: ${guest.phoneNumber}`);
        console.log('');
      }
    });
    
    console.log('RSVP Status Breakdown:');
    Object.entries(rsvpStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nInvitation Status Breakdown:');
    Object.entries(invitationStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check current invitation management status
    console.log('\n2. 📊 Current Invitation Management Status...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const status = statusResponse.data.data;
    
    console.log('Current Invitation Management shows:');
    console.log(`  - Total Guests: ${status.totalGuests}`);
    console.log(`  - Not Invited: ${status.notInvitedGuests}`);
    console.log(`  - Pending: ${status.pendingGuests}`);
    console.log(`  - Accepted: ${status.acceptedGuests}`);
    console.log(`  - Declined: ${status.declinedGuests}`);
    
    // Identify the issue
    console.log('\n3. 🔍 Issue Analysis...');
    
    const actualNotInvited = guests.filter(g => 
      g.invitationStatus === 'not_invited' || 
      g.invitationStatus === 'not invited' ||
      g.rsvpStatus === 'not_invited' ||
      g.rsvpStatus === 'not invited'
    ).length;
    
    const actualPending = guests.filter(g => g.rsvpStatus === 'pending').length;
    const actualAccepted = guests.filter(g => g.rsvpStatus === 'accepted').length;
    const actualDeclined = guests.filter(g => g.rsvpStatus === 'declined').length;
    
    console.log('Expected counts based on guest data:');
    console.log(`  - Not Invited: ${actualNotInvited}`);
    console.log(`  - Pending: ${actualPending}`);
    console.log(`  - Accepted: ${actualAccepted}`);
    console.log(`  - Declined: ${actualDeclined}`);
    
    console.log('\nDiscrepancies:');
    console.log(`  - Not Invited: Expected ${actualNotInvited}, Got ${status.notInvitedGuests} ${actualNotInvited !== status.notInvitedGuests ? '❌' : '✅'}`);
    console.log(`  - Pending: Expected ${actualPending}, Got ${status.pendingGuests} ${actualPending !== status.pendingGuests ? '❌' : '✅'}`);
    console.log(`  - Accepted: Expected ${actualAccepted}, Got ${status.acceptedGuests} ${actualAccepted !== status.acceptedGuests ? '❌' : '✅'}`);
    console.log(`  - Declined: Expected ${actualDeclined}, Got ${status.declinedGuests} ${actualDeclined !== status.declinedGuests ? '❌' : '✅'}`);
    
    // Show guests that should be "not invited"
    console.log('\n4. 👥 Guests that should show as "Not Invited":');
    const notInvitedGuests = guests.filter(g => 
      g.invitationStatus === 'not_invited' || 
      g.invitationStatus === 'not invited' ||
      g.rsvpStatus === 'not_invited' ||
      g.rsvpStatus === 'not invited' ||
      (!g.invitationStatus && g.rsvpStatus === 'pending') // Guests with no invitation status but pending RSVP
    );
    
    if (notInvitedGuests.length > 0) {
      notInvitedGuests.forEach((guest, index) => {
        console.log(`  ${index + 1}. ${guest.name}`);
        console.log(`     RSVP Status: ${guest.rsvpStatus}`);
        console.log(`     Invitation Status: ${guest.invitationStatus || 'not set'}`);
      });
    } else {
      console.log('  No guests found that should be "not invited"');
    }
    
    // Recommendations
    console.log('\n5. 💡 Recommendations:');
    if (actualNotInvited > 0) {
      console.log('  ❌ Issue found: Guests exist that should show as "not invited"');
      console.log('  🔧 Fix needed: Update invitation status calculation logic');
      console.log('  📝 The backend should check for:');
      console.log('     - invitationStatus === "not_invited"');
      console.log('     - rsvpStatus === "not_invited"');
      console.log('     - Or other indicators of uninvited guests');
    } else {
      console.log('  ✅ No obvious "not invited" guests found');
      console.log('  🤔 Check if the guest data structure is different than expected');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugInvitationIssue();