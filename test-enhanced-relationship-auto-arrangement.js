const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testEnhancedRelationshipAutoArrangement() {
  console.log('🧪 Testing Enhanced Relationship-Based Auto Arrangement');
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
    const sideCounts = { bride: 0, groom: 0 };

    guests.forEach(guest => {
      if (guest.rsvpStatus === 'accepted') {
        relationshipCounts[guest.relationshipType] = (relationshipCounts[guest.relationshipType] || 0) + 1;
        sideCounts[guest.brideOrGroomSide]++;
      }
    });

    Object.entries(relationshipCounts).forEach(([relationship, count]) => {
      console.log(`  ${relationship}: ${count} guests`);
    });
    console.log(`\n  Bride side: ${sideCounts.bride} guests`);
    console.log(`  Groom side: ${sideCounts.groom} guests`);

    // Step 3: Show table capacities
    console.log('\n🪑 Table Capacities:');
    tables.forEach(table => {
      const currentOccupied = table.assignedGuests ? table.assignedGuests.length : 0;
      console.log(`  ${table.name}: ${currentOccupied}/${table.capacity} (${table.capacity - currentOccupied} available)${table.isLocked ? ' 🔒' : ''}`);
    });

    // Step 4: Clear all current assignments
    console.log('\n🧹 Clearing current table assignments...');
    const assignedGuests = guests.filter(g => g.tableAssignment);
    
    for (const guest of assignedGuests) {
      const unassignResponse = await fetch(`${API_BASE}/guests/${guest.id}/unassign-table`, {
        method: 'POST'
      });
      
      if (!unassignResponse.ok) {
        console.warn(`⚠️ Failed to unassign ${guest.name}`);
      }
    }
    console.log(`✅ Cleared assignments for ${assignedGuests.length} guests`);

    // Step 5: Perform enhanced auto arrangement
    console.log('\n🎯 Performing enhanced relationship-based auto arrangement...');
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

    console.log(`✅ ${arrangeResult.message}`);
    console.log(`📈 Arrangement Score: ${(arrangeResult.score * 100).toFixed(1)}%`);

    if (arrangeResult.conflicts && arrangeResult.conflicts.length > 0) {
      console.log('\n⚠️ Conflicts detected:');
      arrangeResult.conflicts.forEach(conflict => {
        console.log(`  ${conflict.severity.toUpperCase()}: ${conflict.message}`);
      });
    }

    // Step 6: Analyze the results
    console.log('\n📋 Analyzing arrangement results...');
    
    // Reload guests to get updated assignments
    const updatedGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const updatedGuestsData = await updatedGuestsResponse.json();
    const updatedGuests = updatedGuestsData.data;

    // Reload tables to get updated assignments
    const updatedTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const updatedTables = await updatedTablesResponse.json();

    // Group guests by table and analyze
    const tableAnalysis = {};
    
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        table.assignedGuests && table.assignedGuests.includes(g.id)
      );
      
      const acceptedGuests = tableGuests.filter(g => g.rsvpStatus === 'accepted');
      
      if (acceptedGuests.length > 0) {
        const relationships = [...new Set(acceptedGuests.map(g => g.relationshipType))];
        const sides = [...new Set(acceptedGuests.map(g => g.brideOrGroomSide))];
        const totalSeats = acceptedGuests.reduce((sum, g) => sum + 1 + (g.additionalGuestCount || 0), 0);
        
        tableAnalysis[table.name] = {
          guestCount: acceptedGuests.length,
          totalSeats,
          capacity: table.capacity,
          utilization: ((totalSeats / table.capacity) * 100).toFixed(1),
          relationships,
          sides,
          guests: acceptedGuests.map(g => ({
            name: g.name,
            relationship: g.relationshipType,
            side: g.brideOrGroomSide,
            additionalGuests: g.additionalGuestCount || 0
          }))
        };
      }
    });

    // Display table analysis
    console.log('\n🎯 Table Assignment Analysis:');
    Object.entries(tableAnalysis).forEach(([tableName, analysis]) => {
      console.log(`\n  ${tableName}:`);
      console.log(`    👥 Guests: ${analysis.guestCount} (${analysis.totalSeats} total seats)`);
      console.log(`    📊 Utilization: ${analysis.utilization}% (${analysis.totalSeats}/${analysis.capacity})`);
      console.log(`    🤝 Relationships: ${analysis.relationships.join(', ')}`);
      console.log(`    💒 Sides: ${analysis.sides.join(', ')}`);
      console.log(`    📝 Guest List:`);
      analysis.guests.forEach(guest => {
        const additionalText = guest.additionalGuests > 0 ? ` (+${guest.additionalGuests})` : '';
        console.log(`      - ${guest.name} (${guest.relationship}, ${guest.side})${additionalText}`);
      });
    });

    // Step 7: Validate relationship separation
    console.log('\n🔍 Validating Relationship Separation:');
    let relationshipSeparationScore = 0;
    let totalTables = 0;
    
    Object.entries(tableAnalysis).forEach(([tableName, analysis]) => {
      totalTables++;
      if (analysis.relationships.length === 1) {
        relationshipSeparationScore++;
        console.log(`  ✅ ${tableName}: Pure relationship group (${analysis.relationships[0]})`);
      } else {
        console.log(`  ⚠️ ${tableName}: Mixed relationships (${analysis.relationships.join(', ')})`);
      }
    });

    const separationPercentage = totalTables > 0 ? ((relationshipSeparationScore / totalTables) * 100).toFixed(1) : 0;
    console.log(`\n📊 Relationship Separation Score: ${separationPercentage}% (${relationshipSeparationScore}/${totalTables} tables)`);

    // Step 8: Validate table number priority (VIP seating)
    console.log('\n👑 Validating VIP Table Priority:');
    const vipRelationships = ['Bride', 'Groom', 'Parent'];
    const table1Analysis = tableAnalysis['Table 1 - VIP'];
    
    if (table1Analysis) {
      const hasVipGuests = table1Analysis.relationships.some(rel => vipRelationships.includes(rel));
      if (hasVipGuests) {
        console.log(`  ✅ Table 1 contains VIP guests: ${table1Analysis.relationships.filter(rel => vipRelationships.includes(rel)).join(', ')}`);
      } else {
        console.log(`  ⚠️ Table 1 does not contain VIP guests. Contains: ${table1Analysis.relationships.join(', ')}`);
      }
    } else {
      console.log(`  ⚠️ Table 1 is empty`);
    }

    // Step 9: Summary
    console.log('\n📈 Summary:');
    console.log(`  ✅ Successfully arranged ${arrangeResult.arrangedGuests} guests`);
    console.log(`  📊 Overall arrangement score: ${(arrangeResult.score * 100).toFixed(1)}%`);
    console.log(`  🤝 Relationship separation: ${separationPercentage}%`);
    console.log(`  🪑 Tables used: ${Object.keys(tableAnalysis).length}/${tables.length}`);
    
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    const totalUsedSeats = Object.values(tableAnalysis).reduce((sum, a) => sum + a.totalSeats, 0);
    const overallUtilization = ((totalUsedSeats / totalCapacity) * 100).toFixed(1);
    console.log(`  📊 Overall venue utilization: ${overallUtilization}%`);

    console.log('\n🎉 Enhanced relationship-based auto arrangement test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEnhancedRelationshipAutoArrangement();