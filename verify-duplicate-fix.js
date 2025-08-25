const fs = require('fs');
const path = require('path');

// Verify that the duplicate fix worked correctly
function verifyDuplicateFix() {
  try {
    console.log('🔍 Verifying Jennifer Martinez duplicate fix...\n');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    // Find Jennifer Martinez
    const jennifer = data.guests.find(g => g.name === 'Jennifer Martinez');
    if (!jennifer) {
      console.log('❌ Jennifer Martinez not found');
      return;
    }
    
    console.log('👤 Jennifer Martinez Analysis:');
    console.log(`   ID: ${jennifer.id}`);
    console.log(`   RSVP Status: ${jennifer.rsvpStatus}`);
    console.log(`   Table Assignment: ${jennifer.tableAssignment || 'null'}`);
    console.log(`   Bride/Groom Side: ${jennifer.brideOrGroomSide}`);
    console.log(`   Relationship: ${jennifer.relationshipType}`);
    
    // Check which tables have Jennifer
    const tablesWithJennifer = data.tables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(jennifer.id)
    );
    
    console.log(`\n🏓 Tables containing Jennifer: ${tablesWithJennifer.length}`);
    tablesWithJennifer.forEach(table => {
      console.log(`   - ${table.name} (${table.id})`);
    });
    
    // Overall duplicate analysis
    console.log('\n🔍 Overall Duplicate Analysis:');
    
    const allAssignedGuestIds = [];
    const duplicates = new Map();
    
    data.tables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        table.assignedGuests.forEach(guestId => {
          if (allAssignedGuestIds.includes(guestId)) {
            if (!duplicates.has(guestId)) {
              duplicates.set(guestId, []);
            }
            duplicates.get(guestId).push(table.name);
          } else {
            allAssignedGuestIds.push(guestId);
          }
        });
      }
    });
    
    if (duplicates.size > 0) {
      console.log(`❌ Found ${duplicates.size} guests with duplicate assignments:`);
      duplicates.forEach((tables, guestId) => {
        const guest = data.guests.find(g => g.id === guestId);
        console.log(`   - ${guest ? guest.name : guestId}: appears in ${tables.join(', ')}`);
      });
    } else {
      console.log('✅ No duplicate assignments found');
    }
    
    // Check consistency between guest.tableAssignment and table.assignedGuests
    console.log('\n🔍 Consistency Check:');
    
    let inconsistencies = 0;
    data.guests.forEach(guest => {
      const guestInTables = data.tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      if (guest.tableAssignment && guestInTables.length === 0) {
        console.log(`⚠️  ${guest.name}: has tableAssignment but not in any table`);
        inconsistencies++;
      }
      
      if (!guest.tableAssignment && guestInTables.length > 0) {
        console.log(`⚠️  ${guest.name}: in table but no tableAssignment`);
        inconsistencies++;
      }
      
      if (guest.tableAssignment && guestInTables.length === 1 && 
          guest.tableAssignment !== guestInTables[0].id) {
        console.log(`⚠️  ${guest.name}: tableAssignment mismatch`);
        inconsistencies++;
      }
      
      if (guestInTables.length > 1) {
        console.log(`❌ ${guest.name}: appears in multiple tables`);
        inconsistencies++;
      }
    });
    
    if (inconsistencies === 0) {
      console.log('✅ All guest-table assignments are consistent');
    } else {
      console.log(`❌ Found ${inconsistencies} inconsistencies`);
    }
    
    // Summary for Jennifer Martinez
    console.log('\n📋 Jennifer Martinez Summary:');
    
    const jenniferShouldBeSeated = jennifer.rsvpStatus === 'accepted';
    const jenniferIsSeated = tablesWithJennifer.length > 0;
    
    if (!jenniferShouldBeSeated && !jenniferIsSeated) {
      console.log('✅ Jennifer correctly unseated (RSVP not accepted)');
    } else if (jenniferShouldBeSeated && jenniferIsSeated && tablesWithJennifer.length === 1) {
      console.log('✅ Jennifer correctly seated');
    } else if (jenniferShouldBeSeated && !jenniferIsSeated) {
      console.log('⚠️  Jennifer should be seated but is not');
    } else if (!jenniferShouldBeSeated && jenniferIsSeated) {
      console.log('❌ Jennifer should not be seated but is');
    } else if (tablesWithJennifer.length > 1) {
      console.log('❌ Jennifer appears in multiple tables');
    }
    
    // Show current table assignments
    console.log('\n🏓 Current Table Assignments:');
    data.tables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        console.log(`\n${table.name} (${table.assignedGuests.length}/${table.capacity}):`);
        table.assignedGuests.forEach(guestId => {
          const guest = data.guests.find(g => g.id === guestId);
          if (guest) {
            const status = guest.rsvpStatus === 'accepted' ? '✅' : 
                          guest.rsvpStatus === 'pending' ? '⏳' : 
                          guest.rsvpStatus === 'declined' ? '❌' : '❓';
            console.log(`   ${status} ${guest.name} (${guest.brideOrGroomSide}, ${guest.relationshipType})`);
          }
        });
      }
    });
    
    console.log('\n✅ Verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyDuplicateFix();