const axios = require('axios');

async function analyzeAutoArrangement() {
  console.log('🔍 Analyzing Auto Arrangement Algorithm...\n');
  
  try {
    // Get current guests
    const guestsResponse = await axios.get('http://localhost:5000/api/guests/demo-event-1');
    const guests = guestsResponse.data.data || [];
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
    
    console.log('📋 Accepted Guests Analysis:');
    acceptedGuests.forEach(guest => {
      const totalSeats = 1 + guest.additionalGuestCount;
      console.log(`  ${guest.name}: ${guest.relationshipType} (${guest.brideOrGroomSide} side) - ${totalSeats} seats`);
    });
    
    // Group guests as the algorithm would
    console.log('\n👥 Expected Groups (as algorithm should create):');
    const groups = {};
    acceptedGuests.forEach(guest => {
      const key = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(guest);
    });
    
    Object.entries(groups).forEach(([key, guestList]) => {
      const totalSeats = guestList.reduce((sum, g) => sum + 1 + g.additionalGuestCount, 0);
      console.log(`  ${key}: ${guestList.length} guests, ${totalSeats} seats`);
      guestList.forEach(g => console.log(`    - ${g.name} (${1 + g.additionalGuestCount} seats)`));
    });
    
    // Get table capacities
    console.log('\n📊 Available Tables:');
    const tablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const tables = tablesResponse.data.filter(t => !t.isLocked);
    
    tables.forEach(table => {
      console.log(`  ${table.name}: ${table.capacity} capacity`);
    });
    
    // Calculate if separation is possible
    console.log('\n🧮 Capacity Analysis:');
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    const totalSeatsNeeded = acceptedGuests.reduce((sum, g) => sum + 1 + g.additionalGuestCount, 0);
    
    console.log(`  Total capacity: ${totalCapacity} seats`);
    console.log(`  Total needed: ${totalSeatsNeeded} seats`);
    console.log(`  Available: ${totalCapacity - totalSeatsNeeded} seats`);
    
    // Check if each group can fit in a separate table
    console.log('\n🎯 Separation Feasibility:');
    const groupEntries = Object.entries(groups);
    const sortedTables = tables.sort((a, b) => b.capacity - a.capacity);
    
    let canSeparate = true;
    groupEntries.forEach(([key, guestList], index) => {
      const seatsNeeded = guestList.reduce((sum, g) => sum + 1 + g.additionalGuestCount, 0);
      const availableTable = sortedTables[index];
      
      if (availableTable && availableTable.capacity >= seatsNeeded) {
        console.log(`  ✅ ${key} (${seatsNeeded} seats) → ${availableTable.name} (${availableTable.capacity} capacity)`);
      } else {
        console.log(`  ❌ ${key} (${seatsNeeded} seats) → No suitable table available`);
        canSeparate = false;
      }
    });
    
    if (canSeparate) {
      console.log('\n🎉 CONCLUSION: Relationship separation IS possible with current capacity');
      console.log('The algorithm should be able to keep relationship types separate.');
    } else {
      console.log('\n⚠️ CONCLUSION: Relationship separation NOT possible with current capacity');
      console.log('Some mixing is inevitable due to table capacity constraints.');
    }
    
    // Test the actual algorithm
    console.log('\n🤖 Testing Current Algorithm...');
    
    // Clear assignments
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
    
    // Run auto arrangement
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
    
    console.log(`Result: ${result.data.message}`);
    
    // Check actual results
    const finalTablesResponse = await axios.get('http://localhost:5000/api/tables/events/demo-event-1');
    const finalTables = finalTablesResponse.data;
    
    console.log('\n📊 Actual Algorithm Results:');
    finalTables.forEach(table => {
      if (table.assignedGuests.length > 0) {
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
          console.log(`  ❌ MIXED: ${Array.from(relationships).join(', ')}`);
        } else {
          console.log(`  ✅ CONSISTENT: ${Array.from(relationships)[0]}`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeAutoArrangement();