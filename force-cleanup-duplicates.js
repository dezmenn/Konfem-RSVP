const axios = require('axios');

console.log('🧹 Force Cleanup of Duplicate Guest Assignments...\n');

async function forceCleanupDuplicates() {
  try {
    const baseURL = 'http://localhost:5000';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Getting current data state...');
    
    // Get current data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Total guests: ${guests.length}`);
    console.log(`  Total tables: ${tables.length}`);
    
    // Find Robert Wilson specifically
    const robertWilson = guests.find(guest => 
      guest.name.toLowerCase().includes('robert') && guest.name.toLowerCase().includes('wilson')
    );
    
    if (robertWilson) {
      console.log(`\n🎯 Found Robert Wilson: ${robertWilson.id}`);
      console.log(`  Current tableAssignment: ${robertWilson.tableAssignment || 'none'}`);
      
      // Check which tables have Robert Wilson
      const tablesWithRobert = tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(robertWilson.id)
      );
      
      console.log(`  Appears in ${tablesWithRobert.length} tables:`);
      tablesWithRobert.forEach(table => {
        console.log(`    - ${table.name} (${table.id})`);
      });
      
      if (tablesWithRobert.length > 1) {
        console.log('\n🔧 Step 2: Force cleaning Robert Wilson duplicates...');
        
        // Unassign Robert Wilson from all tables
        console.log('  Unassigning from all tables...');
        try {
          await axios.post(`${baseURL}/api/guests/${robertWilson.id}/unassign-table`);
          console.log('  ✅ Unassigned successfully');
        } catch (error) {
          console.log(`  ❌ Unassign failed: ${error.message}`);
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reassign to the first table only
        const targetTable = tablesWithRobert[0];
        console.log(`  Reassigning to ${targetTable.name}...`);
        try {
          await axios.post(`${baseURL}/api/guests/${robertWilson.id}/assign-table`, {
            tableId: targetTable.id
          });
          console.log('  ✅ Reassigned successfully');
        } catch (error) {
          console.log(`  ❌ Reassign failed: ${error.message}`);
        }
      }
    }
    
    console.log('\n🔍 Step 3: Comprehensive duplicate check...');
    
    // Get fresh data after cleanup
    const finalGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const finalGuests = finalGuestsResponse.data.success ? finalGuestsResponse.data.data : [];
    
    const finalTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const finalTables = finalTablesResponse.data || [];
    
    // Check for any remaining duplicates
    const guestAssignmentMap = new Map();
    finalTables.forEach(table => {
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
    
    const remainingDuplicates = [];
    guestAssignmentMap.forEach((tableAssignments, guestId) => {
      if (tableAssignments.length > 1) {
        const guest = finalGuests.find(g => g.id === guestId);
        remainingDuplicates.push({
          guestId,
          guestName: guest ? guest.name : 'Unknown',
          tables: tableAssignments
        });
      }
    });
    
    console.log(`  Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length > 0) {
      console.log('  ❌ Still have duplicates:');
      remainingDuplicates.forEach(dup => {
        console.log(`    ${dup.guestName} in: ${dup.tables.map(t => t.tableName).join(', ')}`);
      });
      
      // Force fix remaining duplicates
      console.log('\n🔨 Step 4: Force fixing remaining duplicates...');
      
      for (const duplicate of remainingDuplicates) {
        console.log(`  Force fixing ${duplicate.guestName}...`);
        
        // Unassign completely
        await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/unassign-table`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reassign to first table only
        const firstTable = duplicate.tables[0];
        await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/assign-table`, {
          tableId: firstTable.tableId
        });
        
        console.log(`    ✅ Fixed: now only in ${firstTable.tableName}`);
      }
    } else {
      console.log('  ✅ No duplicates found');
    }
    
    console.log('\n📊 Step 5: Final verification...');
    
    // Get final state
    const verifyGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const verifyGuests = verifyGuestsResponse.data.success ? verifyGuestsResponse.data.data : [];
    
    const verifyTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const verifyTables = verifyTablesResponse.data || [];
    
    // Calculate final statistics
    const seatedGuests = verifyGuests.filter(guest => 
      verifyTables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    const totalTableGuests = verifyTables.reduce((total, table) => {
      return total + (table.assignedGuests ? table.assignedGuests.length : 0);
    }, 0);
    
    console.log('  Final Statistics:');
    console.log(`    Unique seated guests: ${seatedGuests.length}`);
    console.log(`    Total guest appearances in tables: ${totalTableGuests}`);
    console.log(`    Statistics match: ${seatedGuests.length === totalTableGuests ? '✅' : '❌'}`);
    
    console.log('\n  Final table breakdown:');
    verifyTables.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      if (assignedCount > 0) {
        const guestNames = table.assignedGuests.map(guestId => {
          const guest = verifyGuests.find(g => g.id === guestId);
          return guest ? guest.name : `Unknown (${guestId})`;
        });
        console.log(`    ${table.name}: ${assignedCount}/${table.capacity} - [${guestNames.join(', ')}]`);
      } else {
        console.log(`    ${table.name}: 0/${table.capacity} - [empty]`);
      }
    });
    
    // Check Robert Wilson specifically
    if (robertWilson) {
      const finalRobert = verifyGuests.find(g => g.id === robertWilson.id);
      const tablesWithFinalRobert = verifyTables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(robertWilson.id)
      );
      
      console.log(`\n🎯 Robert Wilson final status:`);
      console.log(`    tableAssignment: ${finalRobert?.tableAssignment || 'none'}`);
      console.log(`    Appears in ${tablesWithFinalRobert.length} table(s): ${tablesWithFinalRobert.map(t => t.name).join(', ')}`);
      console.log(`    Status: ${tablesWithFinalRobert.length === 1 ? '✅ FIXED' : '❌ STILL DUPLICATED'}`);
    }
    
    console.log('\n🎉 Force Cleanup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (seatedGuests.length === totalTableGuests && remainingDuplicates.length === 0) {
      console.log('✅ DUPLICATES SUCCESSFULLY ELIMINATED!');
      console.log('');
      console.log('🎯 Results:');
      console.log(`   Seated guests: ${seatedGuests.length}`);
      console.log(`   Table view guests: ${totalTableGuests}`);
      console.log(`   Perfect match: ✅`);
      console.log('');
      console.log('🚀 The table view should now show the correct count!');
      console.log('   Each guest appears in exactly one table.');
    } else {
      console.log('❌ CLEANUP INCOMPLETE');
      console.log('   Manual intervention may be required.');
      console.log('   Consider restarting the backend server to reset demo data.');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else {
      console.error('❌ Force cleanup failed:', error.message);
    }
  }
}

// Run the force cleanup
forceCleanupDuplicates().catch(console.error);