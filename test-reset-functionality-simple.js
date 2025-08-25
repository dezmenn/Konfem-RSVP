const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testResetFunctionalitySimple() {
  console.log('🧪 Testing Reset All Functionality (Simple)');
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

    // Step 2: Manually assign a few guests to test reset functionality
    console.log('\n👥 Manually assigning some guests for testing...');
    
    const testAssignments = [
      { guestId: 'bride-1', tableId: 'table-1' },
      { guestId: 'groom-1', tableId: 'table-1' },
      { guestId: 'bride-parent-1', tableId: 'table-2' },
      { guestId: 'groom-parent-1', tableId: 'table-2' }
    ];

    for (const assignment of testAssignments) {
      try {
        const response = await fetch(`${API_BASE}/guests/${assignment.guestId}/assign-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableId: assignment.tableId })
        });

        if (response.ok) {
          const guest = guests.find(g => g.id === assignment.guestId);
          const table = tables.find(t => t.id === assignment.tableId);
          console.log(`  ✅ Assigned ${guest?.name || assignment.guestId} to ${table?.name || assignment.tableId}`);
        } else {
          console.log(`  ⚠️ Failed to assign ${assignment.guestId} to ${assignment.tableId}`);
        }
      } catch (error) {
        console.log(`  ❌ Error assigning ${assignment.guestId}: ${error.message}`);
      }
    }

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
      console.log('⚠️ No guests are assigned, creating some test assignments...');
      
      // Try a simple assignment
      const simpleResponse = await fetch(`${API_BASE}/guests/bride-1/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: 'table-1' })
      });
      
      if (simpleResponse.ok) {
        console.log('✅ Created test assignment for bride-1');
        // Reload data
        const reloadResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
        const reloadData = await reloadResponse.json();
        const reloadedGuests = reloadData.data;
        const testAssigned = reloadedGuests.filter(g => g.tableAssignment);
        console.log(`📊 Now have ${testAssigned.length} assigned guests`);
        
        if (testAssigned.length === 0) {
          console.log('❌ Still no assignments found, skipping reset test');
          return;
        }
      } else {
        console.log('❌ Failed to create test assignment, skipping reset test');
        return;
      }
    }

    // Show current assignments
    console.log('\n🪑 Current table assignments:');
    updatedTables.forEach(table => {
      const tableGuests = updatedGuests.filter(g => 
        (table.assignedGuests && table.assignedGuests.includes(g.id)) || g.tableAssignment === table.id
      );
      if (tableGuests.length > 0) {
        console.log(`  ${table.name}: ${tableGuests.length} guests (${tableGuests.map(g => g.name).join(', ')})`);
      }
    });

    // Step 4: Test bulk unassign (Reset All functionality)
    console.log('\n🔄 Testing Reset All functionality...');
    
    // Get fresh list of assigned guests
    const finalAssignedGuests = updatedGuests.filter(guest => {
      const isInTableAssignedGuests = updatedTables.some(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      const hasTableAssignment = guest.tableAssignment;
      return isInTableAssignedGuests || hasTableAssignment;
    });

    if (finalAssignedGuests.length === 0) {
      console.log('⚠️ No assigned guests found for reset test');
      return;
    }

    const resetResponse = await fetch(`${API_BASE}/guests/bulk-unassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestIds: finalAssignedGuests.map(g => g.id)
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
    const verifyGuestsResponse = await fetch(`${API_BASE}/guests/${EVENT_ID}`);
    const verifyGuestsData = await verifyGuestsResponse.json();
    const verifyGuests = verifyGuestsData.data;

    const verifyTablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
    const verifyTables = await verifyTablesResponse.json();

    // Count remaining assigned guests
    const remainingAssignedGuests = verifyGuests.filter(guest => {
      const isInTableAssignedGuests = verifyTables.some(table => 
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
        const assignedTable = verifyTables.find(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        const tableInfo = assignedTable ? assignedTable.name : guest.tableAssignment;
        console.log(`  - ${guest.name}: ${tableInfo}`);
      });
    }

    // Step 6: Summary
    console.log('\n📈 Reset All Test Summary:');
    console.log(`  📊 Initial assigned guests: ${finalAssignedGuests.length}`);
    console.log(`  ✅ Successfully unassigned: ${resetResult.data.successfulUnassignments}`);
    console.log(`  ❌ Failed unassignments: ${resetResult.data.failedUnassignments || 0}`);
    console.log(`  📊 Remaining assigned guests: ${remainingAssignedGuests.length}`);

    const testPassed = remainingAssignedGuests.length === 0;
    
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
testResetFunctionalitySimple();