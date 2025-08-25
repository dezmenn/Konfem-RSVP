const axios = require('axios');

console.log('🔍 Debugging Table View Display Issue...\n');

async function debugTableViewIssue() {
  try {
    const baseURL = 'http://localhost:5000';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Getting current data state...');
    
    // Get fresh data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Total guests: ${guests.length}`);
    console.log(`  Total tables: ${tables.length}`);
    
    console.log('\n🔍 Step 2: Analyzing seated guest count (Auto Arrangement logic)...');
    
    // Simulate the AutoTableArrangement categorizeGuests logic
    const seated = guests.filter(guest => 
      tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    const unseated = guests.filter(guest => 
      !tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    console.log(`  Seated guests (using table.assignedGuests): ${seated.length}`);
    console.log(`  Unseated guests: ${unseated.length}`);
    
    console.log('\n  Seated guests list:');
    seated.forEach((guest, index) => {
      const assignedTable = tables.find(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      console.log(`    ${index + 1}. ${guest.name} -> ${assignedTable ? assignedTable.name : 'Unknown table'}`);
    });
    
    console.log('\n🔍 Step 3: Analyzing table view display (getGuestsByTable logic)...');
    
    // Simulate the getGuestsByTable logic for each table
    tables.forEach(table => {
      console.log(`\n  ${table.name} (${table.id}):`);
      console.log(`    Capacity: ${table.capacity}`);
      console.log(`    assignedGuests array: [${table.assignedGuests ? table.assignedGuests.join(', ') : 'empty'}]`);
      
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        console.log(`    Guests in this table:`);
        table.assignedGuests.forEach((guestId, index) => {
          const guest = guests.find(g => g.id === guestId);
          console.log(`      ${index + 1}. ${guest ? guest.name : `Unknown (${guestId})`}`);
        });
      } else {
        console.log(`    No guests assigned`);
      }
    });
    
    console.log('\n🔍 Step 4: Checking for duplicate assignments...');
    
    // Check for guests appearing in multiple tables
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
    
    const duplicates = [];
    guestAssignmentMap.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        duplicates.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    console.log(`  Duplicate assignments found: ${duplicates.length}`);
    if (duplicates.length > 0) {
      duplicates.forEach(dup => {
        console.log(`    ❌ ${dup.guestName} appears in: ${dup.tables.join(', ')}`);
      });
    } else {
      console.log(`    ✅ No duplicate assignments found`);
    }
    
    console.log('\n🔍 Step 5: Calculating expected vs actual counts...');
    
    // Count total guest appearances in tables
    let totalGuestAppearances = 0;
    tables.forEach(table => {
      if (table.assignedGuests) {
        totalGuestAppearances += table.assignedGuests.length;
      }
    });
    
    console.log(`  Total guest appearances in tables: ${totalGuestAppearances}`);
    console.log(`  Unique seated guests: ${seated.length}`);
    console.log(`  Expected table view guests: ${seated.length}`);
    console.log(`  Actual table view guests: ${totalGuestAppearances}`);
    console.log(`  Match: ${seated.length === totalGuestAppearances ? '✅' : '❌'}`);
    
    if (seated.length !== totalGuestAppearances) {
      const difference = totalGuestAppearances - seated.length;
      console.log(`  Difference: ${difference} (likely due to duplicates)`);
    }
    
    console.log('\n🔍 Step 6: Checking data consistency...');
    
    // Check if guest.tableAssignment matches table.assignedGuests
    const inconsistencies = [];
    guests.forEach(guest => {
      const guestTableAssignment = guest.tableAssignment;
      const tablesWithGuest = tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (guestTableAssignment && tablesWithGuest.length === 0) {
        inconsistencies.push(`${guest.name}: guest.tableAssignment="${guestTableAssignment}" but not in any table.assignedGuests`);
      } else if (!guestTableAssignment && tablesWithGuest.length > 0) {
        inconsistencies.push(`${guest.name}: in ${tablesWithGuest.map(t => t.name).join(', ')} but guest.tableAssignment is empty`);
      } else if (guestTableAssignment && tablesWithGuest.length > 0) {
        const matchingTable = tablesWithGuest.find(t => t.id === guestTableAssignment);
        if (!matchingTable) {
          inconsistencies.push(`${guest.name}: guest.tableAssignment="${guestTableAssignment}" but in ${tablesWithGuest.map(t => t.name).join(', ')}`);
        }
      }
    });
    
    console.log(`  Data consistency issues: ${inconsistencies.length}`);
    if (inconsistencies.length > 0) {
      inconsistencies.forEach(issue => {
        console.log(`    ⚠️  ${issue}`);
      });
    } else {
      console.log(`    ✅ Data is consistent between guest and table records`);
    }
    
    console.log('\n🎉 Table View Debug Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (duplicates.length === 0 && seated.length === totalGuestAppearances && inconsistencies.length === 0) {
      console.log('✅ TABLE VIEW IS DISPLAYING CORRECTLY');
      console.log('   The seated count matches the table view display.');
    } else {
      console.log('❌ TABLE VIEW HAS DISPLAY ISSUES');
      console.log('');
      console.log('🔧 Issues Found:');
      if (duplicates.length > 0) {
        console.log(`   ❌ ${duplicates.length} guests appear in multiple tables`);
      }
      if (seated.length !== totalGuestAppearances) {
        console.log(`   ❌ Seated count (${seated.length}) doesn't match table display (${totalGuestAppearances})`);
      }
      if (inconsistencies.length > 0) {
        console.log(`   ❌ ${inconsistencies.length} data consistency issues between guest and table records`);
      }
      
      console.log('');
      console.log('💡 Recommended Fixes:');
      console.log('   1. Clean up duplicate guest assignments');
      console.log('   2. Ensure data synchronization between guest.tableAssignment and table.assignedGuests');
      console.log('   3. Run backend data synchronization method');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else {
      console.error('❌ Debug failed:', error.message);
    }
  }
}

// Run the debug
debugTableViewIssue().catch(console.error);