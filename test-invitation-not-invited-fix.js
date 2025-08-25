const axios = require('axios');

async function testInvitationNotInvitedFix() {
  console.log('🧪 Testing Invitation Management - "Not Invited" Guest Fix...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Verify guest data and identify "not invited" guests
    console.log('1. 📋 Analyzing Current Guest Data...');
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.data || guestsResponse.data;
    
    console.log(`Total guests: ${guests.length}`);
    
    // Analyze guest statuses
    const statusBreakdown = guests.reduce((counts, guest) => {
      counts[guest.rsvpStatus] = (counts[guest.rsvpStatus] || 0) + 1;
      return counts;
    }, {});
    
    console.log('RSVP Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Find the "not invited" guests
    const notInvitedGuests = guests.filter(guest => 
      guest.rsvpStatus === 'not_invited' || 
      guest.rsvpStatus === 'not invited'
    );
    
    console.log(`\nGuests with "not_invited" status: ${notInvitedGuests.length}`);
    notInvitedGuests.forEach((guest, index) => {
      console.log(`  ${index + 1}. ${guest.name} (${guest.rsvpStatus})`);
    });
    
    // Test 2: Check if invitation management now shows the correct "not invited" count
    console.log('\n2. 📊 Testing Fixed Invitation Status...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const status = statusResponse.data.data;
    
    console.log('Invitation Management Status:');
    console.log(`  - Total Guests: ${status.totalGuests}`);
    console.log(`  - Not Invited: ${status.notInvitedGuests}`);
    console.log(`  - Pending: ${status.pendingGuests}`);
    console.log(`  - Accepted: ${status.acceptedGuests}`);
    console.log(`  - Declined: ${status.declinedGuests}`);
    console.log(`  - Total Invitations Sent: ${status.totalInvitationsSent}`);
    
    // Verify the fix
    const expectedNotInvited = notInvitedGuests.length;
    const actualNotInvited = status.notInvitedGuests;
    
    console.log('\n3. ✅ Verification Results:');
    console.log(`  Expected "Not Invited": ${expectedNotInvited}`);
    console.log(`  Actual "Not Invited": ${actualNotInvited}`);
    console.log(`  Fix Status: ${expectedNotInvited === actualNotInvited ? '✅ FIXED' : '❌ STILL BROKEN'}`);
    
    // Test 3: Test bulk invitation targeting
    console.log('\n4. 📧 Testing Bulk Invitation Targeting...');
    const bulkResponse = await axios.post(`${baseURL}/api/invitations/bulk-invite/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Bulk Invitation Results:');
    console.log(`  - Guests Invited: ${bulkResponse.data.data.guestsInvited}`);
    console.log(`  - Invitations Sent: ${bulkResponse.data.data.invitationsSent}`);
    console.log(`  - Message: ${bulkResponse.data.message}`);
    
    const expectedBulkTargets = notInvitedGuests.length;
    const actualBulkTargets = bulkResponse.data.data.guestsInvited;
    
    console.log(`  Expected Bulk Targets: ${expectedBulkTargets}`);
    console.log(`  Actual Bulk Targets: ${actualBulkTargets}`);
    console.log(`  Bulk Targeting: ${expectedBulkTargets === actualBulkTargets ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    // Test 4: Create a schedule and test execution targeting
    console.log('\n5. ▶️ Testing Schedule Execution Targeting...');
    
    // Create a test schedule
    const scheduleData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 0,
        messageTemplate: 'Test invitation for {{guestName}} - You are invited to {{eventTitle}}!',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/invitations/configure`, scheduleData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const createdSchedule = createResponse.data.data[0];
    console.log(`  Schedule created: ${createdSchedule.id}`);
    
    // Execute the schedule
    const executeResponse = await axios.post(`${baseURL}/api/invitations/execute/${createdSchedule.id}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Schedule Execution Results:');
    console.log(`  - Guests Processed: ${executeResponse.data.data.guestsProcessed}`);
    console.log(`  - Invitations Scheduled: ${executeResponse.data.data.invitationsScheduled}`);
    
    const expectedExecuteTargets = notInvitedGuests.length;
    const actualExecuteTargets = executeResponse.data.data.guestsProcessed;
    
    console.log(`  Expected Execute Targets: ${expectedExecuteTargets}`);
    console.log(`  Actual Execute Targets: ${actualExecuteTargets}`);
    console.log(`  Execute Targeting: ${expectedExecuteTargets === actualExecuteTargets ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    // Test 5: Test execute all schedules
    console.log('\n6. 🚀 Testing Execute All Schedules...');
    const executeAllResponse = await axios.post(`${baseURL}/api/invitations/execute-all/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Execute All Results:');
    console.log(`  - Schedules Executed: ${executeAllResponse.data.data.length}`);
    console.log(`  - Message: ${executeAllResponse.data.message}`);
    
    if (executeAllResponse.data.data.length > 0) {
      const firstExecution = executeAllResponse.data.data[0];
      console.log(`  - First Schedule Targets: ${firstExecution.guestsProcessed}`);
      
      const expectedExecuteAllTargets = notInvitedGuests.length;
      const actualExecuteAllTargets = firstExecution.guestsProcessed;
      
      console.log(`  Expected Execute All Targets: ${expectedExecuteAllTargets}`);
      console.log(`  Actual Execute All Targets: ${actualExecuteAllTargets}`);
      console.log(`  Execute All Targeting: ${expectedExecuteAllTargets === actualExecuteAllTargets ? '✅ CORRECT' : '❌ INCORRECT'}`);
    }
    
    // Test 6: Verify invitation sent calculation
    console.log('\n7. 🧮 Testing Invitation Sent Calculation...');
    const finalStatusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const finalStatus = finalStatusResponse.data.data;
    
    const expectedInvitationsSent = finalStatus.totalGuests - finalStatus.notInvitedGuests;
    const actualInvitationsSent = finalStatus.totalInvitationsSent;
    
    console.log(`  Total Guests: ${finalStatus.totalGuests}`);
    console.log(`  Not Invited: ${finalStatus.notInvitedGuests}`);
    console.log(`  Expected Invitations Sent: ${expectedInvitationsSent}`);
    console.log(`  Actual Invitations Sent: ${actualInvitationsSent}`);
    console.log(`  Calculation: ${expectedInvitationsSent === actualInvitationsSent ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    // Clean up - delete the test schedule
    await axios.delete(`${baseURL}/api/invitations/schedule/${createdSchedule.id}`);
    
    // Final Assessment
    console.log('\n🎯 COMPREHENSIVE FIX VERIFICATION:');
    
    const allTestsPassed = (
      expectedNotInvited === actualNotInvited &&
      expectedBulkTargets === actualBulkTargets &&
      expectedExecuteTargets === actualExecuteTargets &&
      expectedInvitationsSent === actualInvitationsSent
    );
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED - "NOT INVITED" ISSUE IS FIXED!');
      console.log('\n✅ Fixed Issues:');
      console.log('   • "Not Invited" guests now show correctly in status');
      console.log('   • Bulk invitations target only "not invited" guests');
      console.log('   • Schedule execution targets only "not invited" guests');
      console.log('   • Invitation sent calculation is accurate');
      console.log('   • All targeting logic is consistent');
      
      console.log('\n📊 Current Status Summary:');
      console.log(`   • Total Guests: ${finalStatus.totalGuests}`);
      console.log(`   • Not Invited: ${finalStatus.notInvitedGuests} (${notInvitedGuests.map(g => g.name).join(', ')})`);
      console.log(`   • Pending: ${finalStatus.pendingGuests}`);
      console.log(`   • Accepted: ${finalStatus.acceptedGuests}`);
      console.log(`   • Invitations Sent: ${finalStatus.totalInvitationsSent}`);
      
    } else {
      console.log('❌ SOME TESTS FAILED - ISSUES REMAIN');
      console.log('   Check the individual test results above for details');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test in your web application');
    console.log('   3. The "Not Invited" count should now show correctly');
    console.log('   4. Bulk invitations should target the right guests');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
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

testInvitationNotInvitedFix();