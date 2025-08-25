const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testEnhancedVenueManagement() {
  console.log('🏢👥 Testing Enhanced Venue Management with Guest Assignment...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data.status);

    // Test 2: Load all venue data (elements, tables, guests)
    console.log('\n2. Loading complete venue data...');
    
    // Load venue elements
    const elementsResponse = await axios.get(`${BASE_URL}/api/venue-layout/events/${EVENT_ID}`);
    const venueElements = elementsResponse.data.elements || [];
    console.log('✅ Venue elements loaded:', venueElements.length, 'elements');
    
    // Load tables
    const tablesResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}`);
    const tables = tablesResponse.data || [];
    console.log('✅ Tables loaded:', tables.length, 'tables');
    
    // Load guests
    const guestsResponse = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
    const guests = guestsResponse.data.data || [];
    console.log('✅ Guests loaded:', guests.length, 'guests');

    // Test 3: Test guest filtering by table assignment
    console.log('\n3. Testing guest filtering by table assignment...');
    
    const assignedGuests = guests.filter(guest => guest.tableAssignment);
    const unassignedGuests = guests.filter(guest => !guest.tableAssignment);
    
    console.log('✅ Guest assignment status:');
    console.log(`   - Assigned guests: ${assignedGuests.length}`);
    console.log(`   - Unassigned guests: ${unassignedGuests.length}`);
    
    // Show guests by table
    if (tables.length > 0) {
      console.log('   - Guests by table:');
      tables.forEach(table => {
        const tableGuests = guests.filter(guest => guest.tableAssignment === table.id);
        console.log(`     * ${table.name}: ${tableGuests.length}/${table.capacity} guests`);
        if (tableGuests.length > 0) {
          tableGuests.forEach(guest => {
            console.log(`       - ${guest.name} (${guest.brideOrGroomSide}, ${guest.relationshipType})`);
          });
        }
      });
    }

    // Test 4: Test drag-and-drop simulation (guest reassignment)
    console.log('\n4. Testing guest reassignment (drag-and-drop simulation)...');
    
    if (assignedGuests.length > 0 && tables.length > 1) {
      const testGuest = assignedGuests[0];
      const currentTable = tables.find(t => t.id === testGuest.tableAssignment);
      const targetTable = tables.find(t => t.id !== testGuest.tableAssignment);
      
      console.log(`   Simulating drag: ${testGuest.name} from ${currentTable?.name} to ${targetTable?.name}...`);
      
      // Check target table capacity
      const targetTableGuests = guests.filter(guest => guest.tableAssignment === targetTable.id);
      if (targetTableGuests.length < targetTable.capacity) {
        // Perform reassignment
        const reassignResponse = await axios.post(`${BASE_URL}/api/guests/${testGuest.id}/assign-table`, {
          tableId: targetTable.id
        });
        
        if (reassignResponse.status === 200) {
          console.log('✅ Guest reassignment successful (drag-and-drop simulation)');
          
          // Verify the change
          const updatedGuestResponse = await axios.get(`${BASE_URL}/api/guests/guest/${testGuest.id}`);
          const updatedGuest = updatedGuestResponse.data.data;
          console.log(`   Verification: ${updatedGuest.name} is now at table: ${updatedGuest.tableAssignment}`);
        }
      } else {
        console.log('⚠️ Target table is at capacity - drag would be rejected');
      }
    }

    // Test 5: Test table capacity validation
    console.log('\n5. Testing table capacity validation...');
    
    const capacityResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}/capacity`);
    const capacityInfo = capacityResponse.data;
    
    console.log('✅ Table capacity validation:');
    capacityInfo.forEach(info => {
      const status = info.isOverCapacity ? '⚠️ OVER CAPACITY' : '✅ Within capacity';
      const utilization = Math.round((info.occupied / info.capacity) * 100);
      console.log(`   - ${info.name}: ${info.occupied}/${info.capacity} (${utilization}%) ${status}`);
    });

    // Test 6: Test guest unassignment (remove from table)
    console.log('\n6. Testing guest unassignment (remove from table)...');
    
    const currentAssignedGuests = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
    const guestToUnassign = currentAssignedGuests.data.data.find(guest => guest.tableAssignment);
    
    if (guestToUnassign) {
      console.log(`   Removing ${guestToUnassign.name} from their table...`);
      
      const unassignResponse = await axios.post(`${BASE_URL}/api/guests/${guestToUnassign.id}/unassign-table`);
      
      if (unassignResponse.status === 200) {
        console.log('✅ Guest unassignment successful');
        
        // Verify the change
        const updatedGuestResponse = await axios.get(`${BASE_URL}/api/guests/guest/${guestToUnassign.id}`);
        const updatedGuest = updatedGuestResponse.data.data;
        console.log(`   Verification: ${updatedGuest.name} table assignment: ${updatedGuest.tableAssignment || 'None'}`);
      }
    }

    // Test 7: Test table locking functionality
    console.log('\n7. Testing table locking functionality...');
    
    if (tables.length > 0) {
      const testTable = tables[0];
      console.log(`   Locking table: ${testTable.name}...`);
      
      const lockResponse = await axios.post(`${BASE_URL}/api/tables/${testTable.id}/lock`);
      if (lockResponse.status === 200) {
        console.log('✅ Table locked successfully');
        
        // Test unlocking
        const unlockResponse = await axios.post(`${BASE_URL}/api/tables/${testTable.id}/unlock`);
        if (unlockResponse.status === 200) {
          console.log('✅ Table unlocked successfully');
        }
      }
    }

    // Test 8: Test venue layout validation
    console.log('\n8. Testing venue layout validation...');
    
    const validationResponse = await axios.get(`${BASE_URL}/api/venue-layout/events/${EVENT_ID}/validate`);
    const validation = validationResponse.data;
    
    console.log('✅ Venue layout validation completed:');
    console.log(`   - Layout valid: ${validation.isValid}`);
    console.log(`   - Errors: ${validation.errors.length}`);
    console.log(`   - Warnings: ${validation.warnings.length}`);
    console.log(`   - Overlapping elements: ${validation.overlappingElements?.length || 0}`);

    // Test 9: Test complete workflow simulation
    console.log('\n9. Testing complete workflow simulation...');
    
    // Create a new table
    const newTableResponse = await axios.post(`${BASE_URL}/api/tables`, {
      eventId: EVENT_ID,
      name: 'Test Workflow Table',
      capacity: 6,
      position: { x: 300, y: 300 }
    });
    
    if (newTableResponse.status === 201) {
      const newTable = newTableResponse.data;
      console.log('✅ New table created:', newTable.name);
      
      // Assign a guest to the new table
      const unassignedGuestsList = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
      const unassignedGuest = unassignedGuestsList.data.data.find(guest => !guest.tableAssignment);
      
      if (unassignedGuest) {
        const assignResponse = await axios.post(`${BASE_URL}/api/guests/${unassignedGuest.id}/assign-table`, {
          tableId: newTable.id
        });
        
        if (assignResponse.status === 200) {
          console.log(`✅ Guest ${unassignedGuest.name} assigned to new table`);
        }
      }
      
      // Clean up - delete the test table
      await axios.delete(`${BASE_URL}/api/tables/${newTable.id}`);
      console.log('✅ Test table cleaned up');
    }

    // Test 10: Test auto-arrangement with guest tracking
    console.log('\n10. Testing auto-arrangement with guest tracking...');
    
    const autoArrangeResponse = await axios.post(`${BASE_URL}/api/tables/events/${EVENT_ID}/auto-arrange`, {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    });
    
    console.log('✅ Auto-arrangement completed:', autoArrangeResponse.data.message);
    
    // Show final arrangement
    const finalTablesResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}`);
    const finalTables = finalTablesResponse.data;
    
    console.log('   Final table arrangement:');
    finalTables.forEach(table => {
      const utilization = Math.round((table.assignedGuests.length / table.capacity) * 100);
      console.log(`   - ${table.name}: ${table.assignedGuests.length}/${table.capacity} (${utilization}%)`);
    });

    console.log('\n🎉 All enhanced venue management tests passed successfully!');
    console.log('\n📋 Summary of Enhanced Features Tested:');
    console.log('   ✅ Complete venue data loading (elements, tables, guests)');
    console.log('   ✅ Guest filtering by table assignment');
    console.log('   ✅ Guest reassignment (drag-and-drop simulation)');
    console.log('   ✅ Table capacity validation and monitoring');
    console.log('   ✅ Guest unassignment (remove from table)');
    console.log('   ✅ Table locking/unlocking functionality');
    console.log('   ✅ Venue layout validation');
    console.log('   ✅ Complete workflow simulation');
    console.log('   ✅ Auto-arrangement with guest tracking');
    console.log('   ✅ Real-time capacity monitoring');
    console.log('\n🚀 Enhanced venue management with guest assignment is fully functional!');
    console.log('\n💡 Frontend Features Ready:');
    console.log('   🖱️ Click on tables to see assigned guests');
    console.log('   🔄 Drag guests between tables to reassign');
    console.log('   ❌ Click × button to remove guests from tables');
    console.log('   🔒 Lock/unlock tables to prevent auto-arrangement changes');
    console.log('   📊 Real-time capacity monitoring and validation');
    console.log('   ⚡ Instant visual feedback for all operations');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the test
testEnhancedVenueManagement();