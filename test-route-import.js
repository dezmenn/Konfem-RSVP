async function testRouteImport() {
  console.log('🔍 Testing Route Import Issues...\n');
  
  // Set environment variables for demo mode
  process.env.SKIP_DB_SETUP = 'true';
  process.env.NODE_ENV = 'development';
  
  try {
    console.log('1. Testing reminder routes import...');
    const reminderRoutes = await import('./rsvp-backend/src/routes/reminders.js');
    console.log('   ✅ Reminder routes imported successfully');
  } catch (error) {
    console.log('   ❌ Reminder routes import failed:', error.message);
  }
  
  try {
    console.log('\n2. Testing invitation routes import...');
    const invitationRoutes = await import('./rsvp-backend/src/routes/invitations.js');
    console.log('   ✅ Invitation routes imported successfully');
  } catch (error) {
    console.log('   ❌ Invitation routes import failed:', error.message);
    console.log('   Error details:', error.stack);
  }
  
  try {
    console.log('\n3. Testing InvitationService import...');
    const { InvitationService } = await import('./rsvp-backend/src/services/InvitationService.js');
    console.log('   ✅ InvitationService imported successfully');
  } catch (error) {
    console.log('   ❌ InvitationService import failed:', error.message);
    console.log('   Error details:', error.stack);
  }
  
  try {
    console.log('\n4. Testing MockInvitationScheduleRepository import...');
    const { MockInvitationScheduleRepository } = await import('./rsvp-backend/src/services/MockInvitationScheduleRepository.js');
    console.log('   ✅ MockInvitationScheduleRepository imported successfully');
  } catch (error) {
    console.log('   ❌ MockInvitationScheduleRepository import failed:', error.message);
  }
  
  console.log('\n🏁 Import test completed');
}

testRouteImport().catch(error => {
  console.error('Test failed:', error);
});