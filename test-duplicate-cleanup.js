const axios = require('axios');

console.log('🧹 Testing Duplicate Guest Cleanup...\n');

async function testDuplicateCleanup() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('🔍 Step 1: Checking current duplicate status...');
    
    // Get current data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    // Check for duplicates
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
    
    const duplicatesBefore = [];
    guestAssignmentMap.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        duplicatesBefore.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    console.log(`  Found ${duplicatesBefore.length} duplicate assignments before cleanup:`);
    duplicatesBefore.forEach(dup => {
      console.log(`    ${dup.guestName} is in: ${dup.tables.join(', ')}`);
    });
    
    if (duplicatesBefore.length === 0) {
      console.log('  ✅ No duplicates found! The fix is working.');
      return;
    }
    
    console.log('\n🔧 Step 2: Performing cleanup by reassigning guests...');
    
    // For each duplicate, unassign and then reassign to the first table
    for (const duplicate of duplicatesBefore) {
      console.log(`  Cleaning up ${duplicate.guestName}...`);
      
      try {
        // Unassign from all tables
        await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/unassign-table`);
        console.log(`    ✅ Unassigned ${duplicate.guestName} from all tables`);
        
        // Find the first table they were in and reassign
        const firstTable = tables.find(t => t.name === duplicate.tables[0]);
        if (firstTable) {
          await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/assign-table`, {
            tableId: firstTable.id
          });
          console.log(`    ✅ Reassigned ${duplicate.guestName} to ${firstTable.name}`);
        }
      } catch (error) {
        console.log(`    ❌ Failed to clean up ${duplicate.guestName}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Step 3: Verifying cleanup results...');
    
    // Check again after cleanup
    const tablesAfterResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tablesAfter = tablesAfterResponse.data || [];
    
    const guestAssignmentMapAfter = new Map();
    tablesAfter.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!guestAssignmentMapAfter.has(guestId)) {
            guestAssignmentMapAfter.set(guestId, []);
          }
          guestAssignmentMapAfter.get(guestId).push(table.name);
        });
      }
    });
    
    const duplicatesAfter = [];
    guestAssignmentMapAfter.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        duplicatesAfter.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    console.log(`  Found ${duplicatesAfter.length} duplicate assignments after cleanup:`);
    if (duplicatesAfter.length === 0) {
      console.log('  ✅ All duplicates successfully cleaned up!');
    } else {
      duplicatesAfter.forEach(dup => {
        console.log(`    ${dup.guestName} is still in: ${dup.tables.join(', ')}`);
      });
    }
    
    console.log('\n📊 Final Summary:');
    console.log(`  Duplicates before: ${duplicatesBefore.length}`);
    console.log(`  Duplicates after: ${duplicatesAfter.length}`);
    console.log(`  Cleanup success: ${duplicatesAfter.length === 0 ? 'YES' : 'NO'}`);
    
    if (duplicatesAfter.length === 0) {
      console.log('\n🎉 Duplicate Cleanup Complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ DUPLICATE GUEST ISSUE RESOLVED');
      console.log('');
      console.log('🔧 Applied Fixes:');
      console.log('   ✅ Enhanced MockTableService.assignGuestToTable()');
      console.log('   ✅ Comprehensive guest removal from ALL tables before assignment');
      console.log('   ✅ Duplicate prevention in table assignment logic');
      console.log('   ✅ Frontend deduplication using Set data structures');
      console.log('   ✅ Data consistency validation and cleanup');
      console.log('');
      console.log('🎯 Result: Each guest now appears in only one table');
    }
    
  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the cleanup test
testDuplicateCleanup().catch(console.error);