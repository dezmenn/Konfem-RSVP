const axios = require('axios');

async function testFrontendAutoArrangement() {
  console.log('🔍 Testing Frontend Auto Arrangement Settings...\n');
  
  try {
    // Test the exact same call the frontend is now making
    console.log('🤖 Testing enhanced auto-arrange endpoint with frontend settings...');
    
    // Clear all assignments first
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
    
    // Use the exact same settings as the frontend default
    const frontendSettings = {
      constraints: {
        respectRelationships: true,
        balanceBrideGroomSides: false, // This should be false now
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        maxGuestsPerTable: 3 // This should be 3 now
      }
    };
    
    console.log('Frontend settings:', JSON.stringify(frontendSettings, null, 2));
    
    const result = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange-enhanced', frontendSettings);
    
    if (result.data.success) {
      console.log(`✅ ${result.data.message}`);
      
      // Check the results
      const finalTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
      const finalTables = finalTablesResponse.data;
      
      const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
      const guests = guestsResponse.data.data || [];
      
      console.log('\n📊 Results:');
      let tablesUsed = 0;
      let mixedTables = 0;
      
      finalTables.forEach(table => {
        if (table.assignedGuests.length > 0) {
          tablesUsed++;
          const relationships = new Set();
          
          console.log(`\n${table.name}:`);
          table.assignedGuests.forEach(guestId => {
            const guest = guests.find(g => g.id === guestId);
            if (guest) {
              relationships.add(guest.relationshipType);
              console.log(`  - ${guest.name} (${guest.relationshipType})`);
            }
          });
          
          if (relationships.size > 1) {
            mixedTables++;
            console.log(`  ❌ MIXED: ${Array.from(relationships).join(', ')}`);
          } else {
            console.log(`  ✅ CONSISTENT: ${Array.from(relationships)[0]}`);
          }
        }
      });
      
      console.log(`\n📈 Summary:`);
      console.log(`  Tables used: ${tablesUsed}`);
      console.log(`  Mixed tables: ${mixedTables}`);
      console.log(`  Pure tables: ${tablesUsed - mixedTables}`);
      
      if (mixedTables === 0) {
        console.log('\n🎉 SUCCESS: Perfect relationship separation!');
        console.log('The frontend should now work correctly with these settings.');
      } else if (mixedTables <= 1) {
        console.log('\n✅ GOOD: Significant improvement in relationship separation!');
        console.log('Much better than putting everyone in one table.');
      } else {
        console.log('\n⚠️ ISSUE: Still some mixing, but better than before.');
      }
      
    } else {
      console.log(`❌ Enhanced auto arrangement failed: ${result.data.message}`);
    }
    
    // Also test if the issue is with the checkbox state
    console.log('\n💡 Frontend Troubleshooting:');
    console.log('If the "Balance Bride/Groom Sides" checkbox is still checked in the UI:');
    console.log('1. Try unchecking it manually');
    console.log('2. Or refresh the page to get the new default settings');
    console.log('3. The maxGuestsPerTable should show "3" in the input field');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendAutoArrangement();