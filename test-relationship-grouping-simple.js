const axios = require('axios');

async function testRelationshipGroupingSimple() {
  console.log('🔍 Simple Relationship Grouping Test...\n');
  
  try {
    // Clear all assignments first
    console.log('🧹 Clearing all table assignments...');
    const tablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const tables = tablesResponse.data;
    
    for (const table of tables) {
      if (table.assignedGuests.length > 0 && !table.isLocked) {
        for (const guestId of table.assignedGuests) {
          try {
            await axios.delete(`http://localhost:5000/api/guests/${guestId}/table`);
          } catch (error) {
            // Ignore errors
          }
        }
      }
    }
    
    // Run auto arrangement
    console.log('🤖 Running auto arrangement...');
    const arrangementResponse = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange', {
      constraints: {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: false,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 1,
        preferredTableDistance: 100
      }
    });
    
    if (!arrangementResponse.data.success) {
      console.log(`❌ Auto arrangement failed: ${arrangementResponse.data.message}`);
      return;
    }
    
    console.log(`✅ Auto arrangement completed: ${arrangementResponse.data.message}\n`);
    
    // Check results
    const newTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const newTables = newTablesResponse.data;
    
    const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
    const guests = guestsResponse.data.data || [];
    
    console.log('📊 Results:');
    let mixedTables = 0;
    
    newTables.forEach(table => {
      if (table.assignedGuests.length > 0) {
        const relationships = new Set();
        const guestDetails = [];
        
        table.assignedGuests.forEach(guestId => {
          const guest = guests.find(g => g.id === guestId);
          if (guest) {
            relationships.add(guest.relationshipType);
            guestDetails.push(`${guest.name} (${guest.relationshipType})`);
          }
        });
        
        console.log(`\n${table.name}:`);
        guestDetails.forEach(detail => console.log(`  - ${detail}`));
        
        if (relationships.size > 1) {
          mixedTables++;
          console.log(`  ❌ MIXED: ${Array.from(relationships).join(', ')}`);
        } else {
          console.log(`  ✅ CONSISTENT: ${Array.from(relationships)[0]}`);
        }
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`Mixed relationship tables: ${mixedTables}`);
    
    if (mixedTables === 0) {
      console.log('🎉 SUCCESS: All tables have consistent relationship types!');
    } else {
      console.log('⚠️ ISSUE: Some tables still have mixed relationship types');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRelationshipGroupingSimple();