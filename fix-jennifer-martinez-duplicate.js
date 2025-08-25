const fs = require('fs');
const path = require('path');

// Fix Jennifer Martinez duplication issue in demo data
async function fixJenniferMartinezDuplicate() {
  try {
    console.log('🔍 Analyzing Jennifer Martinez duplication issue...');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    console.log('\n📊 Current state analysis:');
    
    // Find Jennifer Martinez
    const jenniferGuest = data.guests.find(g => g.name === 'Jennifer Martinez');
    if (!jenniferGuest) {
      console.log('❌ Jennifer Martinez not found in guests');
      return;
    }
    
    console.log(`👤 Jennifer Martinez (${jenniferGuest.id}):`);
    console.log(`   - RSVP Status: ${jenniferGuest.rsvpStatus}`);
    console.log(`   - Table Assignment: ${jenniferGuest.tableAssignment || 'null'}`);
    console.log(`   - Bride/Groom Side: ${jenniferGuest.brideOrGroomSide}`);
    console.log(`   - Relationship: ${jenniferGuest.relationshipType}`);
    
    // Check which tables have Jennifer assigned
    const tablesWithJennifer = data.tables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(jenniferGuest.id)
    );
    
    console.log(`\n🏓 Tables with Jennifer in assignedGuests array:`);
    tablesWithJennifer.forEach(table => {
      console.log(`   - ${table.name} (${table.id}): ${table.assignedGuests.length}/${table.capacity} guests`);
    });
    
    // Check for inconsistencies
    console.log('\n🔍 Inconsistency Analysis:');
    
    if (jenniferGuest.rsvpStatus !== 'accepted') {
      console.log(`⚠️  Jennifer's RSVP status is "${jenniferGuest.rsvpStatus}" - she should not appear in auto-arrangement`);
    }
    
    if (jenniferGuest.tableAssignment === null && tablesWithJennifer.length > 0) {
      console.log('⚠️  Inconsistency: Guest has no tableAssignment but appears in table assignedGuests');
    }
    
    if (jenniferGuest.tableAssignment && tablesWithJennifer.length === 0) {
      console.log('⚠️  Inconsistency: Guest has tableAssignment but not in any table assignedGuests');
    }
    
    if (tablesWithJennifer.length > 1) {
      console.log('❌ DUPLICATE: Jennifer appears in multiple tables!');
    }
    
    // Fix the inconsistencies
    console.log('\n🔧 Applying fixes...');
    
    // Since Jennifer's RSVP status is "pending", she should not be assigned to any table
    if (jenniferGuest.rsvpStatus !== 'accepted') {
      console.log('✅ Removing Jennifer from all table assignments (RSVP not accepted)');
      
      // Remove from all tables
      data.tables.forEach(table => {
        if (table.assignedGuests && table.assignedGuests.includes(jenniferGuest.id)) {
          table.assignedGuests = table.assignedGuests.filter(id => id !== jenniferGuest.id);
          console.log(`   - Removed from ${table.name}`);
        }
      });
      
      // Clear guest's table assignment
      jenniferGuest.tableAssignment = null;
    }
    
    // Additional consistency check for all guests
    console.log('\n🔍 Checking all guests for similar inconsistencies...');
    
    let fixedCount = 0;
    data.guests.forEach(guest => {
      const guestInTables = data.tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      // Fix case where guest is in multiple tables
      if (guestInTables.length > 1) {
        console.log(`⚠️  ${guest.name} appears in ${guestInTables.length} tables - fixing...`);
        
        // Keep only the first assignment, remove from others
        for (let i = 1; i < guestInTables.length; i++) {
          const table = guestInTables[i];
          table.assignedGuests = table.assignedGuests.filter(id => id !== guest.id);
          console.log(`   - Removed ${guest.name} from ${table.name}`);
          fixedCount++;
        }
        
        // Update guest's tableAssignment to match the remaining table
        guest.tableAssignment = guestInTables[0].id;
      }
      
      // Fix case where guest has tableAssignment but not in any table
      if (guest.tableAssignment && guestInTables.length === 0) {
        console.log(`⚠️  ${guest.name} has tableAssignment but not in any table - clearing assignment`);
        guest.tableAssignment = null;
        fixedCount++;
      }
      
      // Fix case where guest is in table but has no tableAssignment
      if (!guest.tableAssignment && guestInTables.length === 1) {
        console.log(`⚠️  ${guest.name} is in table but has no tableAssignment - setting assignment`);
        guest.tableAssignment = guestInTables[0].id;
        fixedCount++;
      }
      
      // Fix case where guest is in table but tableAssignment doesn't match
      if (guest.tableAssignment && guestInTables.length === 1 && 
          guest.tableAssignment !== guestInTables[0].id) {
        console.log(`⚠️  ${guest.name} tableAssignment mismatch - syncing with table`);
        guest.tableAssignment = guestInTables[0].id;
        fixedCount++;
      }
    });
    
    console.log(`\n✅ Fixed ${fixedCount} consistency issues`);
    
    // Save the corrected data
    fs.writeFileSync(demoDataPath, JSON.stringify(data, null, 2));
    console.log('💾 Demo data updated successfully');
    
    // Final verification
    console.log('\n🔍 Final verification:');
    const jenniferAfter = data.guests.find(g => g.name === 'Jennifer Martinez');
    const tablesWithJenniferAfter = data.tables.filter(table => 
      table.assignedGuests && table.assignedGuests.includes(jenniferAfter.id)
    );
    
    console.log(`👤 Jennifer Martinez final state:`);
    console.log(`   - RSVP Status: ${jenniferAfter.rsvpStatus}`);
    console.log(`   - Table Assignment: ${jenniferAfter.tableAssignment || 'null'}`);
    console.log(`   - In ${tablesWithJenniferAfter.length} table(s)`);
    
    if (jenniferAfter.rsvpStatus !== 'accepted' && tablesWithJenniferAfter.length === 0) {
      console.log('✅ Jennifer Martinez duplication issue resolved!');
    } else {
      console.log('❌ Issue may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Jennifer Martinez duplicate:', error);
  }
}

// Run the fix
fixJenniferMartinezDuplicate();