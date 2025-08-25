const fs = require('fs');
const path = require('path');

// Test auto-arrangement to ensure no duplicates
async function testAutoArrangementNoDuplicates() {
  try {
    console.log('🧪 Testing Auto-Arrangement for Duplicates...\n');
    
    // Start the backend server in demo mode
    console.log('🚀 Starting backend server...');
    const { spawn } = require('child_process');
    
    const backendProcess = spawn('npm', ['run', 'dev:backend'], {
      cwd: path.join(__dirname, 'rsvp-backend'),
      env: { ...process.env, SKIP_DB_SETUP: 'true' },
      stdio: 'pipe'
    });
    
    // Wait for server to start
    await new Promise((resolve) => {
      backendProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Server running on port')) {
          console.log('✅ Backend server started');
          resolve();
        }
      });
    });
    
    // Wait a bit more for full initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 Testing Auto-Arrangement API...');
    
    // Test auto-arrangement
    const response = await fetch('http://localhost:3001/api/tables/events/demo-event-1/auto-arrange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        maxGuestsPerTable: 8
      })
    });
    
    const result = await response.json();
    console.log('🎯 Auto-arrangement result:', result.success ? 'SUCCESS' : 'FAILED');
    console.log('📝 Message:', result.message);
    
    if (result.success) {
      console.log(`👥 Arranged ${result.arrangedGuests} guests`);
      console.log(`🏓 Used ${result.tableAssignments ? Object.keys(result.tableAssignments).length : 0} tables`);
      
      if (result.conflicts && result.conflicts.length > 0) {
        console.log(`⚠️  ${result.conflicts.length} conflicts detected:`);
        result.conflicts.forEach(conflict => {
          console.log(`   - ${conflict.severity.toUpperCase()}: ${conflict.message}`);
        });
      }
    }
    
    // Fetch current guest and table data to verify no duplicates
    console.log('\n🔍 Verifying no duplicates in current data...');
    
    const guestsResponse = await fetch('http://localhost:3001/api/guests/demo-event-1');
    const guestsResult = await guestsResponse.json();
    
    const tablesResponse = await fetch('http://localhost:3001/api/tables/events/demo-event-1');
    const tablesResult = await tablesResponse.json();
    
    if (guestsResult.success && tablesResult.success) {
      const guests = guestsResult.data;
      const tables = tablesResult.data || tablesResult;
      
      console.log(`📊 Current data: ${guests.length} guests, ${tables.length} tables`);
      
      // Check for duplicates in table assignments
      const allAssignedGuestIds = [];
      const duplicateIssues = [];
      
      tables.forEach(table => {
        if (table.assignedGuests && table.assignedGuests.length > 0) {
          console.log(`🏓 ${table.name}: ${table.assignedGuests.length}/${table.capacity} guests`);
          
          table.assignedGuests.forEach(guestId => {
            if (allAssignedGuestIds.includes(guestId)) {
              const guest = guests.find(g => g.id === guestId);
              duplicateIssues.push({
                guestId,
                guestName: guest ? guest.name : 'Unknown',
                tableId: table.id,
                tableName: table.name
              });
            } else {
              allAssignedGuestIds.push(guestId);
            }
          });
          
          // Show guest names for this table
          const tableGuests = guests.filter(g => table.assignedGuests.includes(g.id));
          tableGuests.forEach(guest => {
            console.log(`   - ${guest.name} (${guest.brideOrGroomSide}, ${guest.relationshipType})`);
          });
        }
      });
      
      // Check for guests who should be unseated (not accepted RSVP)
      const unseatedGuests = guests.filter(guest => {
        const isAssigned = allAssignedGuestIds.includes(guest.id);
        const shouldBeSeated = guest.rsvpStatus === 'accepted';
        return !shouldBeSeated || !isAssigned;
      });
      
      console.log(`\n👥 Unseated guests (${unseatedGuests.length}):`);
      unseatedGuests.forEach(guest => {
        const reason = guest.rsvpStatus !== 'accepted' ? `RSVP: ${guest.rsvpStatus}` : 'No table assignment';
        console.log(`   - ${guest.name} (${reason})`);
      });
      
      // Report duplicate issues
      if (duplicateIssues.length > 0) {
        console.log(`\n❌ DUPLICATE ISSUES FOUND (${duplicateIssues.length}):`);
        duplicateIssues.forEach(issue => {
          console.log(`   - ${issue.guestName} appears in multiple tables including ${issue.tableName}`);
        });
      } else {
        console.log('\n✅ NO DUPLICATES FOUND - All guests appear in at most one table');
      }
      
      // Check for Jennifer Martinez specifically
      const jennifer = guests.find(g => g.name === 'Jennifer Martinez');
      if (jennifer) {
        const jenniferInTables = tables.filter(table => 
          table.assignedGuests && table.assignedGuests.includes(jennifer.id)
        );
        
        console.log(`\n👤 Jennifer Martinez status:`);
        console.log(`   - RSVP: ${jennifer.rsvpStatus}`);
        console.log(`   - Table Assignment: ${jennifer.tableAssignment || 'null'}`);
        console.log(`   - Appears in ${jenniferInTables.length} table(s)`);
        
        if (jennifer.rsvpStatus !== 'accepted' && jenniferInTables.length === 0) {
          console.log('   ✅ Correctly unseated (RSVP not accepted)');
        } else if (jennifer.rsvpStatus === 'accepted' && jenniferInTables.length === 1) {
          console.log('   ✅ Correctly seated');
        } else {
          console.log('   ❌ Status inconsistent');
        }
      }
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up...');
    backendProcess.kill();
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutoArrangementNoDuplicates();