const axios = require('axios');

async function debugAutoArrangementRelationshipGrouping() {
  console.log('🔍 Debugging Auto Arrangement Relationship Grouping...\n');
  
  try {
    // First, let's see the current state of guests and tables
    console.log('📋 Current Guest List:');
    const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
    const guests = guestsResponse.data.data || [];
    
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
    console.log(`Total guests: ${guests.length}, Accepted: ${acceptedGuests.length}\n`);
    
    // Group guests by relationship type and side
    const groupedGuests = {};
    acceptedGuests.forEach(guest => {
      const key = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
      if (!groupedGuests[key]) {
        groupedGuests[key] = [];
      }
      groupedGuests[key].push({
        name: guest.name,
        additionalGuests: guest.additionalGuestCount,
        totalSeats: 1 + guest.additionalGuestCount
      });
    });
    
    console.log('👥 Guests grouped by relationship and side:');
    Object.entries(groupedGuests).forEach(([key, guestList]) => {
      const totalSeats = guestList.reduce((sum, g) => sum + g.totalSeats, 0);
      console.log(`  ${key}: ${guestList.length} guests, ${totalSeats} seats needed`);
      guestList.forEach(g => {
        console.log(`    - ${g.name} (${g.totalSeats} seats)`);
      });
    });
    
    console.log('\n📊 Current Table Assignments:');
    const tablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const tables = tablesResponse.data;
    
    tables.forEach(table => {
      console.log(`\n${table.name} (${table.capacity} capacity, ${table.isLocked ? 'LOCKED' : 'unlocked'}):`);
      if (table.assignedGuests.length === 0) {
        console.log('  - Empty');
      } else {
        table.assignedGuests.forEach(guestId => {
          const guest = guests.find(g => g.id === guestId);
          if (guest) {
            console.log(`  - ${guest.name} (${guest.relationshipType}, ${guest.brideOrGroomSide} side, ${1 + guest.additionalGuestCount} seats)`);
          }
        });
      }
    });
    
    // Clear all current assignments first
    console.log('\n🧹 Clearing current table assignments...');
    for (const table of tables) {
      if (table.assignedGuests.length > 0 && !table.isLocked) {
        for (const guestId of table.assignedGuests) {
          try {
            await axios.delete(`http://localhost:5000/api/guests/${guestId}/table`);
          } catch (error) {
            console.log(`  Warning: Could not unassign guest ${guestId}`);
          }
        }
      }
    }
    
    // Run auto arrangement with relationship grouping
    console.log('\n🤖 Running auto arrangement with relationship grouping...');
    const arrangementResponse = await axios.post('http://localhost:5000/api/tables/events/demo-event-1/auto-arrange', {
      constraints: {
        respectRelationships: true,
        balanceBrideGroomSides: false, // Disable to focus on relationship grouping
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: false,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      }
    });
    
    if (arrangementResponse.data.success) {
      console.log(`✅ Auto arrangement completed: ${arrangementResponse.data.message}`);
      if (arrangementResponse.data.score !== undefined) {
        console.log(`📊 Score: ${arrangementResponse.data.score.toFixed(2)}`);
      }
      
      if (arrangementResponse.data.conflicts && arrangementResponse.data.conflicts.length > 0) {
        console.log('\n⚠️ Conflicts detected:');
        arrangementResponse.data.conflicts.forEach(conflict => {
          console.log(`  ${conflict.severity.toUpperCase()}: ${conflict.message}`);
        });
      }
    } else {
      console.log(`❌ Auto arrangement failed: ${arrangementResponse.data.message}`);
      return;
    }
    
    // Check the new assignments
    console.log('\n📊 New Table Assignments After Auto Arrangement:');
    const newTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const newTables = newTablesResponse.data;
    
    const newGuestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
    const newGuests = newGuestsResponse.data.data || [];
    
    newTables.forEach(table => {
      console.log(`\n${table.name} (${table.capacity} capacity):`);
      if (table.assignedGuests.length === 0) {
        console.log('  - Empty');
      } else {
        const relationshipTypes = new Set();
        const sides = new Set();
        let totalSeats = 0;
        
        table.assignedGuests.forEach(guestId => {
          const guest = newGuests.find(g => g.id === guestId);
          if (guest) {
            relationshipTypes.add(guest.relationshipType);
            sides.add(guest.brideOrGroomSide);
            totalSeats += 1 + guest.additionalGuestCount;
            console.log(`  - ${guest.name} (${guest.relationshipType}, ${guest.brideOrGroomSide} side, ${1 + guest.additionalGuestCount} seats)`);
          }
        });
        
        console.log(`  Summary: ${totalSeats}/${table.capacity} seats, ${relationshipTypes.size} relationship types, ${sides.size} sides`);
        if (relationshipTypes.size > 1) {
          console.log(`  ⚠️ MIXED RELATIONSHIPS: ${Array.from(relationshipTypes).join(', ')}`);
        }
      }
    });
    
    // Analyze relationship separation
    console.log('\n🔍 Relationship Separation Analysis:');
    const tableRelationships = {};
    newTables.forEach(table => {
      if (table.assignedGuests.length > 0) {
        const relationships = new Set();
        table.assignedGuests.forEach(guestId => {
          const guest = newGuests.find(g => g.id === guestId);
          if (guest) {
            relationships.add(guest.relationshipType);
          }
        });
        tableRelationships[table.name] = Array.from(relationships);
      }
    });
    
    let mixedTables = 0;
    Object.entries(tableRelationships).forEach(([tableName, relationships]) => {
      if (relationships.length > 1) {
        mixedTables++;
        console.log(`❌ ${tableName}: Mixed relationships - ${relationships.join(', ')}`);
      } else if (relationships.length === 1) {
        console.log(`✅ ${tableName}: Single relationship type - ${relationships[0]}`);
      }
    });
    
    if (mixedTables === 0) {
      console.log('\n🎉 SUCCESS: All tables have guests with the same relationship type!');
    } else {
      console.log(`\n⚠️ ISSUE: ${mixedTables} tables have mixed relationship types`);
      console.log('This suggests the auto arrangement algorithm needs improvement.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugAutoArrangementRelationshipGrouping();