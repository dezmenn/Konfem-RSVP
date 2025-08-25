const fs = require('fs');
const path = require('path');

// Test the enhanced drag and drop functionality with table locking
function testDragDropFunctionality() {
  try {
    console.log('🧪 Testing Enhanced Drag & Drop Functionality...\n');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    // Step 1: Analyze current data state for drag and drop testing
    console.log('📊 Step 1: Current Data State Analysis');
    console.log('=====================================');
    
    const acceptedGuests = data.guests.filter(g => g.rsvpStatus === 'accepted');
    console.log(`Accepted guests available for drag & drop: ${acceptedGuests.length}`);
    
    acceptedGuests.forEach(guest => {
      const seatsNeeded = 1 + guest.additionalGuestCount;
      const currentTable = data.tables.find(t => t.assignedGuests && t.assignedGuests.includes(guest.id));
      console.log(`   - ${guest.name}: ${seatsNeeded} seats, currently ${currentTable ? `at ${currentTable.name}` : 'unassigned'}`);
    });
    
    console.log(`\nTable states:`);
    data.tables.forEach(table => {
      const currentOccupied = table.assignedGuests ? table.assignedGuests.reduce((sum, guestId) => {
        const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
        return guest ? sum + 1 + guest.additionalGuestCount : sum;
      }, 0) : 0;
      
      const lockStatus = table.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED';
      console.log(`   - ${table.name}: ${currentOccupied}/${table.capacity} seats, ${lockStatus}`);
    });
    
    // Step 2: Test drag and drop scenarios
    console.log('\n🎯 Step 2: Drag & Drop Scenarios Testing');
    console.log('========================================');
    
    // Scenario 1: Drag from unassigned to table
    const unassignedGuests = acceptedGuests.filter(guest => 
      !data.tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    console.log('\nScenario 1: Drag from Unassigned to Table');
    console.log('------------------------------------------');
    if (unassignedGuests.length > 0) {
      const testGuest = unassignedGuests[0];
      const guestSeatsNeeded = 1 + testGuest.additionalGuestCount;
      
      console.log(`Testing guest: ${testGuest.name} (needs ${guestSeatsNeeded} seats)`);
      
      data.tables.forEach(table => {
        const currentOccupied = table.assignedGuests ? table.assignedGuests.reduce((sum, guestId) => {
          const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
          return guest ? sum + 1 + guest.additionalGuestCount : sum;
        }, 0) : 0;
        
        const available = table.capacity - currentOccupied;
        const canDrop = !table.isLocked && available >= guestSeatsNeeded;
        
        let status = '';
        if (table.isLocked) {
          status = '❌ BLOCKED (Table locked)';
        } else if (available < guestSeatsNeeded) {
          status = `❌ BLOCKED (Need ${guestSeatsNeeded}, have ${available})`;
        } else {
          status = '✅ ALLOWED';
        }
        
        console.log(`   → ${table.name}: ${status}`);
      });
    } else {
      console.log('   No unassigned guests available for testing');
    }
    
    // Scenario 2: Drag between tables
    console.log('\nScenario 2: Drag Between Tables');
    console.log('--------------------------------');
    const assignedGuests = acceptedGuests.filter(guest => 
      data.tables.some(table => table.assignedGuests && table.assignedGuests.includes(guest.id))
    );
    
    if (assignedGuests.length > 0) {
      const testGuest = assignedGuests[0];
      const guestSeatsNeeded = 1 + testGuest.additionalGuestCount;
      const currentTable = data.tables.find(t => t.assignedGuests && t.assignedGuests.includes(testGuest.id));
      
      console.log(`Testing guest: ${testGuest.name} (needs ${guestSeatsNeeded} seats, currently at ${currentTable.name})`);
      
      data.tables.forEach(table => {
        if (table.id === currentTable.id) {
          console.log(`   → ${table.name}: ⚪ CURRENT TABLE (no change)`);
          return;
        }
        
        const currentOccupied = table.assignedGuests ? table.assignedGuests.reduce((sum, guestId) => {
          const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
          return guest ? sum + 1 + guest.additionalGuestCount : sum;
        }, 0) : 0;
        
        const available = table.capacity - currentOccupied;
        const canDrop = !table.isLocked && available >= guestSeatsNeeded;
        
        let status = '';
        if (table.isLocked) {
          status = '❌ BLOCKED (Table locked)';
        } else if (available < guestSeatsNeeded) {
          status = `❌ BLOCKED (Need ${guestSeatsNeeded}, have ${available})`;
        } else {
          status = '✅ ALLOWED';
        }
        
        console.log(`   → ${table.name}: ${status}`);
      });
    } else {
      console.log('   No assigned guests available for testing');
    }
    
    // Scenario 3: Drag to unassigned area
    console.log('\nScenario 3: Drag to Unassigned Area');
    console.log('------------------------------------');
    if (assignedGuests.length > 0) {
      const testGuest = assignedGuests[0];
      const currentTable = data.tables.find(t => t.assignedGuests && t.assignedGuests.includes(testGuest.id));
      
      console.log(`Testing guest: ${testGuest.name} (currently at ${currentTable.name})`);
      console.log(`   → Unassigned Area: ✅ ALWAYS ALLOWED (removes from current table)`);
    } else {
      console.log('   No assigned guests available for testing');
    }
    
    // Step 3: Test table locking functionality
    console.log('\n🔒 Step 3: Table Locking Functionality');
    console.log('======================================');
    
    console.log('Lock/Unlock button behavior:');
    data.tables.forEach(table => {
      const currentStatus = table.isLocked ? 'LOCKED' : 'UNLOCKED';
      const buttonIcon = table.isLocked ? '🔒' : '🔓';
      const buttonAction = table.isLocked ? 'unlock' : 'lock';
      const tooltip = table.isLocked 
        ? 'Unlock table (allow auto-arrangement)' 
        : 'Lock table (prevent auto-arrangement)';
      
      console.log(`\n${table.name}:`);
      console.log(`   Current status: ${currentStatus}`);
      console.log(`   Button shows: ${buttonIcon}`);
      console.log(`   Click action: ${buttonAction}`);
      console.log(`   Tooltip: "${tooltip}"`);
      console.log(`   API call: POST /api/tables/${table.id}/${buttonAction}`);
    });
    
    // Step 4: Test auto-arrangement with locked tables
    console.log('\n🤖 Step 4: Auto-Arrangement with Locked Tables');
    console.log('===============================================');
    
    const lockedTables = data.tables.filter(t => t.isLocked);
    const unlockedTables = data.tables.filter(t => !t.isLocked);
    
    console.log(`Locked tables: ${lockedTables.length}`);
    lockedTables.forEach(table => {
      const guestCount = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`   - ${table.name}: ${guestCount} guests (will be preserved)`);
    });
    
    console.log(`\nUnlocked tables: ${unlockedTables.length}`);
    unlockedTables.forEach(table => {
      const guestCount = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`   - ${table.name}: ${guestCount} guests (can be rearranged)`);
    });
    
    const totalCapacityUnlocked = unlockedTables.reduce((sum, table) => sum + table.capacity, 0);
    const totalSeatsInLocked = lockedTables.reduce((sum, table) => {
      return sum + (table.assignedGuests ? table.assignedGuests.reduce((guestSum, guestId) => {
        const guest = data.guests.find(g => g.id === guestId && g.rsvpStatus === 'accepted');
        return guest ? guestSum + 1 + guest.additionalGuestCount : guestSum;
      }, 0) : 0);
    }, 0);
    
    const totalSeatsNeeded = acceptedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
    const seatsNeededForUnlocked = totalSeatsNeeded - totalSeatsInLocked;
    
    console.log(`\nCapacity analysis for auto-arrangement:`);
    console.log(`   Total seats needed: ${totalSeatsNeeded}`);
    console.log(`   Seats in locked tables: ${totalSeatsInLocked}`);
    console.log(`   Seats needed for unlocked tables: ${seatsNeededForUnlocked}`);
    console.log(`   Available capacity in unlocked tables: ${totalCapacityUnlocked}`);
    console.log(`   Auto-arrangement feasible: ${seatsNeededForUnlocked <= totalCapacityUnlocked ? '✅ YES' : '❌ NO'}`);
    
    // Step 5: Frontend implementation verification
    console.log('\n🖥️  Step 5: Frontend Implementation Verification');
    console.log('================================================');
    
    const autoArrangementPath = path.join(__dirname, 'rsvp-web', 'src', 'components', 'AutoTableArrangement.tsx');
    const autoArrangementContent = fs.readFileSync(autoArrangementPath, 'utf8');
    
    // Check for key features
    const features = {
      'Table guests draggable': autoArrangementContent.includes('draggable') && autoArrangementContent.includes('onDragStart={(e) => handleGuestDragStart(e, guest)}'),
      'Lock button present': autoArrangementContent.includes('lock-button') && autoArrangementContent.includes('toggleTableLock'),
      'Lock check in drop handler': autoArrangementContent.includes('table.isLocked') && autoArrangementContent.includes('cannot accept new guests'),
      'Lock/unlock API calls': autoArrangementContent.includes('/lock') && autoArrangementContent.includes('/unlock'),
      'Visual lock indicators': autoArrangementContent.includes('🔒') && autoArrangementContent.includes('🔓'),
      'Capacity validation': autoArrangementContent.includes('guestSeatsNeeded') && autoArrangementContent.includes('additionalGuestCount')
    };
    
    console.log('Feature implementation status:');
    Object.entries(features).forEach(([feature, implemented]) => {
      console.log(`   ${implemented ? '✅' : '❌'} ${feature}`);
    });
    
    // Check CSS implementation
    const cssPath = path.join(__dirname, 'rsvp-web', 'src', 'components', 'AutoTableArrangement.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const cssFeatures = {
      'Lock button styling': cssContent.includes('.lock-button'),
      'Table title layout': cssContent.includes('.table-title'),
      'Draggable guest styling': cssContent.includes('.table-guest') && cssContent.includes('cursor: grab'),
      'Hover effects': cssContent.includes(':hover') && cssContent.includes('transform'),
      'Lock state colors': cssContent.includes('.locked') && cssContent.includes('.unlocked')
    };
    
    console.log('\nCSS implementation status:');
    Object.entries(cssFeatures).forEach(([feature, implemented]) => {
      console.log(`   ${implemented ? '✅' : '❌'} ${feature}`);
    });
    
    // Step 6: User experience flow
    console.log('\n👤 Step 6: User Experience Flow');
    console.log('===============================');
    
    console.log('Expected user interactions:');
    console.log('\n1. Dragging unassigned guests to tables:');
    console.log('   - Guest shows drag cursor on hover');
    console.log('   - Can drag to any unlocked table with capacity');
    console.log('   - Cannot drag to locked tables (shows alert)');
    console.log('   - Cannot drag to full tables (shows alert)');
    
    console.log('\n2. Dragging guests between tables:');
    console.log('   - Table guests are draggable');
    console.log('   - Can move between unlocked tables');
    console.log('   - Cannot move to locked tables');
    console.log('   - Automatically unassigns from source table');
    
    console.log('\n3. Dragging guests to unassigned area:');
    console.log('   - Always allowed');
    console.log('   - Removes guest from current table');
    console.log('   - Guest appears in unassigned list');
    
    console.log('\n4. Table locking:');
    console.log('   - Click lock button to toggle state');
    console.log('   - Visual feedback with lock icons');
    console.log('   - Locked tables protected from auto-arrangement');
    console.log('   - Locked tables reject new guest drops');
    
    console.log('\n5. Auto-arrangement behavior:');
    console.log('   - Respects locked tables');
    console.log('   - Only rearranges guests in unlocked tables');
    console.log('   - Preserves manual arrangements in locked tables');
    
    console.log('\n🎉 Enhanced Drag & Drop Functionality Test Completed!');
    console.log('=====================================================');
    
    const allFeaturesImplemented = Object.values(features).every(f => f) && Object.values(cssFeatures).every(f => f);
    console.log(`Overall Implementation: ${allFeaturesImplemented ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
    
    if (allFeaturesImplemented) {
      console.log('\n🎯 Summary: All drag & drop and table locking features are fully implemented!');
      console.log('Users can now:');
      console.log('- Drag guests between tables and to/from unassigned area');
      console.log('- Lock/unlock tables to control auto-arrangement behavior');
      console.log('- Get visual feedback for all interactions');
      console.log('- Experience proper capacity and lock validation');
    } else {
      console.log('\n⚠️  Summary: Some features may need additional implementation.');
      console.log('Please review the feature status above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDragDropFunctionality();