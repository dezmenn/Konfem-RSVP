// Test to verify demo data setup without needing the server
const fs = require('fs');
const path = require('path');

async function verifyDemoSetup() {
  console.log('🔍 Verifying Demo Data Setup...\n');

  try {
    // Test 1: Check if demo data file exists and has tables
    console.log('1. Checking demo data file...');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    
    if (!fs.existsSync(demoDataPath)) {
      console.log('❌ Demo data file not found at:', demoDataPath);
      return;
    }
    
    const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');
    let demoData;
    
    try {
      demoData = JSON.parse(demoDataContent);
      console.log('✅ Demo data file is valid JSON');
    } catch (error) {
      console.log('❌ Demo data file is not valid JSON:', error.message);
      return;
    }

    // Test 2: Verify tables exist
    console.log('\n2. Verifying tables in demo data...');
    
    if (!demoData.tables) {
      console.log('❌ No tables section found in demo data');
      return;
    }
    
    if (!Array.isArray(demoData.tables)) {
      console.log('❌ Tables section is not an array');
      return;
    }
    
    if (demoData.tables.length === 0) {
      console.log('❌ Tables array is empty');
      return;
    }
    
    console.log(`✅ Found ${demoData.tables.length} tables in demo data:`);
    demoData.tables.forEach((table, index) => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`   ${index + 1}. ${table.name} (ID: ${table.id})`);
      console.log(`      Capacity: ${table.capacity}, Assigned: ${assignedCount}`);
      console.log(`      Position: (${table.position.x}, ${table.position.y})`);
      console.log(`      Locked: ${table.isLocked}, Event: ${table.eventId}`);
    });

    // Test 3: Verify guests exist
    console.log('\n3. Verifying guests in demo data...');
    
    if (!demoData.guests || !Array.isArray(demoData.guests)) {
      console.log('❌ No valid guests array found');
      return;
    }
    
    console.log(`✅ Found ${demoData.guests.length} guests in demo data`);
    
    // Show first few guests
    const sampleGuests = demoData.guests.slice(0, 5);
    sampleGuests.forEach((guest, index) => {
      console.log(`   ${index + 1}. ${guest.name} (ID: ${guest.id})`);
      console.log(`      RSVP: ${guest.rsvpStatus}, Additional: ${guest.additionalGuestCount}`);
      console.log(`      Table: ${guest.tableAssignment || 'Unassigned'}`);
    });

    // Test 4: Verify venue elements exist
    console.log('\n4. Verifying venue elements in demo data...');
    
    if (!demoData.venueElements || !Array.isArray(demoData.venueElements)) {
      console.log('⚠️  No venue elements found (this is optional)');
    } else {
      console.log(`✅ Found ${demoData.venueElements.length} venue elements:`);
      demoData.venueElements.forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.name} (${element.type})`);
        console.log(`      Position: (${element.position.x}, ${element.position.y})`);
        console.log(`      Size: ${element.dimensions.width}x${element.dimensions.height}`);
      });
    }

    // Test 5: Test DemoDataService simulation
    console.log('\n5. Simulating DemoDataService operations...');
    
    // Simulate what DemoDataService.getTables() would return
    const eventId = 'demo-event-1';
    const eventTables = demoData.tables.filter(table => table.eventId === eventId);
    console.log(`✅ Tables for event ${eventId}: ${eventTables.length}`);
    
    // Simulate what DemoDataService.getGuests() would return
    const eventGuests = demoData.guests.filter(guest => guest.eventId === eventId);
    console.log(`✅ Guests for event ${eventId}: ${eventGuests.length}`);
    
    // Simulate what DemoDataService.getVenueElements() would return
    const eventVenueElements = demoData.venueElements ? 
      demoData.venueElements.filter(element => element.eventId === eventId) : [];
    console.log(`✅ Venue elements for event ${eventId}: ${eventVenueElements.length}`);

    // Test 6: Simulate export data structure
    console.log('\n6. Simulating export data structure...');
    
    // Create guest lookup map
    const guestMap = new Map(eventGuests.map(guest => [guest.id, guest]));
    
    // Transform tables with guest details (like ExportService does)
    const tablesWithGuests = eventTables.map(table => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      position: table.position,
      isLocked: table.isLocked,
      guests: (table.assignedGuests || []).map(guestId => {
        const guest = guestMap.get(guestId);
        if (!guest) {
          console.log(`⚠️  Guest ${guestId} not found for table ${table.name}`);
          return null;
        }
        return {
          id: guest.id,
          name: guest.name,
          additionalGuestCount: guest.additionalGuestCount,
          dietaryRestrictions: guest.dietaryRestrictions || [],
          specialRequests: guest.specialRequests || ''
        };
      }).filter(Boolean)
    }));
    
    console.log('✅ Export data structure created successfully:');
    console.log(`   Tables with data: ${tablesWithGuests.length}`);
    console.log(`   Tables with guests: ${tablesWithGuests.filter(t => t.guests.length > 0).length}`);
    console.log(`   Empty tables: ${tablesWithGuests.filter(t => t.guests.length === 0).length}`);
    
    // Show table details
    tablesWithGuests.forEach(table => {
      const occupiedSeats = table.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      console.log(`   ${table.name}: ${occupiedSeats}/${table.capacity} seats (${table.guests.length} guests)`);
    });

    // Test 7: Verify PDF export will work
    console.log('\n7. Verifying PDF export readiness...');
    
    if (tablesWithGuests.length > 0) {
      console.log('✅ PDF export will show table layout (NOT "No tables configured")');
      console.log(`   - ${tablesWithGuests.filter(t => t.guests.length > 0).length} occupied tables will be blue`);
      console.log(`   - ${tablesWithGuests.filter(t => t.guests.length === 0).length} empty tables will be gray`);
      console.log(`   - ${tablesWithGuests.filter(t => t.isLocked).length} locked tables will show 🔒`);
      
      if (eventVenueElements.length > 0) {
        console.log(`   - ${eventVenueElements.length} venue elements will be shown`);
      }
    } else {
      console.log('❌ PDF export will show "No tables configured" message');
    }

    console.log('\n🎉 Demo Data Verification Summary:');
    console.log('✅ Demo data file exists and is valid');
    console.log(`✅ ${demoData.tables.length} tables are configured`);
    console.log(`✅ ${demoData.guests.length} guests are available`);
    console.log(`✅ ${eventVenueElements.length} venue elements are configured`);
    console.log('✅ Export data structure can be created successfully');
    console.log('✅ PDF export should show actual tables');
    
    console.log('\n🚀 The demo data is properly configured for export functionality!');
    console.log('   If PDF export still shows "No tables configured", the issue is likely:');
    console.log('   1. Server not running in demo mode (SKIP_DB_SETUP=true)');
    console.log('   2. DemoDataService not loading the data correctly');
    console.log('   3. Mock services not being used in export routes');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the verification
verifyDemoSetup();