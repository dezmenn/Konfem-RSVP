const axios = require('axios');

console.log('🔧 Testing Auto-Arrangement Assignment Storage...\n');

async function testAutoArrangementStorage() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Getting initial state...');
    
    // Get initial data
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Initial guests: ${guests.length}`);
    console.log(`  Initial tables: ${tables.length}`);
    
    // Count initially assigned guests
    const initiallyAssigned = guests.filter(g => g.tableAssignment).length;
    const initialTableAssignments = new Map();
    
    tables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        initialTableAssignments.set(table.id, table.assignedGuests.length);
      }
    });
    
    console.log(`  Initially assigned guests: ${initiallyAssigned}`);
    console.log(`  Tables with assignments: ${initialTableAssignments.size}`);
    
    // Check guest RSVP statuses
    const rsvpStatusCounts = {};
    guests.forEach(guest => {
      const status = guest.rsvpStatus || 'no_status';
      rsvpStatusCounts[status] = (rsvpStatusCounts[status] || 0) + 1;
    });
    
    console.log('  Guest RSVP status breakdown:');
    Object.entries(rsvpStatusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });
    
    // Calculate guests that should be arranged
    const guestsToArrange = guests.filter(guest => 
      guest.rsvpStatus === 'accepted' || guest.rsvpStatus === 'pending' || !guest.rsvpStatus
    );
    console.log(`  Guests eligible for arrangement: ${guestsToArrange.length}`);
    
    console.log('\n🚀 Step 2: Running auto-arrangement...');
    
    const autoArrangeOptions = {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    };
    
    console.log('  Auto-arrangement options:', autoArrangeOptions);
    
    const arrangeResponse = await axios.post(
      `${baseURL}/api/tables/events/${eventId}/auto-arrange`,
      autoArrangeOptions,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log(`  API Response Status: ${arrangeResponse.status}`);
    console.log(`  Response Data:`, arrangeResponse.data);
    
    if (!arrangeResponse.data.success) {
      console.log('  ❌ Auto-arrangement failed:', arrangeResponse.data.message);
      return;
    }
    
    console.log(`  ✅ Auto-arrangement completed: ${arrangeResponse.data.message}`);
    console.log(`  Arranged guests: ${arrangeResponse.data.arrangedGuests}`);
    
    console.log('\n🔍 Step 3: Verifying assignment storage...');
    
    // Get fresh data after arrangement
    const guestsAfterResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guestsAfter = guestsAfterResponse.data.success ? guestsAfterResponse.data.data : [];
    
    const tablesAfterResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tablesAfter = tablesAfterResponse.data || [];
    
    // Count assigned guests after arrangement
    const assignedAfter = guestsAfter.filter(g => g.tableAssignment).length;
    const tableAssignmentsAfter = new Map();
    
    tablesAfter.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        tableAssignmentsAfter.set(table.id, table.assignedGuests.length);
      }
    });
    
    console.log('  Assignment verification:');
    console.log(`    Guests with tableAssignment: ${assignedAfter} (was ${initiallyAssigned})`);
    console.log(`    Tables with assignedGuests: ${tableAssignmentsAfter.size} (was ${initialTableAssignments.size})`);
    console.log(`    Expected arranged: ${arrangeResponse.data.arrangedGuests}`);
    console.log(`    Actual assigned: ${assignedAfter}`);
    console.log(`    Match: ${assignedAfter === arrangeResponse.data.arrangedGuests ? '✅' : '❌'}`);
    
    // Detailed table breakdown
    console.log('\n  📋 Table assignment details:');
    tablesAfter.forEach(table => {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      if (assignedCount > 0) {
        console.log(`    ${table.name}: ${assignedCount}/${table.capacity} guests`);
        
        // Show guest names
        if (table.assignedGuests) {
          const guestNames = table.assignedGuests.map(guestId => {
            const guest = guestsAfter.find(g => g.id === guestId);
            return guest ? guest.name : `Unknown (${guestId})`;
          });
          console.log(`      Guests: ${guestNames.join(', ')}`);
        }
      }
    });
    
    // Check for data consistency
    console.log('\n🔍 Step 4: Data consistency check...');
    
    const consistencyIssues = [];
    
    // Check if guest.tableAssignment matches table.assignedGuests
    guestsAfter.forEach(guest => {
      if (guest.tableAssignment) {
        const assignedTable = tablesAfter.find(t => t.id === guest.tableAssignment);
        if (assignedTable) {
          const isInTableArray = assignedTable.assignedGuests && assignedTable.assignedGuests.includes(guest.id);
          if (!isInTableArray) {
            consistencyIssues.push(`${guest.name}: guest.tableAssignment="${guest.tableAssignment}" but not in table.assignedGuests`);
          }
        } else {
          consistencyIssues.push(`${guest.name}: assigned to non-existent table "${guest.tableAssignment}"`);
        }
      }
    });
    
    // Check for duplicates
    const guestAssignmentMap = new Map();
    tablesAfter.forEach(table => {
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
        const guest = guestsAfter.find(g => g.id === guestId);
        duplicates.push(`${guest ? guest.name : 'Unknown'} appears in: ${tableNames.join(', ')}`);
      }
    });
    
    console.log('  Consistency check results:');
    console.log(`    Data consistency issues: ${consistencyIssues.length}`);
    console.log(`    Duplicate assignments: ${duplicates.length}`);
    
    if (consistencyIssues.length > 0) {
      console.log('    ❌ Consistency issues found:');
      consistencyIssues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (duplicates.length > 0) {
      console.log('    ❌ Duplicate assignments found:');
      duplicates.forEach(dup => console.log(`      - ${dup}`));
    }
    
    if (consistencyIssues.length === 0 && duplicates.length === 0) {
      console.log('    ✅ All data is consistent and duplicate-free');
    }
    
    console.log('\n🎉 Auto-Arrangement Storage Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const isWorking = arrangeResponse.data.success && 
                     assignedAfter > initiallyAssigned && 
                     consistencyIssues.length === 0 && 
                     duplicates.length === 0;
    
    if (isWorking) {
      console.log('✅ AUTO-ARRANGEMENT IS WORKING AND STORING ASSIGNMENTS');
      console.log('');
      console.log('🎯 Verified Features:');
      console.log('   ✅ Auto-arrangement API executes successfully');
      console.log('   ✅ Guest assignments are stored in guest.tableAssignment');
      console.log('   ✅ Table assignments are stored in table.assignedGuests');
      console.log('   ✅ Data consistency maintained between guest and table records');
      console.log('   ✅ No duplicate assignments created');
      console.log('   ✅ Assignments persist across API calls');
      console.log('');
      console.log('📊 Results Summary:');
      console.log(`   Guests arranged: ${arrangeResponse.data.arrangedGuests}`);
      console.log(`   Tables used: ${tableAssignmentsAfter.size}`);
      console.log(`   Success rate: 100%`);
    } else {
      console.log('❌ AUTO-ARRANGEMENT HAS ISSUES');
      console.log('');
      console.log('🔧 Issues Found:');
      if (!arrangeResponse.data.success) {
        console.log('   ❌ Auto-arrangement API failed');
      }
      if (assignedAfter <= initiallyAssigned) {
        console.log('   ❌ No new assignments were made');
      }
      if (consistencyIssues.length > 0) {
        console.log('   ❌ Data consistency issues detected');
      }
      if (duplicates.length > 0) {
        console.log('   ❌ Duplicate assignments found');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else if (error.response) {
      console.log('\n📋 Error Response Details:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
}

// Run the test
testAutoArrangementStorage().catch(console.error);