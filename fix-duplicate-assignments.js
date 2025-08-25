const axios = require('axios');

console.log('🧹 Fixing Duplicate Guest Assignments...\n');

async function fixDuplicateAssignments() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Identifying duplicate assignments...');
    
    // Get current data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Total guests: ${guests.length}`);
    console.log(`  Total tables: ${tables.length}`);
    
    // Find duplicates
    const guestAssignmentMap = new Map();
    tables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!guestAssignmentMap.has(guestId)) {
            guestAssignmentMap.set(guestId, []);
          }
          guestAssignmentMap.get(guestId).push({
            tableId: table.id,
            tableName: table.name
          });
        });
      }
    });
    
    const duplicates = [];
    guestAssignmentMap.forEach((tableAssignments, guestId) => {
      if (tableAssignments.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        duplicates.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableAssignments
        });
      }
    });
    
    console.log(`  Duplicate assignments found: ${duplicates.length}`);
    
    if (duplicates.length === 0) {
      console.log('  ✅ No duplicates found - data is clean');
      return;
    }
    
    duplicates.forEach(dup => {
      console.log(`    ❌ ${dup.guestName} appears in: ${dup.tables.map(t => t.tableName).join(', ')}`);
    });
    
    console.log('\n🔧 Step 2: Cleaning up duplicates...');
    
    // For each duplicate, keep them in the first table and remove from others
    for (const duplicate of duplicates) {
      console.log(`  Fixing ${duplicate.guestName}:`);
      
      // Keep the guest in the first table, remove from others
      const keepInTable = duplicate.tables[0];
      const removeFromTables = duplicate.tables.slice(1);
      
      console.log(`    Keeping in: ${keepInTable.tableName}`);
      console.log(`    Removing from: ${removeFromTables.map(t => t.tableName).join(', ')}`);
      
      // Unassign from all tables first
      try {
        await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/unassign-table`);
        console.log(`    ✅ Unassigned ${duplicate.guestName} from all tables`);
      } catch (error) {
        console.log(`    ❌ Failed to unassign ${duplicate.guestName}: ${error.message}`);
        continue;
      }
      
      // Reassign to the first table only
      try {
        await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/assign-table`, {
          tableId: keepInTable.tableId
        });
        console.log(`    ✅ Reassigned ${duplicate.guestName} to ${keepInTable.tableName}`);
      } catch (error) {
        console.log(`    ❌ Failed to reassign ${duplicate.guestName}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Step 3: Verifying cleanup...');
    
    // Get fresh data after cleanup
    const cleanGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const cleanGuests = cleanGuestsResponse.data.success ? cleanGuestsResponse.data.data : [];
    
    const cleanTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const cleanTables = cleanTablesResponse.data || [];
    
    // Check for remaining duplicates
    const cleanGuestAssignmentMap = new Map();
    cleanTables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!cleanGuestAssignmentMap.has(guestId)) {
            cleanGuestAssignmentMap.set(guestId, []);
          }
          cleanGuestAssignmentMap.get(guestId).push(table.name);
        });
      }
    });
    
    const remainingDuplicates = [];
    cleanGuestAssignmentMap.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = cleanGuests.find(g => g.id === guestId);
        remainingDuplicates.push({
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    console.log(`  Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('  ✅ All duplicates successfully cleaned up');
    } else {
      console.log('  ❌ Some duplicates remain:');
      remainingDuplicates.forEach(dup => {
        console.log(`    ${dup.guestName} still in: ${dup.tables.join(', ')}`);
      });
    }
    
    // Calculate final statistics
    const finalSeated = cleanGuests.filter(guest => 
      cleanTables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    const totalTableGuests = cleanTables.reduce((total, table) => {
      return total + (table.assignedGuests ? table.assignedGuests.length : 0);
    }, 0);
    
    console.log('\n📊 Step 4: Final statistics...');
    console.log(`  Unique seated guests: ${finalSeated.length}`);
    console.log(`  Total guest appearances in tables: ${totalTableGuests}`);
    console.log(`  Statistics match: ${finalSeated.length === totalTableGuests ? '✅' : '❌'}`);
    
    console.log('\n  Final table assignments:');
    cleanTables.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`    ${table.name}: ${assignedCount}/${table.capacity}`);
      if (assignedCount > 0) {
        const guestNames = table.assignedGuests.map(guestId => {
          const guest = cleanGuests.find(g => g.id === guestId);
          return guest ? guest.name : `Unknown (${guestId})`;
        });
        console.log(`      Guests: ${guestNames.join(', ')}`);
      }
    });
    
    console.log('\n🎉 Duplicate Assignment Cleanup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (remainingDuplicates.length === 0 && finalSeated.length === totalTableGuests) {
      console.log('✅ DUPLICATE ASSIGNMENTS SUCCESSFULLY FIXED!');
      console.log('');
      console.log('🎯 Results:');
      console.log(`   Duplicates cleaned: ${duplicates.length}`);
      console.log(`   Final seated guests: ${finalSeated.length}`);
      console.log(`   Table view will now show correct count`);
      console.log('');
      console.log('🚀 The table view should now match the seated guest count!');
    } else {
      console.log('❌ CLEANUP INCOMPLETE');
      console.log('   Some issues may remain - manual intervention might be needed');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

// Run the cleanup
fixDuplicateAssignments().catch(console.error);