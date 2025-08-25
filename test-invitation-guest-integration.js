const axios = require('axios');

async function testInvitationGuestIntegration() {
  console.log('🧪 Testing Invitation-Guest Data Integration...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Get guest data directly from guest service
    console.log('1. 📋 Getting guest data from Guest Management...');
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.data || guestsResponse.data;
    
    console.log('   Guest Management Data:');
    console.log(`   - Total guests: ${guests.length}`);
    
    if (guests.length > 0) {
      const rsvpStatusCounts = guests.reduce((counts, guest) => {
        counts[guest.rsvpStatus] = (counts[guest.rsvpStatus] || 0) + 1;
        return counts;
      }, {});
      
      console.log('   - RSVP Status breakdown:');
      Object.entries(rsvpStatusCounts).forEach(([status, count]) => {
        console.log(`     * ${status}: ${count}`);
      });
    }
    
    // Test 2: Get invitation status (should now use real guest data)
    console.log('\n2. 📧 Getting invitation status (should use guest data)...');
    const invitationStatusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const invitationStatus = invitationStatusResponse.data.data;
    
    console.log('   Invitation Management Data:');
    console.log(`   - Total guests: ${invitationStatus.totalGuests}`);
    console.log(`   - Pending guests: ${invitationStatus.pendingGuests}`);
    console.log(`   - Accepted guests: ${invitationStatus.acceptedGuests}`);
    console.log(`   - Declined guests: ${invitationStatus.declinedGuests}`);
    console.log(`   - Not invited guests: ${invitationStatus.notInvitedGuests}`);
    console.log(`   - Total invitations sent: ${invitationStatus.totalInvitationsSent}`);
    
    // Test 3: Compare the data to ensure they match
    console.log('\n3. 🔍 Comparing Guest Management vs Invitation Management data...');
    
    const guestTotalGuests = guests.length;
    const guestPendingCount = guests.filter(g => g.rsvpStatus === 'pending').length;
    const guestAcceptedCount = guests.filter(g => g.rsvpStatus === 'accepted').length;
    const guestDeclinedCount = guests.filter(g => g.rsvpStatus === 'declined').length;
    
    const dataMatches = {
      totalGuests: guestTotalGuests === invitationStatus.totalGuests,
      pendingGuests: guestPendingCount === invitationStatus.pendingGuests,
      acceptedGuests: guestAcceptedCount === invitationStatus.acceptedGuests,
      declinedGuests: guestDeclinedCount === invitationStatus.declinedGuests
    };
    
    console.log('   Data Comparison Results:');
    Object.entries(dataMatches).forEach(([field, matches]) => {
      const status = matches ? '✅' : '❌';
      console.log(`   ${status} ${field}: ${matches ? 'MATCH' : 'MISMATCH'}`);
      
      if (!matches) {
        console.log(`      Guest Management: ${field === 'totalGuests' ? guestTotalGuests : 
                     field === 'pendingGuests' ? guestPendingCount :
                     field === 'acceptedGuests' ? guestAcceptedCount : guestDeclinedCount}`);
        console.log(`      Invitation Management: ${invitationStatus[field]}`);
      }
    });
    
    // Test 4: Test bulk invitation with real data
    console.log('\n4. 📤 Testing bulk invitation with real guest data...');
    const bulkInviteResponse = await axios.post(`${baseURL}/api/invitations/bulk-invite/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const bulkResult = bulkInviteResponse.data;
    console.log('   Bulk Invitation Results:');
    console.log(`   - Guests invited: ${bulkResult.data.guestsInvited}`);
    console.log(`   - Invitations sent: ${bulkResult.data.invitationsSent}`);
    console.log(`   - Message: ${bulkResult.message}`);
    
    // Test 5: Verify bulk invitation logic
    console.log('\n5. 🧮 Verifying bulk invitation logic...');
    const expectedUninvitedGuests = guests.filter(g => g.rsvpStatus === 'pending').length;
    const actualGuestsInvited = bulkResult.data.guestsInvited;
    
    if (expectedUninvitedGuests === actualGuestsInvited) {
      console.log('   ✅ Bulk invitation logic is correct');
      console.log(`   - Found ${expectedUninvitedGuests} pending guests to invite`);
    } else {
      console.log('   ❌ Bulk invitation logic mismatch');
      console.log(`   - Expected: ${expectedUninvitedGuests} (pending guests)`);
      console.log(`   - Actual: ${actualGuestsInvited}`);
    }
    
    // Summary
    const allDataMatches = Object.values(dataMatches).every(match => match);
    const bulkLogicCorrect = expectedUninvitedGuests === actualGuestsInvited;
    
    console.log('\n📊 INTEGRATION TEST SUMMARY:');
    if (allDataMatches && bulkLogicCorrect) {
      console.log('🎉 SUCCESS: Invitation Management is properly integrated with Guest Management!');
      console.log('   ✅ All guest counts match between systems');
      console.log('   ✅ Bulk invitation logic uses real guest data');
      console.log('   ✅ RSVP status filtering works correctly');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some issues found');
      if (!allDataMatches) {
        console.log('   ❌ Guest count mismatches detected');
      }
      if (!bulkLogicCorrect) {
        console.log('   ❌ Bulk invitation logic needs adjustment');
      }
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart your backend server if you haven\'t already');
    console.log('   2. Test the invitation management in your web app');
    console.log('   3. The invitation counts should now reflect your actual guest data');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 Backend server is not running!');
      console.error('   Please start: cd rsvp-backend && npm run dev');
    }
  }
}

testInvitationGuestIntegration();