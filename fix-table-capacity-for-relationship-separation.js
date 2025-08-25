const axios = require('axios');

async function fixTableCapacityForRelationshipSeparation() {
  console.log('🔧 Fixing Table Capacity for Relationship Separation...\n');
  
  try {
    // First, let's unlock Table 4 to give us more capacity
    console.log('🔓 Unlocking Table 4 - Extended Family...');
    await axios.post('http://localhost:5000/api/tables/table-4/unlock');
    console.log('✅ Table 4 unlocked');
    
    // Clear all current assignments
    console.log('\n🧹 Clearing all table assignments...');
    const tablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const tables = tablesResponse.data;
    
    for (const table of tables) {
      if (table.assignedGuests.length > 0) {
        for (const guestId of table.assignedGuests) {
          try {
            await axios.delete(`http://localhost:5000/api/guests/${guestId}/table`);
          } catch (error) {
            // Ignore errors
          }
        }
      }
    }
    
    // Now we have 4 tables available for 5 groups - much better!
    console.log('\n📊 Updated Table Availability:');
    const updatedTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const updatedTables = updatedTablesResponse.data;
    
    updatedTables.forEach(table => {
      const status = table.isLocked ? 'LOCKED' : 'available';
      console.log(`  ${table.name}: ${table.capacity} capacity (${status})`);
    });
    
    // Run auto arrangement with more table capacity
    console.log('\n🤖 Running auto arrangement with increased capacity...');
    const result = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange', {
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
    
    console.log(`✅ ${result.data.message}`);
    
    // Check the results
    console.log('\n📊 Results with Increased Capacity:');
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
        console.log(`\n${table.name}:`);
        
        table.assignedGuests.forEach(guestId => {
          const guest = guests.find(g => g.id === guestId);
          if (guest) {
            relationships.add(guest.relationshipType);
            console.log(`  - ${guest.name} (${guest.relationshipType}, ${guest.brideOrGroomSide} side)`);
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
    
    console.log(`\n📈 Final Results:`);
    console.log(`  Tables used: ${totalTablesUsed}`);
    console.log(`  Mixed relationship tables: ${mixedTables}`);
    console.log(`  Pure relationship tables: ${totalTablesUsed - mixedTables}`);
    
    if (mixedTables === 0) {
      console.log('\n🎉 SUCCESS: Perfect relationship separation achieved!');
      console.log('All tables now have guests with the same relationship type.');
    } else if (mixedTables < 2) {
      console.log('\n✅ IMPROVED: Significant improvement in relationship separation!');
      console.log('Most tables now have consistent relationship types.');
    } else {
      console.log('\n⚠️ PARTIAL: Some improvement, but more work needed.');
    }
    
    // Provide recommendations
    console.log('\n💡 Recommendations:');
    if (mixedTables === 0) {
      console.log('  ✓ Current configuration is optimal for relationship separation');
      console.log('  ✓ Consider keeping Table 4 unlocked for future events');
    } else {
      console.log('  • Consider adding more tables for perfect separation');
      console.log('  • Or group compatible relationship types together');
      console.log('  • Family relationships (Uncle, Cousin) could be grouped');
      console.log('  • Work relationships (Colleague) should stay separate');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fixTableCapacityForRelationshipSeparation();