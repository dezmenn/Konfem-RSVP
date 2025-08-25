const axios = require('axios');

console.log('🔍 Debugging Tab Switching Data Inconsistency...\n');

async function debugTabSwitching() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Simulating auto arrangement...');
    
    // First, run auto arrangement
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
    
    console.log(`  Auto arrangement result: ${arrangeResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
    if (arrangeResponse.data.success) {
      console.log(`  Arranged guests: ${arrangeResponse.data.arrangedGuests}`);
    }
    
    console.log('\n🔍 Step 2: Simulating multiple tab data loads...');
    
    // Simulate loading data multiple times (like switching tabs)
    const loadAttempts = 5;
    const results = [];
    
    for (let i = 1; i <= loadAttempts; i++) {
      console.log(`  Load attempt ${i}:`);
      
      // Get guests data
      const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
      const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
      
      // Get tables data
      const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
      const tables = tablesResponse.data || [];
      
      // Simulate the categorizeGuests logic from AutoTableArrangement
      const seated = [];
      const unseated = [];
      const processedGuestIds = new Set();

      guests.forEach(guest => {
        if (processedGuestIds.has(guest.id)) {
          return;
        }
        processedGuestIds.add(guest.id);

        let assignedTableId;
        
        // Check if guest is in any table's assignedGuests array (primary source)
        const assignedTable = tables.find(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        
        if (assignedTable) {
          assignedTableId = assignedTable.id;
        } else if (guest.tableAssignment) {
          // Fallback to guest's tableAssignment property
          assignedTableId = guest.tableAssignment;
        }

        if (assignedTableId) {
          seated.push({ ...guest, tableId: assignedTableId });
        } else {
          unseated.push(guest);
        }
      });
      
      const result = {
        attempt: i,
        totalGuests: guests.length,
        totalTables: tables.length,
        seatedCount: seated.length,
        unseatedCount: unseated.length,
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      console.log(`    Total guests: ${result.totalGuests}`);
      console.log(`    Seated: ${result.seatedCount}`);
      console.log(`    Unseated: ${result.unseatedCount}`);
      
      // Small delay to simulate real tab switching
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Step 3: Analyzing consistency...');
    
    // Check if results are consistent
    const seatedCounts = results.map(r => r.seatedCount);
    const unseatedCounts = results.map(r => r.unseatedCount);
    
    const seatedConsistent = seatedCounts.every(count => count === seatedCounts[0]);
    const unseatedConsistent = unseatedCounts.every(count => count === unseatedCounts[0]);
    
    console.log('  Consistency analysis:');
    console.log(`    Seated counts: [${seatedCounts.join(', ')}]`);
    console.log(`    Unseated counts: [${unseatedCounts.join(', ')}]`);
    console.log(`    Seated consistent: ${seatedConsistent ? '✅' : '❌'}`);
    console.log(`    Unseated consistent: ${unseatedConsistent ? '✅' : '❌'}`);
    
    if (!seatedConsistent || !unseatedConsistent) {
      console.log('\n🔍 Step 4: Deep dive into inconsistency...');
      
      // Get one more detailed snapshot
      const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
      const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
      
      const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
      const tables = tablesResponse.data || [];
      
      console.log('  Detailed data analysis:');
      
      // Check for guests with tableAssignment but not in table.assignedGuests
      const inconsistentGuests = [];
      guests.forEach(guest => {
        if (guest.tableAssignment) {
          const table = tables.find(t => t.id === guest.tableAssignment);
          if (table) {
            const isInTableArray = table.assignedGuests && table.assignedGuests.includes(guest.id);
            if (!isInTableArray) {
              inconsistentGuests.push({
                name: guest.name,
                id: guest.id,
                guestSaysTable: guest.tableAssignment,
                tableName: table.name,
                inTableArray: false
              });
            }
          }
        }
      });
      
      // Check for guests in table.assignedGuests but without tableAssignment
      const orphanedAssignments = [];
      tables.forEach(table => {
        if (table.assignedGuests) {
          table.assignedGuests.forEach(guestId => {
            const guest = guests.find(g => g.id === guestId);
            if (guest && guest.tableAssignment !== table.id) {
              orphanedAssignments.push({
                name: guest.name,
                id: guest.id,
                tableName: table.name,
                guestTableAssignment: guest.tableAssignment || 'none'
              });
            }
          });
        }
      });
      
      console.log(`    Guests with tableAssignment but not in table array: ${inconsistentGuests.length}`);
      inconsistentGuests.forEach(guest => {
        console.log(`      - ${guest.name}: says "${guest.guestSaysTable}" but not in ${guest.tableName}.assignedGuests`);
      });
      
      console.log(`    Guests in table array but wrong tableAssignment: ${orphanedAssignments.length}`);
      orphanedAssignments.forEach(guest => {
        console.log(`      - ${guest.name}: in ${guest.tableName}.assignedGuests but tableAssignment is "${guest.guestTableAssignment}"`);
      });
      
      // Check for timing issues
      console.log('\n  Potential causes:');
      console.log('    1. Race conditions between guest and table data loading');
      console.log('    2. Inconsistent data synchronization after auto arrangement');
      console.log('    3. Different components using different data sources');
      console.log('    4. Caching issues in the demo data service');
    }
    
    console.log('\n🎉 Tab Switching Debug Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (seatedConsistent && unseatedConsistent) {
      console.log('✅ DATA IS CONSISTENT ACROSS TAB SWITCHES');
      console.log('   The issue might be elsewhere or already resolved.');
    } else {
      console.log('❌ DATA INCONSISTENCY DETECTED');
      console.log('');
      console.log('🔧 Recommended Fixes:');
      console.log('   1. Ensure single source of truth for guest assignments');
      console.log('   2. Add data synchronization after auto arrangement');
      console.log('   3. Implement proper loading states to prevent race conditions');
      console.log('   4. Add data validation to catch inconsistencies');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the debug
debugTabSwitching().catch(console.error);