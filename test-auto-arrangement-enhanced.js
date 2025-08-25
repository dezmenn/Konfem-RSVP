const axios = require('axios');

async function testEnhancedAutoArrangement() {
  console.log('🔍 Testing Enhanced Auto Arrangement...\n');
  
  try {
    // Clear all assignments first
    console.log('🧹 Clearing all table assignments...');
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
    
    // Try different constraint combinations
    const testCases = [
      {
        name: 'Standard Auto Arrangement',
        endpoint: '/api/tables/events/demo-event-1/auto-arrange',
        constraints: {
          respectRelationships: true,
          balanceBrideGroomSides: false,
          considerDietaryRestrictions: false,
          keepFamiliesTogether: true,
          optimizeVenueProximity: false,
          maxGuestsPerTable: 4, // Smaller max to force separation
          minGuestsPerTable: 1,
          preferredTableDistance: 100
        }
      },
      {
        name: 'Enhanced Auto Arrangement',
        endpoint: '/api/tables/events/demo-event-1/auto-arrange-enhanced',
        constraints: {
          respectRelationships: true,
          balanceBrideGroomSides: false,
          considerDietaryRestrictions: false,
          keepFamiliesTogether: true,
          optimizeVenueProximity: true,
          maxGuestsPerTable: 3, // Even smaller to force more separation
          minGuestsPerTable: 1,
          preferredTableDistance: 100
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`Endpoint: ${testCase.endpoint}`);
      console.log(`Max guests per table: ${testCase.constraints.maxGuestsPerTable}`);
      
      try {
        // Clear assignments before each test
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
        
        const result = await axios.post(`http://localhost:5000${testCase.endpoint}`, {
          constraints: testCase.constraints
        });
        
        if (result.data.success) {
          console.log(`✅ ${result.data.message}`);
          
          // Check results
          const finalTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
          const finalTables = finalTablesResponse.data;
          
          const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
          const guests = guestsResponse.data.data || [];
          
          let mixedTables = 0;
          let totalTablesUsed = 0;
          
          finalTables.forEach(table => {
            if (table.assignedGuests.length > 0) {
              totalTablesUsed++;
              const relationships = new Set();
              
              table.assignedGuests.forEach(guestId => {
                const guest = guests.find(g => g.id === guestId);
                if (guest) {
                  relationships.add(guest.relationshipType);
                }
              });
              
              if (relationships.size > 1) {
                mixedTables++;
              }
              
              console.log(`  ${table.name}: ${table.assignedGuests.length} guests, ${relationships.size === 1 ? '✅' : '❌'} ${Array.from(relationships).join(', ')}`);
            }
          });
          
          console.log(`  📊 Summary: ${totalTablesUsed} tables used, ${mixedTables} mixed, ${totalTablesUsed - mixedTables} pure`);
          
        } else {
          console.log(`❌ Failed: ${result.data.message}`);
        }
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`❌ Endpoint not available: ${testCase.endpoint}`);
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }
    
    // Final recommendation
    console.log('\n💡 Analysis:');
    console.log('The auto arrangement algorithm appears to prioritize table utilization over relationship separation.');
    console.log('To achieve better relationship grouping:');
    console.log('  1. Use smaller maxGuestsPerTable values to force more distribution');
    console.log('  2. Ensure sufficient table capacity for the number of relationship groups');
    console.log('  3. Consider manual assignment for critical relationship separations');
    console.log('  4. The algorithm may need updates to better prioritize relationship grouping');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedAutoArrangement();