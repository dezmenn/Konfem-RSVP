const fs = require('fs');
const path = require('path');

// Test that Jennifer Martinez duplication is fixed
function testJenniferMartinezFix() {
  try {
    console.log('🧪 Testing Jennifer Martinez Duplication Fix...\n');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    // Find Jennifer Martinez
    const jennifer = data.guests.find(g => g.name === 'Jennifer Martinez');
    if (!jennifer) {
      console.log('❌ Jennifer Martinez not found');
      return;
    }
    
    console.log('👤 Jennifer Martinez Current State:');
    console.log(`   - ID: ${jennifer.id}`);
    console.log(`   - RSVP Status: ${jennifer.rsvpStatus}`);
    console.log(`   - Table Assignment: ${jennifer.tableAssignment || 'null'}`);
    console.log(`   - Should be visible in auto-arrangement: ${jennifer.rsvpStatus === 'accepted' ? 'YES' : 'NO'}`);
    
    // Check which tables have Jennifer
    const tablesWithJennifer = data.tables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(jennifer.id)
    );
    
    console.log(`\n🏓 Tables containing Jennifer: ${tablesWithJennifer.length}`);
    if (tablesWithJennifer.length > 0) {
      tablesWithJennifer.forEach(table => {
        console.log(`   - ${table.name} (${table.id})`);
      });
    }
    
    // Simulate the frontend filtering logic
    console.log('\n🔍 Frontend Logic Simulation:');
    
    // This simulates the categorizeGuests function with the fix
    const eligibleGuests = data.guests.filter(guest => guest.rsvpStatus === 'accepted');
    const jenniferEligible = eligibleGuests.find(g => g.name === 'Jennifer Martinez');
    
    console.log(`   - Total guests: ${data.guests.length}`);
    console.log(`   - Guests with accepted RSVP: ${eligibleGuests.length}`);
    console.log(`   - Jennifer in eligible guests: ${jenniferEligible ? 'YES' : 'NO'}`);
    
    if (jenniferEligible) {
      const jenniferInTable = tablesWithJennifer.length > 0;
      console.log(`   - Jennifer would appear in: ${jenniferInTable ? 'Table' : 'Unassigned Guests'}`);
    } else {
      console.log('   - Jennifer would NOT appear in auto-arrangement UI');
    }
    
    // Test the getGuestsByTable logic for each table
    console.log('\n🏓 Table Guest Display Simulation:');
    data.tables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        // Simulate the getGuestsByTable function with the fix
        const tableGuests = data.guests.filter(guest => 
          table.assignedGuests.includes(guest.id) && guest.rsvpStatus === 'accepted'
        );
        
        console.log(`\n   ${table.name}:`);
        console.log(`   - Assigned guest IDs: [${table.assignedGuests.join(', ')}]`);
        console.log(`   - Visible guests (accepted RSVP only): ${tableGuests.length}`);
        
        tableGuests.forEach(guest => {
          console.log(`     ✅ ${guest.name} (${guest.rsvpStatus})`);
        });
        
        // Show filtered out guests
        const filteredGuests = data.guests.filter(guest => 
          table.assignedGuests.includes(guest.id) && guest.rsvpStatus !== 'accepted'
        );
        
        if (filteredGuests.length > 0) {
          console.log(`   - Filtered out guests (non-accepted RSVP): ${filteredGuests.length}`);
          filteredGuests.forEach(guest => {
            console.log(`     🚫 ${guest.name} (${guest.rsvpStatus})`);
          });
        }
      }
    });
    
    // Final assessment
    console.log('\n📋 Final Assessment:');
    
    const shouldShowJennifer = jennifer.rsvpStatus === 'accepted';
    const jenniferInTables = tablesWithJennifer.length > 0;
    
    if (!shouldShowJennifer) {
      console.log('✅ Jennifer Martinez will NOT appear in auto-arrangement (RSVP not accepted)');
      console.log('✅ This resolves the duplication issue - she won\'t show in unseated OR tables');
    } else if (shouldShowJennifer && jenniferInTables && tablesWithJennifer.length === 1) {
      console.log('✅ Jennifer Martinez will appear ONLY in her assigned table');
    } else if (shouldShowJennifer && !jenniferInTables) {
      console.log('✅ Jennifer Martinez will appear ONLY in unassigned guests');
    } else if (tablesWithJennifer.length > 1) {
      console.log('❌ Jennifer Martinez still has duplicate table assignments');
    }
    
    // Check for any other potential duplicates
    console.log('\n🔍 Checking for other potential duplicates...');
    
    const allAssignedGuestIds = [];
    const duplicateIssues = [];
    
    data.tables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        table.assignedGuests.forEach(guestId => {
          if (allAssignedGuestIds.includes(guestId)) {
            const guest = data.guests.find(g => g.id === guestId);
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
      }
    });
    
    if (duplicateIssues.length > 0) {
      console.log(`❌ Found ${duplicateIssues.length} duplicate assignments in data:`);
      duplicateIssues.forEach(issue => {
        console.log(`   - ${issue.guestName} appears in multiple tables including ${issue.tableName}`);
      });
    } else {
      console.log('✅ No duplicate assignments found in data');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJenniferMartinezFix();