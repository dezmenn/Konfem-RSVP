const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testResetAllFunctionality() {
  console.log('🧪 Testing Reset All Functionality');
  console.log('=' .repeat(50));

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

    // Step 2: Perform auto arrangement first to have some assignments
    console.log('\n🎯 Performing auto arrangement to create assignments...');
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

    // Step 3: Check current assignments
    console.log('\n📋 Checking current table assignments...');
    
    // Reload guests to get updated assignments
    const updatedGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const updatedGuestsData = await updatedGuestsResponse.json();
    const updatedGuests = updatedGuestsData.data;

    // Reload tables to get updated assignments
    const updatedTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const updatedTables = await updatedTablesResponse.json();

    // Count assigned guests
    const assignedGuests = updatedGuests.filter(guest => {
      const isInTableAssignedGuests = updatedTables.some(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      const hasTableAssignment = guest.tableAssignment;
      return isInTableAssignedGuests || hasTableAssignment;
    });

    console.log(`📊 Found ${assignedGuests.length} assigned guests before reset`);

    if (assignedGuests.length === 0) {
      console.log('⚠️ No guests are assigned, skipping reset test');
      return;
    }

    // Show current assignments
    console.log('\n🪑 Current table assignments:');
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        table.assignedGuests && table.assignedGuests.includes(g.id)
      );
      if (tableGuests.length > 0) {
        console.log(`  ${table.name}: ${tableGuests.length} guests (${tableGuests.map(g => g.name).join(', ')})`);
      }
    });

    // Step 4: Test bulk unassign (Reset All functionality)
    console.log('\n🔄 Testing Reset All functionality...');
    
    const resetResponse = await fetch(`${API_BASE}/guests/bulk-unassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestIds: assignedGuests.map(g => g.id)
      })
    });

    const resetResult = await resetResponse.json();

    if (!resetResult.success) {
      throw new Error(`Reset all failed: ${resetResult.error}`);
    }

    console.log(`✅ Reset completed: ${resetResult.data.successfulUnassignments} guests unassigned`);
    
    if (resetResult.data.failedUnassignments > 0) {
      console.log(`⚠️ ${resetResult.data.failedUnassignments} unassignments failed`);
    }

    // Step 5: Verify all assignments are cleared
    console.log('\n🔍 Verifying all assignments are cleared...');
    
    // Reload data to verify reset
    const finalGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const finalGuestsData = await finalGuestsResponse.json();
    const finalGuests = finalGuestsData.data;

    const finalTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const finalTables = await finalTablesResponse.json();

    // Count remaining assigned guests
    const remainingAssignedGuests = finalGuests.filter(guest => {
      const isInTableAssignedGuests = finalTables.some(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      const hasTableAssignment = guest.tableAssignment;
      return isInTableAssignedGuests || hasTableAssignment;
    });

    console.log(`📊 Remaining assigned guests after reset: ${remainingAssignedGuests.length}`);

    if (remainingAssignedGuests.length === 0) {
      console.log('✅ All guests successfully unassigned!');
    } else {
      console.log('⚠️ Some guests still have assignments:');
      remainingAssignedGuests.forEach(guest => {
        const assignedTable = finalTables.find(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        const tableInfo = assignedTable ? assignedTable.name : guest.tableAssignment;
        console.log(`  - ${guest.name}: ${tableInfo}`);
      });
    }

    // Step 6: Verify table assignments are cleared
    console.log('\n🪑 Verifying table assignments are cleared...');
    let tablesWithGuests = 0;
    finalTables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        tablesWithGuests++;
        console.log(`  ⚠️ ${table.name} still has ${table.assignedGuests.length} assigned guests`);
      }
    });

    if (tablesWithGuests === 0) {
      console.log('✅ All tables are empty!');
    } else {
      console.log(`⚠️ ${tablesWithGuests} tables still have assigned guests`);
    }

    // Step 7: Summary
    console.log('\n📈 Reset All Test Summary:');
    console.log(`  📊 Initial assigned guests: ${assignedGuests.length}`);
    console.log(`  ✅ Successfully unassigned: ${resetResult.data.successfulUnassignments}`);
    console.log(`  ❌ Failed unassignments: ${resetResult.data.failedUnassignments || 0}`);
    console.log(`  📊 Remaining assigned guests: ${remainingAssignedGuests.length}`);
    console.log(`  🪑 Tables with guests: ${tablesWithGuests}`);

    const testPassed = remainingAssignedGuests.length === 0 && tablesWithGuests === 0;
    
    if (testPassed) {
      console.log('\n🎉 Reset All functionality test PASSED!');
    } else {
      console.log('\n❌ Reset All functionality test FAILED!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testResetAllFunctionality();