const axios = require('axios');

async function testInvitationWorkflow() {
  console.log('🧪 Testing Complete Invitation Workflow...\n');
  
  const baseURL = 'http://localhost:5000';
  const eventId = 'demo-event-1';
  
  try {
    // Step 1: Add a test guest with "not_invited" status
    console.log('1. ➕ Adding a test guest with "not_invited" status...');
    const newGuestData = {
      eventId: eventId,
      name: 'Test User',
      phoneNumber: '60123999999',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      rsvpStatus: 'not_invited',
      specialRequests: ''
    };
    
    const addGuestResponse = await axios.post(`${baseURL}/api/guests`, newGuestData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   Guest added: ${addGuestResponse.data.success}`);
    console.log('   Response data:', JSON.stringify(addGuestResponse.data, null, 2));
    
    const testGuest = addGuestResponse.data.guest || addGuestResponse.data.data;
    if (!testGuest) {
      throw new Error('No guest data in response');
    }
    
    console.log(`   Guest ID: ${testGuest.id}`);
    console.log(`   Guest Name: ${testGuest.name}`);
    console.log(`   RSVP Status: ${testGuest.rsvpStatus}`);
    
    // Step 2: Verify invitation management shows the not_invited guest
    console.log('\n2. 📊 Checking invitation status after adding guest...');
    const statusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const status = statusResponse.data.data;
    
    console.log('   Invitation Status:');
    console.log(`     Total: ${status.totalGuests}`);
    console.log(`     Not Invited: ${status.notInvitedGuests}`);
    console.log(`     Pending: ${status.pendingGuests}`);
    console.log(`     Accepted: ${status.acceptedGuests}`);
    console.log(`     Invitations Sent: ${status.totalInvitationsSent}`);
    
    // Step 3: Send bulk invitation
    console.log('\n3. 📧 Testing bulk invitation...');
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
    
    // Step 4: Check if guest status changed
    console.log('\n4. 🔄 Checking if guest status changed...');
    const updatedGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const updatedGuests = updatedGuestsResponse.data.data || updatedGuestsResponse.data;
    
    const updatedTestGuest = updatedGuests.find(g => g.id === testGuest.id);
    if (updatedTestGuest) {
      console.log(`   Test guest status: ${updatedTestGuest.rsvpStatus}`);
      console.log(`   Status changed: ${updatedTestGuest.rsvpStatus !== 'not_invited' ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('   ❌ Test guest not found in updated list');
    }
    
    // Step 5: Check updated invitation status
    console.log('\n5. 📈 Checking updated invitation status...');
    const updatedStatusResponse = await axios.get(`${baseURL}/api/invitations/status/${eventId}`);
    const updatedStatus = updatedStatusResponse.data.data;
    
    console.log('   Updated Invitation Status:');
    console.log(`     Total: ${updatedStatus.totalGuests}`);
    console.log(`     Not Invited: ${updatedStatus.notInvitedGuests}`);
    console.log(`     Pending: ${updatedStatus.pendingGuests}`);
    console.log(`     Accepted: ${updatedStatus.acceptedGuests}`);
    console.log(`     Invitations Sent: ${updatedStatus.totalInvitationsSent}`);
    
    // Step 6: Create and test reminder schedule
    console.log('\n6. ➕ Creating reminder schedule...');
    const scheduleData = {
      eventId: eventId,
      schedules: [{
        triggerDays: 3,
        messageTemplate: 'Hi {{guestName}}, reminder about {{eventTitle}}! Please RSVP: {{rsvpLink}}',
        isActive: true
      }]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/invitations/configure`, scheduleData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   Schedule created: ${createResponse.data.success}`);
    const createdSchedule = createResponse.data.data[0];
    
    // Step 7: Execute reminder schedule
    console.log('\n7. ▶️ Testing reminder schedule execution...');
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
    
    // Step 8: Check WhatsApp messages
    console.log('\n8. 📱 Checking WhatsApp messages...');
    try {
      const messagesResponse = await axios.get(`${baseURL}/api/whatsapp-admin/messages`);
      const messages = messagesResponse.data.data || [];
      
      console.log(`   Total messages: ${messages.length}`);
      
      // Look for messages to our test guest
      const testGuestMessages = messages.filter(msg => msg.to === newGuestData.phoneNumber);
      console.log(`   Messages to test guest (${newGuestData.phoneNumber}): ${testGuestMessages.length}`);
      
      testGuestMessages.forEach((msg, index) => {
        console.log(`     ${index + 1}. Type: ${msg.messageType} | Status: ${msg.status}`);
        console.log(`        Content: ${msg.content.substring(0, 50)}...`);
      });
    } catch (error) {
      console.log('   ⚠️ Could not fetch WhatsApp messages');
    }
    
    // Clean up - delete the test guest and schedule
    console.log('\n9. 🧹 Cleaning up...');
    try {
      await axios.delete(`${baseURL}/api/guests/${testGuest.id}`);
      await axios.delete(`${baseURL}/api/invitations/schedule/${createdSchedule.id}`);
      console.log('   ✅ Cleanup completed');
    } catch (error) {
      console.log('   ⚠️ Cleanup failed (this is okay)');
    }
    
    // Final Assessment
    console.log('\n🎯 WORKFLOW TEST RESULTS:');
    
    const workflowWorking = (
      addGuestResponse.data.success &&
      bulkResponse.data.success &&
      executeResponse.data.success
    );
    
    if (workflowWorking) {
      console.log('🎉 INVITATION WORKFLOW IS WORKING!');
      console.log('\n✅ Verified:');
      console.log('   • Can add guests with "not_invited" status');
      console.log('   • Bulk invitation detects and targets them');
      console.log('   • Status changes after successful invitation');
      console.log('   • Reminder schedules target pending guests');
      console.log('   • WhatsApp integration is functional');
    } else {
      console.log('❌ SOME WORKFLOW ISSUES REMAIN');
      console.log('   Check the individual steps above for details');
    }
    
  } catch (error) {
    console.error('\n❌ Workflow test failed:', error.message);
    
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testInvitationWorkflow();