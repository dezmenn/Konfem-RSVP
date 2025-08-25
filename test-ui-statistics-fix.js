const axios = require('axios');

console.log('📊 Testing UI Statistics and Table View Consistency...\n');

async function testUIStatisticsFix() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('🧹 Step 1: Cleaning up any existing duplicates...');
    
    // First, let's clean up any existing duplicates
    const initialGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const initialGuests = initialGuestsResponse.data.success ? initialGuestsResponse.data.data : [];
    
    const initialTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const initialTables = initialTablesResponse.data || [];
    
    // Find and fix duplicates
    const guestAssignmentMap = new Map();
    initialTables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!guestAssignmentMap.has(guestId)) {
            guestAssignmentMap.set(guestId, []);
          }
          guestAssignmentMap.get(guestId).push(table.id);
        });
      }
    });
    
    const duplicates = [];
    guestAssignmentMap.forEach((tableIds, guestId) => {
      if (tableIds.length > 1) {
        const guest = initialGuests.find(g => g.id === guestId);
        duplicates.push({ guestId, guestName: guest ? guest.name : 'Unknown', tableIds });
      }
    });
    
    console.log(`  Found ${duplicates.length} duplicate assignments`);
    
    // Clean up duplicates by unassigning and reassigning to first table
    for (const duplicate of duplicates) {
      console.log(`  Fixing ${duplicate.guestName}...`);
      
      // Unassign from all tables
      await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/unassign-table`);
      
      // Reassign to first table
      await axios.post(`${baseURL}/api/guests/${duplicate.guestId}/assign-table`, {
        tableId: duplicate.tableIds[0]
      });
    }
    
    console.log('  ✅ Cleanup complete');
    
    console.log('\n📊 Step 2: Running auto arrangement...');
    
    const autoArrangeOptions = {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    };
    
    const arrangeResponse = await axios.post(
      `${baseURL}/api/tables/events/${eventId}/auto-arrange`,
      autoArrangeOptions,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log(`  Auto arrangement: ${arrangeResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Message: ${arrangeResponse.data.message}`);
    console.log(`  Guests arranged: ${arrangeResponse.data.arrangedGuests}`);
    
    console.log('\n🔍 Step 3: Verifying UI statistics consistency...');
    
    // Get fresh data after auto arrangement
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    // Calculate statistics using AutoTableArrangement logic (single source of truth)
    const seatedGuests = guests.filter(guest => 
      tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    const unseatedGuests = guests.filter(guest => 
      !tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    console.log('  Auto Arrangement Statistics:');
    console.log(`    Total Guests: ${guests.length}`);
    console.log(`    Seated: ${seatedGuests.length}`);
    console.log(`    Unseated: ${unseatedGuests.length}`);
    console.log(`    Tables: ${tables.length}`);
    
    // Calculate table view display counts
    let totalTableViewGuests = 0;
    const tableViewBreakdown = [];
    
    tables.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      totalTableViewGuests += assignedCount;
      
      if (assignedCount > 0) {
        const guestNames = table.assignedGuests.map(guestId => {
          const guest = guests.find(g => g.id === guestId);
          return guest ? guest.name : `Unknown (${guestId})`;
        });
        
        tableViewBreakdown.push({
          tableName: table.name,
          capacity: table.capacity,
          assigned: assignedCount,
          guests: guestNames
        });
      }
    });
    
    console.log('\n  Table View Display:');
    tableViewBreakdown.forEach(table => {
      console.log(`    ${table.tableName}: ${table.assigned}/${table.capacity}`);
      console.log(`      Guests: ${table.guests.join(', ')}`);
    });
    
    console.log(`\n  Table View Total Guests: ${totalTableViewGuests}`);
    
    // Check consistency
    const statisticsMatch = seatedGuests.length === totalTableViewGuests;
    const totalMatch = seatedGuests.length + unseatedGuests.length === guests.length;
    
    console.log('\n📊 Step 4: Consistency verification...');
    console.log(`  Seated count matches table view: ${statisticsMatch ? '✅' : '❌'}`);
    console.log(`  Total guests add up correctly: ${totalMatch ? '✅' : '❌'}`);
    
    if (!statisticsMatch) {
      console.log(`    Expected table view guests: ${seatedGuests.length}`);
      console.log(`    Actual table view guests: ${totalTableViewGuests}`);
      console.log(`    Difference: ${Math.abs(seatedGuests.length - totalTableViewGuests)}`);
    }
    
    // Check for remaining duplicates
    console.log('\n🔍 Step 5: Final duplicate check...');
    
    const finalGuestAssignmentMap = new Map();
    tables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => {
          if (!finalGuestAssignmentMap.has(guestId)) {
            finalGuestAssignmentMap.set(guestId, []);
          }
          finalGuestAssignmentMap.get(guestId).push(table.name);
        });
      }
    });
    
    const finalDuplicates = [];
    finalGuestAssignmentMap.forEach((tableNames, guestId) => {
      if (tableNames.length > 1) {
        const guest = guests.find(g => g.id === guestId);
        finalDuplicates.push({
          guestName: guest ? guest.name : 'Unknown',
          tables: tableNames
        });
      }
    });
    
    console.log(`  Remaining duplicates: ${finalDuplicates.length}`);
    if (finalDuplicates.length > 0) {
      finalDuplicates.forEach(dup => {
        console.log(`    ❌ ${dup.guestName} still in: ${dup.tables.join(', ')}`);
      });
    } else {
      console.log('  ✅ No duplicates found');
    }
    
    // Test RSVP filtering
    console.log('\n🎯 Step 6: RSVP status verification...');
    
    const rsvpStatusCounts = {};
    seatedGuests.forEach(guest => {
      const status = guest.rsvpStatus || 'no_status';
      rsvpStatusCounts[status] = (rsvpStatusCounts[status] || 0) + 1;
    });
    
    console.log('  Seated guests by RSVP status:');
    Object.entries(rsvpStatusCounts).forEach(([status, count]) => {
      const isCorrect = status === 'accepted';
      console.log(`    ${status}: ${count} ${isCorrect ? '✅' : '❌'}`);
    });
    
    const onlyAcceptedSeated = rsvpStatusCounts.accepted === seatedGuests.length;
    console.log(`  Only accepted guests seated: ${onlyAcceptedSeated ? '✅' : '❌'}`);
    
    console.log('\n🎉 UI Statistics Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const allTestsPassed = statisticsMatch && 
                          totalMatch && 
                          finalDuplicates.length === 0 && 
                          onlyAcceptedSeated;
    
    if (allTestsPassed) {
      console.log('✅ UI STATISTICS AND TABLE VIEW ARE NOW CONSISTENT!');
      console.log('');
      console.log('🎯 Verified Features:');
      console.log('   ✅ Seated count matches table view display exactly');
      console.log('   ✅ No duplicate guest assignments');
      console.log('   ✅ Only accepted RSVP guests are seated');
      console.log('   ✅ Total guest counts add up correctly');
      console.log('   ✅ Statistics synchronization working properly');
      console.log('');
      console.log('📊 Final Results:');
      console.log(`   Total Guests: ${guests.length}`);
      console.log(`   Seated: ${seatedGuests.length}`);
      console.log(`   Unseated: ${unseatedGuests.length}`);
      console.log(`   Tables with guests: ${tableViewBreakdown.length}`);
      console.log('');
      console.log('🚀 The auto arrangement UI now shows correct statistics!');
      console.log('   - Seated count = Table view guest count');
      console.log('   - Only accepted guests are arranged');
      console.log('   - No duplicates in table assignments');
      
    } else {
      console.log('❌ UI STATISTICS STILL HAVE ISSUES');
      console.log('');
      console.log('🔧 Issues Found:');
      if (!statisticsMatch) {
        console.log(`   ❌ Seated count (${seatedGuests.length}) ≠ Table view count (${totalTableViewGuests})`);
      }
      if (!totalMatch) {
        console.log('   ❌ Total guest counts don\'t add up correctly');
      }
      if (finalDuplicates.length > 0) {
        console.log(`   ❌ ${finalDuplicates.length} duplicate assignments remain`);
      }
      if (!onlyAcceptedSeated) {
        console.log('   ❌ Non-accepted guests are being seated');
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run the test
testUIStatisticsFix().catch(console.error);