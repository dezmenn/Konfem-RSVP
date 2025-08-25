const axios = require('axios');

console.log('🎯 Fixing Robert Wilson Assignment Inconsistency...\n');

async function fixRobertWilsonAssignment() {
  try {
    const baseURL = 'http://localhost:5000';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Analyzing Robert Wilson\'s current state...');
    
    // Get current data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    // Find Robert Wilson
    const robertWilson = guests.find(guest => 
      guest.name.toLowerCase().includes('robert') && guest.name.toLowerCase().includes('wilson')
    );
    
    if (!robertWilson) {
      console.log('❌ Robert Wilson not found');
      return;
    }
    
    console.log(`  Robert Wilson ID: ${robertWilson.id}`);
    console.log(`  guest.tableAssignment: ${robertWilson.tableAssignment || 'none'}`);
    
    // Check which tables have Robert Wilson in their assignedGuests array
    const tablesWithRobert = tables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(robertWilson.id)
    );
    
    console.log(`  Appears in table arrays: ${tablesWithRobert.length}`);
    tablesWithRobert.forEach(table => {
      console.log(`    - ${table.name} (${table.id})`);
    });
    
    // Check the table he thinks he's assigned to
    const assignedTable = tables.find(t => t.id === robertWilson.tableAssignment);
    if (assignedTable) {
      const isInAssignedTable = assignedTable.assignedGuests && assignedTable.assignedGuests.includes(robertWilson.id);
      console.log(`  Table he thinks he's in: ${assignedTable.name}`);
      console.log(`  Actually in that table's array: ${isInAssignedTable ? 'YES' : 'NO'}`);
    }
    
    console.log('\n🔧 Step 2: Fixing the inconsistency...');
    
    if (tablesWithRobert.length === 1) {
      // Robert is in exactly one table array, update his tableAssignment to match
      const correctTable = tablesWithRobert[0];
      console.log(`  Updating Robert's tableAssignment to match actual table: ${correctTable.name}`);
      
      try {
        // Use the assign-table endpoint to fix the assignment
        await axios.post(`${baseURL}/api/guests/${robertWilson.id}/assign-table`, {
          tableId: correctTable.id
        });
        console.log('  ✅ Assignment updated successfully');
      } catch (error) {
        console.log(`  ❌ Failed to update assignment: ${error.message}`);
      }
    } else if (tablesWithRobert.length === 0) {
      // Robert is not in any table array, clear his tableAssignment
      console.log('  Robert is not in any table array, clearing his tableAssignment');
      
      try {
        await axios.post(`${baseURL}/api/guests/${robertWilson.id}/unassign-table`);
        console.log('  ✅ Assignment cleared successfully');
      } catch (error) {
        console.log(`  ❌ Failed to clear assignment: ${error.message}`);
      }
    } else {
      // Robert is in multiple table arrays (shouldn't happen but let's handle it)
      console.log('  ❌ Robert is in multiple table arrays - this should not happen');
      
      // Keep him in the first table only
      const keepTable = tablesWithRobert[0];
      console.log(`  Keeping Robert in: ${keepTable.name}`);
      
      try {
        await axios.post(`${baseURL}/api/guests/${robertWilson.id}/unassign-table`);
        await new Promise(resolve => setTimeout(resolve, 200));
        await axios.post(`${baseURL}/api/guests/${robertWilson.id}/assign-table`, {
          tableId: keepTable.id
        });
        console.log('  ✅ Fixed multiple assignments');
      } catch (error) {
        console.log(`  ❌ Failed to fix multiple assignments: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Step 3: Verifying the fix...');
    
    // Get fresh data after fix
    const finalGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const finalGuests = finalGuestsResponse.data.success ? finalGuestsResponse.data.data : [];
    
    const finalTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const finalTables = finalTablesResponse.data || [];
    
    const finalRobert = finalGuests.find(g => g.id === robertWilson.id);
    const finalTablesWithRobert = finalTables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(robertWilson.id)
    );
    
    console.log('  Final Robert Wilson state:');
    console.log(`    guest.tableAssignment: ${finalRobert?.tableAssignment || 'none'}`);
    console.log(`    Appears in ${finalTablesWithRobert.length} table(s): ${finalTablesWithRobert.map(t => t.name).join(', ')}`);
    
    // Check consistency
    const isConsistent = finalTablesWithRobert.length === 1 && 
                        finalRobert?.tableAssignment === finalTablesWithRobert[0]?.id;
    
    console.log(`    Data consistency: ${isConsistent ? '✅ CONSISTENT' : '❌ STILL INCONSISTENT'}`);
    
    if (isConsistent) {
      console.log(`    ✅ Robert Wilson is now correctly assigned to: ${finalTablesWithRobert[0].name}`);
    }
    
    console.log('\n📊 Step 4: Final table view simulation...');
    
    // Simulate what the UI would show now
    console.log('  What the UI should show:');
    finalTables.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      if (assignedCount > 0) {
        const guestNames = table.assignedGuests.map(guestId => {
          const guest = finalGuests.find(g => g.id === guestId);
          return guest ? guest.name : `Unknown (${guestId})`;
        });
        console.log(`    ${table.name}: ${assignedCount}/${table.capacity} - [${guestNames.join(', ')}]`);
      }
    });
    
    // Count unique seated guests
    const seatedGuests = finalGuests.filter(guest => 
      finalTables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    console.log(`\n  Statistics that should appear in UI:`);
    console.log(`    Seated: ${seatedGuests.length}`);
    console.log(`    Unseated: ${finalGuests.length - seatedGuests.length}`);
    
    console.log('\n🎉 Robert Wilson Assignment Fix Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (isConsistent) {
      console.log('✅ ROBERT WILSON ASSIGNMENT FIXED!');
      console.log('');
      console.log('🎯 Result:');
      console.log(`   Robert Wilson now appears in only: ${finalTablesWithRobert[0].name}`);
      console.log('   Data consistency between guest.tableAssignment and table.assignedGuests: ✅');
      console.log('');
      console.log('🚀 The UI should now show Robert Wilson in only ONE table!');
    } else {
      console.log('❌ ASSIGNMENT STILL INCONSISTENT');
      console.log('   Manual intervention may be required.');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please check if it\'s running on port 5000');
    } else {
      console.error('❌ Fix failed:', error.message);
    }
  }
}

// Run the fix
fixRobertWilsonAssignment().catch(console.error);