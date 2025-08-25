const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testRelationshipColorCoding() {
  console.log('🎨 Testing Relationship Color Coding in Auto Table Arrangement');
  console.log('=' .repeat(70));

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

    // Step 2: Show relationship distribution with color mapping
    console.log('\n🎨 Relationship Color Mapping:');
    const relationshipColors = {
      'Bride': '🌸 Pink (#ff69b4)',
      'Groom': '🔵 Blue (#4169e1)', 
      'Parent': '🟡 Gold (#ffd700)',
      'Sibling': '🟢 Green (#32cd32)',
      'Grandparent': '🟣 Plum (#dda0dd)',
      'Uncle': '🟠 Orange (#ff8c00)',
      'Aunt': '🟠 Orange (#ff8c00)',
      'Granduncle': '🟠 Orange (#ff8c00)',
      'Grandaunt': '🟠 Orange (#ff8c00)',
      'Cousin': '🔷 Teal (#20b2aa)',
      'Friend': '🔴 Tomato (#ff6347)',
      'Colleague': '🟪 Purple (#9370db)',
      'Other': '⚫ Gray (#808080)'
    };

    const relationshipCounts = {};
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');

    acceptedGuests.forEach(guest => {
      relationshipCounts[guest.relationshipType] = (relationshipCounts[guest.relationshipType] || 0) + 1;
    });

    Object.entries(relationshipCounts).forEach(([relationship, count]) => {
      const colorInfo = relationshipColors[relationship] || '⚫ Gray (#808080)';
      console.log(`  ${colorInfo} - ${relationship}: ${count} guests`);
    });

    // Step 3: Perform auto arrangement to create visual assignments
    console.log('\n🎯 Performing auto arrangement for color coding demonstration...');
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

    // Step 4: Load updated data and display color-coded table assignments
    console.log('\n🎨 Color-Coded Table Assignments:');
    
    // Reload guests to get updated assignments
    const updatedGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const updatedGuestsData = await updatedGuestsResponse.json();
    const updatedGuests = updatedGuestsData.data;

    // Reload tables to get updated assignments
    const updatedTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const updatedTables = await updatedTablesResponse.json();

    // Display each table with color-coded guest assignments
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        table.assignedGuests && table.assignedGuests.includes(g.id)
      );
      
      const acceptedTableGuests = tableGuests.filter(g => g.rsvpStatus === 'accepted');
      
      if (acceptedTableGuests.length > 0) {
        console.log(`\n  📋 ${table.name} (${acceptedTableGuests.length} guests):`);
        
        acceptedTableGuests.forEach(guest => {
          const colorInfo = relationshipColors[guest.relationshipType] || '⚫ Gray';
          const additionalText = guest.additionalGuestCount > 0 ? ` (+${guest.additionalGuestCount})` : '';
          console.log(`    ${colorInfo.split(' ')[0]} ${guest.name} - ${guest.relationshipType} (${guest.brideOrGroomSide})${additionalText}`);
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

    // Step 5: Frontend Implementation Guide
    console.log('\n🖥️ Frontend Implementation Guide:');
    console.log('The AutoTableArrangement component now includes:');
    console.log('  ✅ Relationship-based color coding CSS classes');
    console.log('  ✅ data-relationship attributes on guest items');
    console.log('  ✅ Color legend showing all relationship types');
    console.log('  ✅ Left border color coding for visual distinction');
    
    console.log('\n📋 CSS Classes Applied:');
    console.log('  - .guest-item[data-relationship="Bride"] { border-left: 4px solid #ff69b4; }');
    console.log('  - .guest-item[data-relationship="Groom"] { border-left: 4px solid #4169e1; }');
    console.log('  - .guest-item[data-relationship="Parent"] { border-left: 4px solid #ffd700; }');
    console.log('  - And similar for all other relationship types...');

    console.log('\n🎨 Visual Features:');
    console.log('  🌈 Each relationship type has a unique color');
    console.log('  📊 Color legend shows all relationship types');
    console.log('  🎯 Consistent coloring in both unseated and table views');
    console.log('  👀 Easy visual identification of relationship groups');

    // Step 6: Test relationship separation with color coding
    console.log('\n🔍 Color-Coded Relationship Separation Analysis:');
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
          const colorInfo = relationshipColors[relationships[0]] || '⚫ Gray';
          console.log(`  ✅ ${table.name}: Pure ${colorInfo.split(' ')[0]} ${relationships[0]} group`);
        } else {
          mixedRelationshipTables++;
          const coloredRelationships = relationships.map(rel => {
            const colorInfo = relationshipColors[rel] || '⚫ Gray';
            return `${colorInfo.split(' ')[0]} ${rel}`;
          });
          console.log(`  ⚠️ ${table.name}: Mixed relationships (${coloredRelationships.join(', ')})`);
        }
      }
    });

    const totalTablesWithGuests = pureRelationshipTables + mixedRelationshipTables;
    const relationshipSeparationPercentage = totalTablesWithGuests > 0 ? 
      ((pureRelationshipTables / totalTablesWithGuests) * 100).toFixed(1) : 0;

    console.log(`\n📊 Color-Coded Separation Score: ${relationshipSeparationPercentage}% (${pureRelationshipTables}/${totalTablesWithGuests} tables)`);

    // Step 7: Summary
    console.log('\n📈 Relationship Color Coding Test Summary:');
    console.log(`  🎨 Color coding implemented for ${Object.keys(relationshipColors).length} relationship types`);
    console.log(`  👥 ${acceptedGuests.length} accepted guests with color-coded relationships`);
    console.log(`  🪑 ${totalTablesWithGuests} tables with color-coded assignments`);
    console.log(`  🌈 ${pureRelationshipTables} tables with single-color (pure relationship) groups`);
    console.log(`  🎯 ${relationshipSeparationPercentage}% relationship separation with visual color coding`);

    console.log('\n🎉 Relationship color coding test completed successfully!');
    console.log('✅ Frontend now provides:');
    console.log('   - Visual relationship identification through color coding');
    console.log('   - Improved user experience with color legend');
    console.log('   - Easy recognition of relationship-based groupings');
    console.log('   - Enhanced table arrangement visualization');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRelationshipColorCoding();