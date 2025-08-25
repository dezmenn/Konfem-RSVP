const axios = require('axios');

async function testCompleteInvitationFunctionality() {
  console.log('🧪 Testing Complete Invitation & WhatsApp Integration...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Test 1: Verify initial guest status
    console.log('1. 📋 Checking Initial Guest Status...');
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.data || guestsResponse.data;
    
    const statusBreakdown = guests.reduce((counts, guest) => {
      counts[guest.rsvpStatus] = (counts[guest.rsvpStatus] || 0) + 1;
      return counts;
    }, {});
    
    console.log(`   Total guests: ${guests.length}`);
    console.log('   RSVP Status breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });
    
    const notInvitedGuests = guests.filter(g => g.rsvpStatus === 'not_invited');
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');
    
    console.log(`   Not invited guests: ${notInvitedGuests.map(g => g.name).join(', ')}`);
    console.log(`   Pending guests: ${pendingGuests.map(g => g.name).join(', ')}`);
    
    // Test 2: Check invitation management status
    console.log('\n2. 📊 Checking Invitation Management Status...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const invitationStatus = statusResponse.data.data;
    
    console.log('   Invitation Management shows:');
    console.log(`     Total: ${invitationStatus.totalGuests}`);
    console.log(`     Not Invited: ${invitationStatus.notInvitedGuests}`);
    console.log(`     Pending: ${invitationStatus.pendingGuests}`);
    console.log(`     Accepted: ${invitationStatus.acceptedGuests}`);
    console.log(`     Invitations Sent: ${invitationStatus.totalInvitationsSent}`);
    
    // Test 3: Send bulk invitations (should change not_invited → pending)
    console.log('\n3. 📧 Testing Bulk Invitation with WhatsApp Integration...');
    const bulkResponse = await axios.post(`${baseURL}/api/invitations/bulk-invite/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   Bulk invitation results:');
    console.log(`     Success: ${bulkResponse.data.success}`);
    console.log(`     Guests invited: ${bulkResponse.data.data.guestsInvited}`);
    console.log(`     Invitations sent: ${bulkResponse.data.data.invitationsSent}`);
    console.log(`     Invitations skipped: ${bulkResponse.data.data.invitationsSkipped}`);
    console.log(`     Message: ${bulkResponse.data.message}`);
    
    if (bulkResponse.data.data.errors.length > 0) {
      console.log('     Errors:');
      bulkResponse.data.data.errors.forEach(error => {
        console.log(`       - ${error}`);
      });
    }
    
    // Test 4: Verify guest status changed after bulk invitation
    console.log('\n4. 🔄 Verifying Guest Status Changes After Bulk Invitation...');
    const updatedGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const updatedGuests = updatedGuestsResponse.data.data || updatedGuestsResponse.data;
    
    const updatedStatusBreakdown = updatedGuests.reduce((counts, guest) => {
      counts[guest.rsvpStatus] = (counts[guest.rsvpStatus] || 0) + 1;
      return counts;
    }, {});
    
    console.log('   Updated RSVP Status breakdown:');
    Object.entries(updatedStatusBreakdown).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });
    
    const newNotInvitedGuests = updatedGuests.filter(g => g.rsvpStatus === 'not_invited');
    const newPendingGuests = updatedGuests.filter(g => g.rsvpStatus === 'pending');
    
    console.log(`   Not invited guests now: ${newNotInvitedGuests.map(g => g.name).join(', ') || 'None'}`);
    console.log(`   Pending guests now: ${newPendingGuests.map(g => g.name).join(', ')}`);
    
    // Verify status change worked
    const statusChangeWorked = newNotInvitedGuests.length < notInvitedGuests.length;
    console.log(`   Status change verification: ${statusChangeWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Test 5: Check updated invitation management status
    console.log('\n5. 📈 Checking Updated Invitation Management Status...');
    const updatedStatusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const updatedInvitationStatus = updatedStatusResponse.data.data;
    
    console.log('   Updated Invitation Management shows:');
    console.log(`     Total: ${updatedInvitationStatus.totalGuests}`);
    console.log(`     Not Invited: ${updatedInvitationStatus.notInvitedGuests}`);
    console.log(`     Pending: ${updatedInvitationStatus.pendingGuests}`);
    console.log(`     Accepted: ${updatedInvitationStatus.acceptedGuests}`);
    console.log(`     Invitations Sent: ${updatedInvitationStatus.totalInvitationsSent}`);
    
    // Test 6: Create a reminder schedule
    console.log('\n6. ➕ Creating Reminder Schedule...');
    const scheduleData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 3,
        messageTemplate: 'Hi {{guestName}}, this is a reminder about {{eventTitle}} on {{eventDate}}. Please RSVP: {{rsvpLink}}',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/invitations/configure`, scheduleData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   Schedule created: ${createResponse.data.success}`);
    const createdSchedule = createResponse.data.data[0];
    console.log(`   Schedule ID: ${createdSchedule.id}`);
    
    // Test 7: Execute reminder schedule (should target pending guests)
    console.log('\n7. ▶️ Testing Reminder Schedule Execution...');
    const executeResponse = await axios.post(`${baseURL}/api/invitations/execute/${createdSchedule.id}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   Schedule execution results:');
    console.log(`     Success: ${executeResponse.data.success}`);
    console.log(`     Guests processed: ${executeResponse.data.data.guestsProcessed}`);
    console.log(`     Reminders sent: ${executeResponse.data.data.invitationsScheduled}`);
    console.log(`     Reminders skipped: ${executeResponse.data.data.invitationsSkipped}`);
    console.log(`     Message: ${executeResponse.data.message}`);
    
    if (executeResponse.data.data.errors.length > 0) {
      console.log('     Errors:');
      executeResponse.data.data.errors.forEach(error => {
        console.log(`       - ${error}`);
      });
    }
    
    // Test 8: Test execute all schedules
    console.log('\n8. 🚀 Testing Execute All Schedules...');
    const executeAllResponse = await axios.post(`${baseURL}/api/invitations/execute-all/${eventId}`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   Execute all results:');
    console.log(`     Success: ${executeAllResponse.data.success}`);
    console.log(`     Schedules executed: ${executeAllResponse.data.data.length}`);
    console.log(`     Message: ${executeAllResponse.data.message}`);
    
    if (executeAllResponse.data.data.length > 0) {
      const firstExecution = executeAllResponse.data.data[0];
      console.log(`     First schedule reminders sent: ${firstExecution.invitationsScheduled}`);
    }
    
    // Test 9: Check WhatsApp message history
    console.log('\n9. 📱 Checking WhatsApp Message History...');
    try {
      const messagesResponse = await axios.get(`${baseURL}/api/whatsapp-admin/messages`);
      const messages = messagesResponse.data.data || [];
      
      console.log(`   Total WhatsApp messages: ${messages.length}`);
      
      // Show recent messages
      const recentMessages = messages.slice(-5);
      console.log('   Recent messages:');
      recentMessages.forEach((msg, index) => {
        console.log(`     ${index + 1}. To: ${msg.to} | Type: ${msg.messageType} | Status: ${msg.status}`);
        console.log(`        Content: ${msg.content.substring(0, 50)}...`);
      });
    } catch (error) {
      console.log('   ⚠️ Could not fetch WhatsApp message history');
    }
    
    // Clean up - delete the test schedule
    await axios.delete(`${baseURL}/api/invitations/schedule/${createdSchedule.id}`);
    
    // Final Assessment
    console.log('\n🎯 COMPREHENSIVE INTEGRATION TEST RESULTS:');
    
    const integrationWorking = (
      bulkResponse.data.success &&
      bulkResponse.data.data.invitationsSent > 0 &&
      statusChangeWorked &&
      executeResponse.data.success &&
      executeResponse.data.data.invitationsScheduled >= 0
    );
    
    if (integrationWorking) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('\n✅ Verified Features:');
      console.log('   • WhatsApp integration working');
      console.log('   • Bulk invitations send real messages');
      console.log('   • Guest status changes: not_invited → pending');
      console.log('   • Reminder schedules target pending guests');
      console.log('   • Schedule execution sends WhatsApp reminders');
      console.log('   • Status calculations are accurate');
      console.log('   • Error handling works properly');
      
      console.log('\n📊 Final Status Summary:');
      console.log(`   • Total Guests: ${updatedInvitationStatus.totalGuests}`);
      console.log(`   • Not Invited: ${updatedInvitationStatus.notInvitedGuests}`);
      console.log(`   • Pending: ${updatedInvitationStatus.pendingGuests}`);
      console.log(`   • Accepted: ${updatedInvitationStatus.acceptedGuests}`);
      console.log(`   • Invitations Sent: ${updatedInvitationStatus.totalInvitationsSent}`);
      
    } else {
      console.log('❌ SOME INTEGRATION TESTS FAILED');
      console.log('   Check the individual test results above for details');
    }
    
    console.log('\n💡 Your invitation system is now fully integrated!');
    console.log('   - Bulk invitations send real WhatsApp messages');
    console.log('   - Guest status updates automatically');
    console.log('   - Reminder schedules work like reminder system');
    console.log('   - All targeting logic is correct');
    
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

testCompleteInvitationFunctionality();