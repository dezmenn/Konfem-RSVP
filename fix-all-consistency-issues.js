const axios = require('axios');

console.log('🔧 Fixing All Data Consistency Issues...\n');

async function fixAllConsistencyIssues() {
  try {
    const baseURL = 'http://localhost:5000';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Analyzing all consistency issues...');
    
    // Get current data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Total guests: ${guests.length}`);
    console.log(`  Total tables: ${tables.length}`);
    
    // Find all consistency issues
    const inconsistencies = [];
    
    guests.forEach(guest => {
      const guestTableAssignment = guest.tableAssignment;
      const tablesWithGuest = tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (guestTableAssignment && tablesWithGuest.length === 0) {
        // Guest thinks they're assigned but not in any table array
        inconsistencies.push({
          type: 'guest_orphaned',
          guestId: guest.id,
          guestName: guest.name,
          guestTableAssignment: guestTableAssignment,
          actualTables: [],
          action: 'clear_guest_assignment'
        });
      } else if (!guestTableAssignment && tablesWithGuest.length > 0) {
        // Guest is in table array but doesn't know it
        inconsistencies.push({
          type: 'guest_unaware',
          guestId: guest.id,
          guestName: guest.name,
          guestTableAssignment: null,
          actualTables: tablesWithGuest,
          action: 'set_guest_assignment'
        });
      } else if (guestTableAssignment && tablesWithGuest.length > 0) {
        const matchingTable = tablesWithGuest.find(t => t.id === guestTableAssignment);
        if (!matchingTable) {
          // Guest thinks they're in one table but actually in another
          inconsistencies.push({
            type: 'guest_confused',
            guestId: guest.id,
            guestName: guest.name,
            guestTableAssignment: guestTableAssignment,
            actualTables: tablesWithGuest,
            action: 'fix_guest_assignment'
          });
        }
      }
    });
    
    console.log(`\n  Found ${inconsistencies.length} consistency issues:`);
    inconsistencies.forEach((issue, index) => {
      console.log(`    ${index + 1}. ${issue.guestName} (${issue.type}):`);
      if (issue.type === 'guest_orphaned') {
        console.log(`       Guest thinks: "${issue.guestTableAssignment}" | Actually in: none`);
      } else if (issue.type === 'guest_unaware') {
        console.log(`       Guest thinks: none | Actually in: ${issue.actualTables.map(t => t.name).join(', ')}`);
      } else if (issue.type === 'guest_confused') {
        console.log(`       Guest thinks: "${issue.guestTableAssignment}" | Actually in: ${issue.actualTables.map(t => t.name).join(', ')}`);
      }
    });
    
    console.log('\n🔧 Step 2: Fixing each consistency issue...');
    
    for (let i = 0; i < inconsistencies.length; i++) {
      const issue = inconsistencies[i];
      console.log(`\n  Fixing ${i + 1}/${inconsistencies.length}: ${issue.guestName}`);
      
      try {
        if (issue.action === 'clear_guest_assignment') {
          // Guest thinks they're assigned but not in any table - clear their assignment
          console.log(`    Clearing orphaned assignment for ${issue.guestName}`);
          await axios.post(`${baseURL}/api/guests/${issue.guestId}/unassign-table`);
          console.log(`    ✅ Cleared assignment`);
          
        } else if (issue.action === 'set_guest_assignment') {
          // Guest is in table but doesn't know it - set their assignment
          const targetTable = issue.actualTables[0]; // Use first table if multiple
          console.log(`    Setting assignment for ${issue.guestName} to ${targetTable.name}`);
          await axios.post(`${baseURL}/api/guests/${issue.guestId}/assign-table`, {
            tableId: targetTable.id
          });
          console.log(`    ✅ Set assignment to ${targetTable.name}`);
          
        } else if (issue.action === 'fix_guest_assignment') {
          // Guest thinks they're in wrong table - fix their assignment
          const correctTable = issue.actualTables[0]; // Use first table if multiple
          console.log(`    Correcting assignment for ${issue.guestName} to ${correctTable.name}`);
          await axios.post(`${baseURL}/api/guests/${issue.guestId}/assign-table`, {
            tableId: correctTable.id
          });
          console.log(`    ✅ Corrected assignment to ${correctTable.name}`);
        }
        
        // Small delay to ensure data propagation
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`    ❌ Failed to fix ${issue.guestName}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Step 3: Verifying all fixes...');
    
    // Get fresh data after all fixes
    const finalGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const finalGuests = finalGuestsResponse.data.success ? finalGuestsResponse.data.data : [];
    
    const finalTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const finalTables = finalTablesResponse.data || [];
    
    // Check for remaining consistency issues
    const remainingIssues = [];
    
    finalGuests.forEach(guest => {
      const guestTableAssignment = guest.tableAssignment;
      const tablesWithGuest = finalTables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (guestTableAssignment && tablesWithGuest.length === 0) {
        remainingIssues.push(`${guest.name}: guest.tableAssignment="${guestTableAssignment}" but not in any table.assignedGuests`);
      } else if (!guestTableAssignment && tablesWithGuest.length > 0) {
        remainingIssues.push(`${guest.name}: in ${tablesWithGuest.map(t => t.name).join(', ')} but guest.tableAssignment is empty`);
      } else if (guestTableAssignment && tablesWithGuest.length > 0) {
        const matchingTable = tablesWithGuest.find(t => t.id === guestTableAssignment);
        if (!matchingTable) {
          remainingIssues.push(`${guest.name}: guest.tableAssignment="${guestTableAssignment}" but in ${tablesWithGuest.map(t => t.name).join(', ')}`);
        }
      }
    });
    
    console.log(`  Remaining consistency issues: ${remainingIssues.length}`);
    if (remainingIssues.length > 0) {
      remainingIssues.forEach(issue => {
        console.log(`    ⚠️  ${issue}`);
      });
    } else {
      console.log('  ✅ All consistency issues resolved!');
    }
    
    console.log('\n📊 Step 4: Final statistics and table view...');
    
    // Calculate final statistics
    const seatedGuests = finalGuests.filter(guest => 
      finalTables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    const totalTableGuests = finalTables.reduce((total, table) => {
      return total + (table.assignedGuests ? table.assignedGuests.length : 0);
    }, 0);
    
    console.log('  Final Statistics:');
    console.log(`    Unique seated guests: ${seatedGuests.length}`);
    console.log(`    Total guest appearances in tables: ${totalTableGuests}`);
    console.log(`    Statistics match: ${seatedGuests.length === totalTableGuests ? '✅' : '❌'}`);
    
    console.log('\n  Final table breakdown (what UI should show):');
    finalTables.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      if (assignedCount > 0) {
        const guestNames = table.assignedGuests.map(guestId => {
          const guest = finalGuests.find(g => g.id === guestId);
          return guest ? guest.name : `Unknown (${guestId})`;
        });
        console.log(`    ${table.name}: ${assignedCount}/${table.capacity} - [${guestNames.join(', ')}]`);
      } else {
        console.log(`    ${table.name}: 0/${table.capacity} - [empty]`);
      }
    });
    
    console.log(`\n  UI Statistics should show:`);
    console.log(`    Total Guests: ${finalGuests.length}`);
    console.log(`    Seated: ${seatedGuests.length}`);
    console.log(`    Unseated: ${finalGuests.length - seatedGuests.length}`);
    console.log(`    Tables: ${finalTables.length}`);
    
    console.log('\n🎉 Consistency Fix Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (remainingIssues.length === 0 && seatedGuests.length === totalTableGuests) {
      console.log('✅ ALL CONSISTENCY ISSUES SUCCESSFULLY FIXED!');
      console.log('');
      console.log('🎯 Results:');
      console.log(`   Fixed consistency issues: ${inconsistencies.length}`);
      console.log(`   Remaining issues: 0`);
      console.log(`   Data synchronization: Perfect`);
      console.log('');
      console.log('🚀 The UI should now display correctly!');
      console.log('   - No duplicate guests in tables');
      console.log('   - Seated count matches table view exactly');
      console.log('   - All guest assignments are consistent');
      console.log('   - Both guest.tableAssignment and table.assignedGuests are in sync');
      
    } else {
      console.log('❌ SOME ISSUES REMAIN');
      console.log(`   Remaining consistency issues: ${remainingIssues.length}`);
      console.log(`   Statistics match: ${seatedGuests.length === totalTableGuests ? 'YES' : 'NO'}`);
      console.log('   Additional manual intervention may be required.');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please check if it\'s running on port 5000');
    } else {
      console.error('❌ Fix failed:', error.message);
    }
  }
}

// Run the comprehensive fix
fixAllConsistencyIssues().catch(console.error);