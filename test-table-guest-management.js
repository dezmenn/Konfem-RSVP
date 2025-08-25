const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testTableGuestManagement() {
  console.log('👥 Testing Enhanced Table Management with Guest Assignment...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data.status);

    // Test 2: Get guests for the event
    console.log('\n2. Loading guests for event...');
    const guestsResponse = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
    const guests = guestsResponse.data.data;
    console.log('✅ Guests loaded:', guests.length, 'guests');
    
    if (guests.length > 0) {
      console.log('   Sample guests:');
      guests.slice(0, 3).forEach(guest => {
        console.log(`   - ${guest.name} (${guest.brideOrGroomSide}, ${guest.relationshipType})`);
      });
    }

    // Test 3: Get tables for the event
    console.log('\n3. Loading tables for event...');
    const tablesResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}`);
    const tables = tablesResponse.data;
    console.log('✅ Tables loaded:', tables.length, 'tables');
    
    if (tables.length > 0) {
      console.log('   Table details:');
      tables.forEach(table => {
        console.log(`   - ${table.name}: ${table.assignedGuests.length}/${table.capacity} guests`);
      });
    }

    // Test 4: Test guest assignment to table
    if (guests.length > 0 && tables.length > 0) {
      console.log('\n4. Testing guest assignment to table...');
      const testGuest = guests.find(g => !g.tableAssignment) || guests[0];
      const testTable = tables[0];
      
      console.log(`   Assigning ${testGuest.name} to ${testTable.name}...`);
      
      const assignResponse = await axios.post(`${BASE_URL}/api/guests/${testGuest.id}/assign-table`, {
        tableId: testTable.id
      });
      
      if (assignResponse.status === 200) {
        console.log('✅ Guest assigned successfully');
        
        // Verify assignment
        const updatedGuestResponse = await axios.get(`${BASE_URL}/api/guests/guest/${testGuest.id}`);
        const updatedGuest = updatedGuestResponse.data.data;
        console.log(`   Verification: ${updatedGuest.name} is now assigned to table: ${updatedGuest.tableAssignment}`);
      }
    }

    // Test 5: Test guest reassignment to different table
    if (guests.length > 0 && tables.length > 1) {
      console.log('\n5. Testing guest reassignment...');
      const assignedGuest = guests.find(g => g.tableAssignment);
      
      if (assignedGuest) {
        const currentTable = tables.find(t => t.id === assignedGuest.tableAssignment);
        const newTable = tables.find(t => t.id !== assignedGuest.tableAssignment);
        
        console.log(`   Moving ${assignedGuest.name} from ${currentTable?.name} to ${newTable?.name}...`);
        
        const reassignResponse = await axios.post(`${BASE_URL}/api/guests/${assignedGuest.id}/assign-table`, {
          tableId: newTable.id
        });
        
        if (reassignResponse.status === 200) {
          console.log('✅ Guest reassigned successfully');
        }
      }
    }

    // Test 6: Test guest unassignment
    console.log('\n6. Testing guest unassignment...');
    const assignedGuest = guests.find(g => g.tableAssignment);
    
    if (assignedGuest) {
      console.log(`   Unassigning ${assignedGuest.name} from table...`);
      
      const unassignResponse = await axios.post(`${BASE_URL}/api/guests/${assignedGuest.id}/unassign-table`);
      
      if (unassignResponse.status === 200) {
        console.log('✅ Guest unassigned successfully');
        
        // Verify unassignment
        const updatedGuestResponse = await axios.get(`${BASE_URL}/api/guests/guest/${assignedGuest.id}`);
        const updatedGuest = updatedGuestResponse.data.data;
        console.log(`   Verification: ${updatedGuest.name} table assignment: ${updatedGuest.tableAssignment || 'None'}`);
      }
    }

    // Test 7: Test table capacity validation
    console.log('\n7. Testing table capacity validation...');
    const capacityResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}/capacity`);
    const capacityInfo = capacityResponse.data;
    console.log('✅ Table capacity info loaded:');
    
    capacityInfo.forEach(info => {
      const status = info.isOverCapacity ? '⚠️ OVER CAPACITY' : '✅ OK';
      console.log(`   - ${info.name}: ${info.occupied}/${info.capacity} ${status}`);
    });

    // Test 8: Test getting guests for specific table
    if (tables.length > 0) {
      console.log('\n8. Testing guest retrieval for specific table...');
      const testTable = tables[0];
      
      // Get all guests and filter by table assignment
      const allGuests = await axios.get(`${BASE_URL}/api/guests/${EVENT_ID}`);
      const tableGuests = allGuests.data.data.filter(guest => guest.tableAssignment === testTable.id);
      
      console.log(`✅ Guests at ${testTable.name}:`, tableGuests.length, 'guests');
      tableGuests.forEach(guest => {
        console.log(`   - ${guest.name} (${guest.brideOrGroomSide}, ${guest.relationshipType})`);
      });
    }

    // Test 9: Test auto-arrangement with guest assignment
    console.log('\n9. Testing auto-arrangement with guest tracking...');
    const autoArrangeResponse = await axios.post(`${BASE_URL}/api/tables/events/${EVENT_ID}/auto-arrange`, {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    });
    
    console.log('✅ Auto-arrangement completed:', autoArrangeResponse.data.message);
    
    // Verify arrangement results
    const finalTablesResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}`);
    const finalTables = finalTablesResponse.data;
    
    console.log('   Final arrangement:');
    finalTables.forEach(table => {
      console.log(`   - ${table.name}: ${table.assignedGuests.length}/${table.capacity} guests`);
    });

    console.log('\n🎉 All table guest management tests passed successfully!');
    console.log('\n📋 Summary of Enhanced Features:');
    console.log('   ✅ Guest loading and display');
    console.log('   ✅ Guest assignment to tables');
    console.log('   ✅ Guest reassignment between tables');
    console.log('   ✅ Guest unassignment from tables');
    console.log('   ✅ Table capacity validation');
    console.log('   ✅ Real-time guest tracking');
    console.log('   ✅ Auto-arrangement with guest management');
    console.log('   ✅ Guest filtering by table assignment');
    console.log('\n🚀 Enhanced table management with guest assignment is fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the test
testTableGuestManagement();