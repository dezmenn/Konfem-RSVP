// Test script to verify guest-table linking functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testGuestTableLinking() {
  console.log('🔗 Testing Guest-Table Linking...\n');

  try {
    // 1. Get initial guests and tables
    console.log('1. Fetching initial data...');
    const [guestsResponse, tablesResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/guests/events/${EVENT_ID}`),
      fetch(`${BASE_URL}/api/tables/events/${EVENT_ID}`)
    ]);

    if (!guestsResponse.ok || !tablesResponse.ok) {
      throw new Error('Failed to fetch initial data');
    }

    const guests = await guestsResponse.json();
    const tables = await tablesResponse.json();

    console.log(`   ✅ Found ${guests.length} guests`);
    console.log(`   ✅ Found ${tables.length} tables`);

    // Show initial state
    console.log('\n📊 Initial State:');
    const assignedGuests = guests.filter(g => g.tableAssignment);
    const unassignedGuests = guests.filter(g => !g.tableAssignment);
    console.log(`   Assigned guests: ${assignedGuests.length}`);
    console.log(`   Unassigned guests: ${unassignedGuests.length}`);

    // Show table occupancy
    console.log('\n🪑 Table Occupancy:');
    tables.forEach(table => {
      const occupancy = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`   ${table.name}: ${occupancy}/${table.capacity} guests`);
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        const tableGuestNames = guests
          .filter(g => table.assignedGuests.includes(g.id))
          .map(g => g.name);
        console.log(`     Guests: ${tableGuestNames.join(', ')}`);
      }
    });

    // 2. Test manual guest assignment
    if (unassignedGuests.length > 0 && tables.length > 0) {
      console.log('\n2. Testing manual guest assignment...');
      const testGuest = unassignedGuests[0];
      const testTable = tables[0];

      console.log(`   Assigning ${testGuest.name} to ${testTable.name}...`);
      
      const assignResponse = await fetch(`${BASE_URL}/api/guests/${testGuest.id}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: testTable.id })
      });

      if (assignResponse.ok) {
        console.log('   ✅ Assignment successful');

        // Verify the assignment
        const [updatedGuestsResponse, updatedTablesResponse] = await Promise.all([
          fetch(`${BASE_URL}/api/guests/events/${EVENT_ID}`),
          fetch(`${BASE_URL}/api/tables/events/${EVENT_ID}`)
        ]);

        const updatedGuests = await updatedGuestsResponse.json();
        const updatedTables = await updatedTablesResponse.json();

        const updatedGuest = updatedGuests.find(g => g.id === testGuest.id);
        const updatedTable = updatedTables.find(t => t.id === testTable.id);

        console.log(`   Guest tableAssignment: ${updatedGuest.tableAssignment}`);
        console.log(`   Table assignedGuests: [${updatedTable.assignedGuests.join(', ')}]`);

        if (updatedGuest.tableAssignment === testTable.id && 
            updatedTable.assignedGuests.includes(testGuest.id)) {
          console.log('   ✅ Bidirectional linking verified!');
        } else {
          console.log('   ❌ Bidirectional linking failed!');
        }
      } else {
        console.log('   ❌ Assignment failed');
      }
    }

    // 3. Test auto-arrangement
    console.log('\n3. Testing auto-arrangement...');
    
    const autoArrangeResponse = await fetch(`${BASE_URL}/api/tables/events/${EVENT_ID}/auto-arrange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respectRelationships: true,
        balanceBrideGroomSides: true,
        keepFamiliesTogether: true,
        maxGuestsPerTable: 8
      })
    });

    if (autoArrangeResponse.ok) {
      const result = await autoArrangeResponse.json();
      console.log(`   ✅ ${result.message}`);

      // Verify auto-arrangement results
      const [finalGuestsResponse, finalTablesResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/guests/events/${EVENT_ID}`),
        fetch(`${BASE_URL}/api/tables/events/${EVENT_ID}`)
      ]);

      const finalGuests = await finalGuestsResponse.json();
      const finalTables = await finalTablesResponse.json();

      console.log('\n📊 Final State After Auto-Arrangement:');
      const finalAssigned = finalGuests.filter(g => g.tableAssignment);
      const finalUnassigned = finalGuests.filter(g => !g.tableAssignment);
      console.log(`   Assigned guests: ${finalAssigned.length}`);
      console.log(`   Unassigned guests: ${finalUnassigned.length}`);

      console.log('\n🪑 Final Table Occupancy:');
      finalTables.forEach(table => {
        const occupancy = table.assignedGuests ? table.assignedGuests.length : 0;
        console.log(`   ${table.name}: ${occupancy}/${table.capacity} guests`);
        if (table.assignedGuests && table.assignedGuests.length > 0) {
          const tableGuestNames = finalGuests
            .filter(g => table.assignedGuests.includes(g.id))
            .map(g => g.name);
          console.log(`     Guests: ${tableGuestNames.join(', ')}`);
        }
      });

      // Verify consistency
      console.log('\n🔍 Verifying data consistency...');
      let consistencyErrors = 0;

      finalGuests.forEach(guest => {
        if (guest.tableAssignment) {
          const assignedTable = finalTables.find(t => t.id === guest.tableAssignment);
          if (!assignedTable) {
            console.log(`   ❌ Guest ${guest.name} assigned to non-existent table ${guest.tableAssignment}`);
            consistencyErrors++;
          } else if (!assignedTable.assignedGuests.includes(guest.id)) {
            console.log(`   ❌ Guest ${guest.name} not in table ${assignedTable.name}'s assignedGuests array`);
            consistencyErrors++;
          }
        }
      });

      finalTables.forEach(table => {
        if (table.assignedGuests) {
          table.assignedGuests.forEach(guestId => {
            const guest = finalGuests.find(g => g.id === guestId);
            if (!guest) {
              console.log(`   ❌ Table ${table.name} references non-existent guest ${guestId}`);
              consistencyErrors++;
            } else if (guest.tableAssignment !== table.id) {
              console.log(`   ❌ Guest ${guest.name} in table ${table.name}'s array but tableAssignment is ${guest.tableAssignment}`);
              consistencyErrors++;
            }
          });
        }
      });

      if (consistencyErrors === 0) {
        console.log('   ✅ All data is consistent!');
      } else {
        console.log(`   ❌ Found ${consistencyErrors} consistency errors`);
      }

    } else {
      const error = await autoArrangeResponse.text();
      console.log(`   ❌ Auto-arrangement failed: ${error}`);
    }

    console.log('\n🎉 Guest-Table Linking Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGuestTableLinking();