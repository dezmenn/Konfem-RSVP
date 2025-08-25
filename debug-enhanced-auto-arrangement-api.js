const axios = require('axios');

async function debugEnhancedAutoArrangementAPI() {
  console.log('🔍 Debugging Enhanced Auto Arrangement API...\n');
  
  try {
    // Get current guests and their relationship groups
    const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
    const guests = guestsResponse.data.data || [];
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
    
    console.log('📋 The 5 Accepted Guests and Their Relationship Groups:');
    acceptedGuests.forEach((guest, index) => {
      const totalSeats = 1 + guest.additionalGuestCount;
      const groupKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
      console.log(`  ${index + 1}. ${guest.name}: ${groupKey} (${totalSeats} seats)`);
    });
    
    // Clear all assignments
    console.log('\n🧹 Clearing all table assignments...');
    const tablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const tables = tablesResponse.data;
    
    for (const table of tables) {
      if (table.assignedGuests.length > 0) {
        for (const guestId of table.assignedGuests) {
          try {
            await axios.delete(`http://localhost:5000/api/guests/${guestId}/table`);
          } catch (error) {
            // Ignore
          }
        }
      }
    }
    
    // Test with maxGuestsPerTable: 1 to force maximum separation
    console.log('\n🤖 Testing Enhanced Auto Arrangement with maxGuestsPerTable: 1...');
    const result = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange-enhanced', {
      constraints: {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 1, // Force 1 guest per table maximum
        minGuestsPerTable: 1,
        preferredTableDistance: 100
      }
    });
    
    if (result.data.success) {
      console.log(`✅ ${result.data.message}`);
      
      // Analyze the detailed results
      const finalTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
      const finalTables = finalTablesResponse.data;
      
      console.log('\n📊 Detailed Results (maxGuestsPerTable: 1):');
      let tablesUsed = 0;
      let totalGuestsAssigned = 0;
      
      finalTables.forEach(table => {
        if (table.assignedGuests.length > 0) {
          tablesUsed++;
          totalGuestsAssigned += table.assignedGuests.length;
          
          console.log(`\n${table.name} (${table.capacity} capacity):`);
          table.assignedGuests.forEach(guestId => {
            const guest = guests.find(g => g.id === guestId);
            if (guest) {
              const groupKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
              const totalSeats = 1 + guest.additionalGuestCount;
              console.log(`  - ${guest.name}: ${groupKey} (${totalSeats} seats)`);
            }
          });
        }
      });
      
      console.log(`\n📈 Summary:`);
      console.log(`  Expected: 5 guests in 5 separate tables (ideal separation)`);
      console.log(`  Actual: ${totalGuestsAssigned} guests in ${tablesUsed} tables`);
      
      if (tablesUsed === 5 && totalGuestsAssigned === 5) {
        console.log('🎉 PERFECT: Each guest is in their own table!');
      } else if (tablesUsed === 4 && totalGuestsAssigned === 5) {
        console.log('⚠️ GOOD: Almost perfect - one table has 2 guests');
      } else {
        console.log('❌ ISSUE: Not achieving expected separation');
      }
      
    } else {
      console.log(`❌ Enhanced auto arrangement failed: ${result.data.message}`);
    }
    
    // Now test with maxGuestsPerTable: 2 for comparison
    console.log('\n🔄 Clearing and testing with maxGuestsPerTable: 2...');
    
    // Clear again
    for (const table of tables) {
      if (table.assignedGuests.length > 0) {
        for (const guestId of table.assignedGuests) {
          try {
            await axios.delete(`http://localhost:5000/api/guests/${guestId}/table`);
          } catch (error) {
            // Ignore
          }
        }
      }
    }
    
    const result2 = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange-enhanced', {
      constraints: {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 2,
        minGuestsPerTable: 1,
        preferredTableDistance: 100
      }
    });
    
    if (result2.data.success) {
      console.log(`✅ ${result2.data.message}`);
      
      const finalTables2Response = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
      const finalTables2 = finalTables2Response.data;
      
      console.log('\n📊 Results (maxGuestsPerTable: 2):');
      let tablesUsed2 = 0;
      let mixedTables2 = 0;
      
      finalTables2.forEach(table => {
        if (table.assignedGuests.length > 0) {
          tablesUsed2++;
          const relationships = new Set();
          
          table.assignedGuests.forEach(guestId => {
            const guest = guests.find(g => g.id === guestId);
            if (guest) {
              relationships.add(guest.relationshipType);
            }
          });
          
          if (relationships.size > 1) {
            mixedTables2++;
          }
          
          const status = relationships.size === 1 ? '✅' : '❌';
          console.log(`  ${table.name}: ${table.assignedGuests.length} guests ${status} ${Array.from(relationships).join(', ')}`);
        }
      });
      
      console.log(`\n📈 Comparison:`);
      console.log(`  maxGuestsPerTable: 1 → ${tablesUsed} tables used`);
      console.log(`  maxGuestsPerTable: 2 → ${tablesUsed2} tables used, ${mixedTables2} mixed`);
    }
    
    console.log('\n💡 Key Insights:');
    console.log('1. The maxGuestsPerTable constraint directly controls separation');
    console.log('2. Setting it to 1 should force maximum separation');
    console.log('3. If we still see grouping, it might be due to:');
    console.log('   - Algorithm prioritizing certain relationship types together');
    console.log('   - Seat requirements (guests with additional guests)');
    console.log('   - Table capacity constraints');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugEnhancedAutoArrangementAPI();