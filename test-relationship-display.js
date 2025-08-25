const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testRelationshipDisplay() {
  console.log('🧪 Testing Relationship Display in Table Arrangements');
  console.log('=' .repeat(60));

  try {
    // Step 1: Load current guests and tables
    console.log('\n📊 Loading current data...');
    const [guestsResponse, tablesResponse] = await Promise.all([
      fetch(`${API_BASE}/guests/${EVENT_ID}`),
      fetch(`${API_BASE}/tables/events/${EVENT_ID}`)
    ]);

    const guestsData = await guestsResponse.json();
    const tablesData = await tablesResponse.json();

    if (!guestsData.success) {
      throw new Error(`Failed to load guests: ${guestsData.error}`);
    }

    const guests = guestsData.data;
    const tables = tablesData;

    console.log(`✅ Loaded ${guests.length} guests and ${tables.length} tables`);

    // Step 2: Show relationship distribution
    console.log('\n👥 Guest Relationship Distribution:');
    const relationshipCounts = {};
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');

    acceptedGuests.forEach(guest => {
      relationshipCounts[guest.relationshipType] = (relationshipCounts[guest.relationshipType] || 0) + 1;
    });

    Object.entries(relationshipCounts).forEach(([relationship, count]) => {
      console.log(`  ${relationship}: ${count} guests`);
    });

    // Step 3: Perform auto arrangement to create assignments
    console.log('\n🎯 Performing auto arrangement to create table assignments...');
    const autoArrangeResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}/auto-arrange-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        constraints: {
          respectRelationships: true,
          considerDietaryRestrictions: false,
          keepFamiliesTogether: true,
          optimizeVenueProximity: true,
          minGuestsPerTable: 2,
          preferredTableDistance: 100
        }
      })
    });

    const arrangeResult = await autoArrangeResponse.json();
    
    if (!arrangeResult.success) {
      throw new Error(`Auto arrangement failed: ${arrangeResult.message}`);
    }

    console.log(`✅ Auto arrangement completed: ${arrangeResult.message}`);

    // Step 4: Load updated data and display table assignments with relationships
    console.log('\n📋 Table Assignments with Relationship Information:');
    
    // Reload guests to get updated assignments
    const updatedGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const updatedGuestsData = await updatedGuestsResponse.json();
    const updatedGuests = updatedGuestsData.data;

    // Reload tables to get updated assignments
    const updatedTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const updatedTables = await updatedTablesResponse.json();

    // Display each table with guest names and relationships
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        table.assignedGuests && table.assignedGuests.includes(g.id)
      );
      
      const acceptedTableGuests = tableGuests.filter(g => g.rsvpStatus === 'accepted');
      
      if (acceptedTableGuests.length > 0) {
        console.log(`\n  📋 ${table.name} (${acceptedTableGuests.length} guests):`);
        
        acceptedTableGuests.forEach(guest => {
          const additionalText = guest.additionalGuestCount > 0 ? ` (+${guest.additionalGuestCount})` : '';
          console.log(`    👤 ${guest.name} - ${guest.relationshipType} (${guest.brideOrGroomSide})${additionalText}`);
        });
        
        // Show relationship summary for this table
        const tableRelationships = [...new Set(acceptedTableGuests.map(g => g.relationshipType))];
        const tableSides = [...new Set(acceptedTableGuests.map(g => g.brideOrGroomSide))];
        
        console.log(`    🤝 Relationships: ${tableRelationships.join(', ')}`);
        console.log(`    💒 Sides: ${tableSides.join(', ')}`);
        
        // Calculate total seats needed
        const totalSeats = acceptedTableGuests.reduce((sum, g) => sum + 1 + (g.additionalGuestCount || 0), 0);
        console.log(`    🪑 Capacity: ${totalSeats}/${table.capacity} seats used`);
      }
    });

    // Step 5: Verify relationship-based grouping
    console.log('\n🔍 Relationship Grouping Analysis:');
    let pureRelationshipTables = 0;
    let mixedRelationshipTables = 0;
    
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        table.assignedGuests && table.assignedGuests.includes(g.id) && g.rsvpStatus === 'accepted'
      );
      
      if (tableGuests.length > 0) {
        const relationships = [...new Set(tableGuests.map(g => g.relationshipType))];
        
        if (relationships.length === 1) {
          pureRelationshipTables++;
          console.log(`  ✅ ${table.name}: Pure relationship group (${relationships[0]})`);
        } else {
          mixedRelationshipTables++;
          console.log(`  ⚠️ ${table.name}: Mixed relationships (${relationships.join(', ')})`);
        }
      }
    });

    const totalTablesWithGuests = pureRelationshipTables + mixedRelationshipTables;
    const relationshipSeparationPercentage = totalTablesWithGuests > 0 ? 
      ((pureRelationshipTables / totalTablesWithGuests) * 100).toFixed(1) : 0;

    console.log(`\n📊 Relationship Separation Score: ${relationshipSeparationPercentage}% (${pureRelationshipTables}/${totalTablesWithGuests} tables)`);

    // Step 6: Test data structure for frontend display
    console.log('\n🖥️ Frontend Display Data Structure:');
    console.log('Each guest in tables should display:');
    console.log('  - Guest Name');
    console.log('  - Relationship Type (as badge/tag)');
    console.log('  - Additional guest count (if > 0)');
    
    // Show example data structure
    const exampleTable = updatedTables.find(t => {
      const guests = updatedGuests.filter(g => 
        t.assignedGuests && t.assignedGuests.includes(g.id) && g.rsvpStatus === 'accepted'
      );
      return guests.length > 0;
    });

    if (exampleTable) {
      const exampleGuests = updatedGuests.filter(g => 
        exampleTable.assignedGuests && exampleTable.assignedGuests.includes(g.id) && g.rsvpStatus === 'accepted'
      );
      
      console.log(`\n📋 Example: ${exampleTable.name}`);
      exampleGuests.forEach(guest => {
        console.log(`  {`);
        console.log(`    name: "${guest.name}",`);
        console.log(`    relationshipType: "${guest.relationshipType}",`);
        console.log(`    brideOrGroomSide: "${guest.brideOrGroomSide}",`);
        console.log(`    additionalGuestCount: ${guest.additionalGuestCount || 0}`);
        console.log(`  }`);
      });
    }

    // Step 7: Summary
    console.log('\n📈 Relationship Display Test Summary:');
    console.log(`  👥 Total guests: ${guests.length}`);
    console.log(`  ✅ Accepted guests: ${acceptedGuests.length}`);
    console.log(`  🪑 Tables with guests: ${totalTablesWithGuests}`);
    console.log(`  🤝 Pure relationship tables: ${pureRelationshipTables}`);
    console.log(`  ⚠️ Mixed relationship tables: ${mixedRelationshipTables}`);
    console.log(`  📊 Relationship separation: ${relationshipSeparationPercentage}%`);

    console.log('\n🎉 Relationship display test completed successfully!');
    console.log('✅ Frontend components should now display:');
    console.log('   - Guest names with relationship badges in table views');
    console.log('   - Proper relationship-based grouping');
    console.log('   - Clear visual distinction between relationship types');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRelationshipDisplay();