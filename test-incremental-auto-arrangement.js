const fs = require('fs');
const path = require('path');

// Test the auto-arrangement functionality incrementally to ensure it works correctly
function testIncrementalAutoArrangement() {
  try {
    console.log('🧪 Testing Incremental Auto-Arrangement Functionality...\n');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    // Step 1: Analyze current data state
    console.log('📊 Step 1: Current Data Analysis');
    console.log('=================================');
    
    const acceptedGuests = data.guests.filter(g => g.rsvpStatus === 'accepted');
    const totalSeatsNeeded = acceptedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
    const totalTableCapacity = data.tables.reduce((sum, table) => sum + table.capacity, 0);
    
    console.log(`Accepted guests: ${acceptedGuests.length}`);
    console.log(`Total seats needed: ${totalSeatsNeeded}`);
    console.log(`Total table capacity: ${totalTableCapacity}`);
    console.log(`Capacity sufficient: ${totalSeatsNeeded <= totalTableCapacity ? '✅ YES' : '❌ NO'}`);
    
    // Step 2: Test AutoArrangementService logic simulation
    console.log('\n🔧 Step 2: AutoArrangementService Logic Simulation');
    console.log('===================================================');
    
    // Simulate the createGuestGroups logic
    const familyGroups = new Map();
    acceptedGuests.forEach(guest => {
      const familyKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
      if (!familyGroups.has(familyKey)) {
        familyGroups.set(familyKey, []);
      }
      familyGroups.get(familyKey).push(guest);
    });
    
    console.log('Guest Groups (Keep Families Together):');
    familyGroups.forEach((members, key) => {
      const totalSeats = members.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      console.log(`   ${key}: ${members.length} guests, ${totalSeats} seats needed`);
      members.forEach(guest => {
        console.log(`     - ${guest.name}: ${1 + guest.additionalGuestCount} seats`);
      });
    });
    
    // Step 3: Test capacity scoring logic
    console.log('\n🎯 Step 3: Capacity Scoring Logic Test');
    console.log('======================================');
    
    // Test each family group against each table
    familyGroups.forEach((groupGuests, groupKey) => {
      const requiredSeats = groupGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      
      console.log(`\nTesting group: ${groupKey} (needs ${requiredSeats} seats)`);
      
      data.tables.forEach(table => {
        if (table.isLocked) {
          console.log(`   ${table.name}: LOCKED - skipped`);
          return;
        }
        
        // Calculate currently occupied seats
        const currentlyOccupiedSeats = table.assignedGuests.reduce((sum, guestId) => {
          const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
          return guest ? sum + 1 + guest.additionalGuestCount : sum;
        }, 0);
        
        const availableSeats = table.capacity - currentlyOccupiedSeats;
        const canFit = requiredSeats <= availableSeats;
        
        // Calculate utilization score
        let utilizationScore = 0;
        if (canFit) {
          const utilization = (currentlyOccupiedSeats + requiredSeats) / table.capacity;
          if (utilization >= 0.6 && utilization <= 0.9) {
            utilizationScore = 1.0;
          } else if (utilization >= 0.4 && utilization < 0.6) {
            utilizationScore = 0.8;
          } else if (utilization > 0.9) {
            utilizationScore = 0.6;
          } else {
            utilizationScore = 0.4;
          }
        }
        
        console.log(`   ${table.name}: ${canFit ? '✅ CAN FIT' : '❌ CANNOT FIT'} - Available: ${availableSeats}, Score: ${utilizationScore.toFixed(2)}`);
      });
    });
    
    // Step 4: Test assignment optimization
    console.log('\n🎲 Step 4: Assignment Optimization Simulation');
    console.log('==============================================');
    
    const assignments = new Map();
    const tableCapacities = new Map();
    
    // Initialize available tables
    const availableTables = data.tables.filter(table => !table.isLocked);
    availableTables.forEach(table => {
      assignments.set(table.id, []);
      const currentOccupied = table.assignedGuests.reduce((sum, guestId) => {
        const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
        return guest ? sum + 1 + guest.additionalGuestCount : sum;
      }, 0);
      tableCapacities.set(table.id, table.capacity - currentOccupied);
    });
    
    // Sort groups by relationship priority
    const relationshipPriorities = {
      'Parent': 10, 'Sibling': 9, 'Grandparent': 8, 'Uncle': 7, 'Aunt': 7,
      'Cousin': 6, 'Friend': 5, 'Colleague': 4, 'Other': 3
    };
    
    const sortedGroups = Array.from(familyGroups.entries()).sort(([keyA], [keyB]) => {
      const [, relationA] = keyA.split('-');
      const [, relationB] = keyB.split('-');
      return (relationshipPriorities[relationB] || 3) - (relationshipPriorities[relationA] || 3);
    });
    
    console.log('Assignment order (by priority):');
    sortedGroups.forEach(([key, guests], index) => {
      const [side, relation] = key.split('-');
      const priority = relationshipPriorities[relation] || 3;
      const seatsNeeded = guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      console.log(`   ${index + 1}. ${key} (Priority: ${priority}, Seats: ${seatsNeeded})`);
    });
    
    // Simulate assignment process
    console.log('\nSimulated Assignment Process:');
    sortedGroups.forEach(([groupKey, groupGuests]) => {
      const requiredSeats = groupGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      
      // Find best available table
      let bestTable = null;
      let bestScore = -1;
      
      availableTables.forEach(table => {
        const availableCapacity = tableCapacities.get(table.id) || 0;
        if (availableCapacity >= requiredSeats) {
          // Simple scoring: prefer tables with good utilization
          const utilization = (table.capacity - availableCapacity + requiredSeats) / table.capacity;
          let score = 0;
          if (utilization >= 0.6 && utilization <= 0.9) score = 1.0;
          else if (utilization >= 0.4 && utilization < 0.6) score = 0.8;
          else if (utilization > 0.9) score = 0.6;
          else score = 0.4;
          
          if (score > bestScore) {
            bestScore = score;
            bestTable = table;
          }
        }
      });
      
      if (bestTable) {
        const currentAssignments = assignments.get(bestTable.id) || [];
        assignments.set(bestTable.id, [...currentAssignments, ...groupGuests.map(g => g.id)]);
        tableCapacities.set(bestTable.id, (tableCapacities.get(bestTable.id) || 0) - requiredSeats);
        
        console.log(`   ✅ ${groupKey} → ${bestTable.name} (Score: ${bestScore.toFixed(2)})`);
      } else {
        console.log(`   ❌ ${groupKey} → No suitable table found`);
      }
    });
    
    // Step 5: Validate final assignments
    console.log('\n✅ Step 5: Final Assignment Validation');
    console.log('======================================');
    
    let totalAssignedGuests = 0;
    let totalAssignedSeats = 0;
    let hasConflicts = false;
    
    assignments.forEach((guestIds, tableId) => {
      if (guestIds.length === 0) return;
      
      const table = data.tables.find(t => t.id === tableId);
      const assignedGuests = data.guests.filter(g => guestIds.includes(g.id));
      const totalSeats = assignedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      
      totalAssignedGuests += assignedGuests.length;
      totalAssignedSeats += totalSeats;
      
      const isOverCapacity = totalSeats > table.capacity;
      if (isOverCapacity) hasConflicts = true;
      
      console.log(`\n${table.name}:`);
      console.log(`   Capacity: ${totalSeats}/${table.capacity} seats ${isOverCapacity ? '❌ OVER' : '✅ OK'}`);
      console.log(`   Guests (${assignedGuests.length}):`);
      assignedGuests.forEach(guest => {
        console.log(`     - ${guest.name}: ${1 + guest.additionalGuestCount} seats`);
      });
    });
    
    const unassignedGuests = acceptedGuests.filter(guest => 
      !Array.from(assignments.values()).flat().includes(guest.id)
    );
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total accepted guests: ${acceptedGuests.length}`);
    console.log(`   Assigned guests: ${totalAssignedGuests}`);
    console.log(`   Unassigned guests: ${unassignedGuests.length}`);
    console.log(`   Total seats used: ${totalAssignedSeats}/${totalTableCapacity}`);
    console.log(`   Capacity conflicts: ${hasConflicts ? 'YES ❌' : 'NO ✅'}`);
    
    if (unassignedGuests.length > 0) {
      console.log(`\n   Unassigned guests:`);
      unassignedGuests.forEach(guest => {
        console.log(`     - ${guest.name}: ${1 + guest.additionalGuestCount} seats needed`);
      });
    }
    
    // Step 6: Frontend compatibility check
    console.log('\n🖥️  Step 6: Frontend Compatibility Check');
    console.log('=========================================');
    
    console.log('Frontend filtering simulation:');
    const frontendEligibleGuests = data.guests.filter(g => g.rsvpStatus === 'accepted');
    console.log(`   Eligible guests for display: ${frontendEligibleGuests.length}`);
    
    console.log('\nFrontend capacity calculation simulation:');
    data.tables.forEach(table => {
      const tableGuests = data.guests.filter(guest => 
        table.assignedGuests && table.assignedGuests.includes(guest.id) && guest.rsvpStatus === 'accepted'
      );
      
      const totalSeatsNeeded = tableGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      const capacityInfo = {
        occupied: totalSeatsNeeded,
        available: table.capacity - totalSeatsNeeded,
        isOverCapacity: totalSeatsNeeded > table.capacity,
        guestCount: tableGuests.length
      };
      
      const displayText = `${capacityInfo.occupied}/${table.capacity}`;
      const guestCountDisplay = capacityInfo.guestCount > 0 && capacityInfo.guestCount !== capacityInfo.occupied 
        ? ` (${capacityInfo.guestCount} guests)` 
        : '';
      
      console.log(`   ${table.name}: "${displayText}${guestCountDisplay}" ${capacityInfo.isOverCapacity ? '❌' : '✅'}`);
    });
    
    console.log('\n🎉 Incremental Auto-Arrangement Test Completed!');
    console.log('===============================================');
    
    const overallSuccess = !hasConflicts && (totalAssignedGuests === acceptedGuests.length);
    console.log(`Overall Result: ${overallSuccess ? '✅ SUCCESS' : '⚠️  PARTIAL SUCCESS'}`);
    
    if (!overallSuccess) {
      console.log('\nRecommendations:');
      if (hasConflicts) {
        console.log('   - Review table capacities and guest additional counts');
      }
      if (totalAssignedGuests < acceptedGuests.length) {
        console.log('   - Consider adding more tables or increasing table capacities');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testIncrementalAutoArrangement();