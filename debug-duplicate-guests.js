const axios = require('axios');

console.log('🔍 Debugging Duplicate Guest Assignments...\n');

async function debugDuplicateGuests() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('📋 Fetching current data state...');
    
    // Get guests data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    // Get tables data
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`\n📊 Data Summary:`);
    console.log(`  Total Guests: ${guests.length}`);
    console.log(`  Total Tables: ${tables.length}`);
    
    // Check for Robert Wilson specifically
    const robertWilson = guests.filter(guest => 
      guest.name.toLowerCase().includes('robert') && guest.name.toLowerCase().includes('wilson')
    );
    
    console.log(`\n🔍 Robert Wilson Analysis:`);
    console.log(`  Found ${robertWilson.length} guest(s) named Robert Wilson:`);
    
    robertWilson.forEach((guest, index) => {
      console.log(`    Guest ${index + 1}:`);
      console.log(`      ID: ${guest.id}`);
      console.log(`      Name: ${guest.name}`);
      console.log(`      Table Assignment: ${guest.tableAssignment || 'None'}`);
      console.log(`      Bride/Groom Side: ${guest.brideOrGroomSide}`);
      console.log(`      Relationship: ${guest.relationshipType}`);
    });
    
    // Check which tables have Robert Wilson in their assignedGuests array
    console.log(`\n🏓 Table Assignment Analysis:`);
    tables.forEach(table => {
      const robertInTable = robertWilson.filter(guest => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (robertInTable.length > 0) {
        console.log(`  ${table.name} (${table.id}):`);
        console.log(`    Capacity: ${table.capacity}`);
        console.log(`    Assigned Guests: ${table.assignedGuests ? table.assignedGuests.length : 0}`);
        console.log(`    Robert Wilson instances: ${robertInTable.length}`);
        
        robertInTable.forEach(guest => {
          console.log(`      - ${guest.name} (${guest.id})`);
        });
      }
    });
    
    // Check for duplicate guest IDs across all tables
    console.log(`\n🔄 Duplicate Detection Across All Tables:`);
    const guestAssignmentMap = new Map();
    
    tables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!guestAssignmentMap.has(guestId)) {
            guestAssignmentMap.set(guestId, []);
          }
          guestAssignmentMap.get(guestId).push(table.name);
        });
      }
    });
    
    // Find guests assigned to multiple tables
    const duplicateAssignments = [];
    guestAssignmentMap.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        duplicateAssignments.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    if (duplicateAssignments.length > 0) {
      console.log(`  ❌ Found ${duplicateAssignments.length} duplicate assignment(s):`);
      duplicateAssignments.forEach(dup => {
        console.log(`    ${dup.guestName} (${dup.guestId}) is assigned to: ${dup.tables.join(', ')}`);
      });
    } else {
      console.log(`  ✅ No duplicate assignments found in table data`);
    }
    
    // Check for inconsistencies between guest.tableAssignment and table.assignedGuests
    console.log(`\n🔀 Data Consistency Check:`);
    const inconsistencies = [];
    
    guests.forEach(guest => {
      if (guest.tableAssignment) {
        const assignedTable = tables.find(t => t.id === guest.tableAssignment);
        if (assignedTable) {
          const isInTableArray = assignedTable.assignedGuests && assignedTable.assignedGuests.includes(guest.id);
          if (!isInTableArray) {
            inconsistencies.push({
              guest: guest.name,
              guestId: guest.id,
              guestSaysTable: guest.tableAssignment,
              tableName: assignedTable.name,
              inTableArray: false
            });
          }
        }
      }
    });
    
    if (inconsistencies.length > 0) {
      console.log(`  ⚠️  Found ${inconsistencies.length} inconsistency(ies):`);
      inconsistencies.forEach(inc => {
        console.log(`    ${inc.guest}: guest.tableAssignment="${inc.guestSaysTable}" but not in ${inc.tableName}.assignedGuests`);
      });
    } else {
      console.log(`  ✅ Guest assignments are consistent with table data`);
    }
    
    // Suggest fixes
    console.log(`\n💡 Suggested Fixes:`);
    if (duplicateAssignments.length > 0) {
      console.log(`  1. Clean up duplicate assignments in table data`);
      console.log(`  2. Ensure each guest appears in only one table's assignedGuests array`);
    }
    if (inconsistencies.length > 0) {
      console.log(`  3. Sync guest.tableAssignment with table.assignedGuests arrays`);
    }
    console.log(`  4. Use a single source of truth (preferably table.assignedGuests)`);
    console.log(`  5. Add validation to prevent duplicate assignments`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the debug
debugDuplicateGuests().catch(console.error);