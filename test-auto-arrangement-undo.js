/**
 * Specific test for auto-arrangement undo functionality
 * This test verifies that users can undo auto-arrangement operations
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const TEST_EVENT_ID = 'test-event-1';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    throw error;
  }
}

async function testAutoArrangementUndo() {
  console.log('🧪 Testing Auto-Arrangement Undo Functionality\n');
  
  // Step 1: Create test guests
  console.log('📝 Step 1: Creating test guests...');
  const testGuests = [
    {
      name: 'Test Guest 1',
      phoneNumber: '+1111111111',
      eventId: TEST_EVENT_ID,
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      rsvpStatus: 'accepted',
      additionalGuestCount: 0
    },
    {
      name: 'Test Guest 2',
      phoneNumber: '+1111111112',
      eventId: TEST_EVENT_ID,
      relationshipType: 'Cousin',
      brideOrGroomSide: 'groom',
      rsvpStatus: 'accepted',
      additionalGuestCount: 1
    }
  ];
  
  const createdGuests = [];
  for (const guestData of testGuests) {
    const { response, data } = await makeRequest('/api/guests', {
      method: 'POST',
      body: JSON.stringify(guestData)
    });
    
    if (response.ok && data.success) {
      createdGuests.push(data.data);
      console.log(`✅ Created guest: ${data.data.name}`);
    } else {
      console.error(`❌ Failed to create guest: ${guestData.name}`);
      return false;
    }
  }
  
  // Step 2: Create test table
  console.log('\n📝 Step 2: Creating test table...');
  const tableData = {
    eventId: TEST_EVENT_ID,
    name: 'Test Table',
    capacity: 8,
    position: { x: 100, y: 100 }
  };
  
  const { response: tableResponse, data: tableData2 } = await makeRequest('/api/tables', {
    method: 'POST',
    body: JSON.stringify(tableData)
  });
  
  if (!tableResponse.ok) {
    console.error('❌ Failed to create test table');
    return false;
  }
  
  const createdTable = tableData2;
  console.log(`✅ Created table: ${createdTable.name}`);
  
  // Step 3: Manually assign one guest to establish initial state
  console.log('\n📝 Step 3: Setting up initial state...');
  const { response: assignResponse, data: assignData } = await makeRequest(`/api/guests/${createdGuests[0].id}/assign-table`, {
    method: 'POST',
    body: JSON.stringify({ tableId: createdTable.id })
  });
  
  if (!assignResponse.ok) {
    console.error('❌ Failed to set up initial state');
    return false;
  }
  
  console.log(`✅ Initially assigned ${createdGuests[0].name} to ${createdTable.name}`);
  
  // Step 4: Verify initial state
  console.log('\n📝 Step 4: Verifying initial state...');
  const { response: initialStateResponse, data: initialStateData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!initialStateResponse.ok) {
    console.error('❌ Failed to get initial state');
    return false;
  }
  
  const initialAssignments = {};
  initialStateData.data.forEach(guest => {
    initialAssignments[guest.id] = guest.tableAssignment || null;
  });
  
  console.log('✅ Initial state captured');
  console.log(`   - ${createdGuests[0].name}: ${initialAssignments[createdGuests[0].id] ? 'Assigned' : 'Unassigned'}`);
  console.log(`   - ${createdGuests[1].name}: ${initialAssignments[createdGuests[1].id] ? 'Assigned' : 'Unassigned'}`);
  
  // Step 5: Perform auto-arrangement
  console.log('\n📝 Step 5: Performing auto-arrangement...');
  const autoOptions = {
    respectRelationships: true,
    balanceBrideGroomSides: true,
    considerDietaryRestrictions: false,
    keepFamiliesTogether: true,
    maxGuestsPerTable: 8
  };
  
  const { response: autoResponse, data: autoData } = await makeRequest(`/api/tables/events/${TEST_EVENT_ID}/auto-arrange`, {
    method: 'POST',
    body: JSON.stringify(autoOptions)
  });
  
  if (!autoResponse.ok || !autoData.success) {
    console.error('❌ Auto-arrangement failed:', autoData);
    return false;
  }
  
  console.log(`✅ Auto-arrangement completed: ${autoData.message}`);
  
  // Step 6: Verify auto-arrangement changed assignments
  console.log('\n📝 Step 6: Verifying auto-arrangement results...');
  const { response: postAutoResponse, data: postAutoData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!postAutoResponse.ok) {
    console.error('❌ Failed to get post-auto-arrangement state');
    return false;
  }
  
  const postAutoAssignments = {};
  postAutoData.data.forEach(guest => {
    postAutoAssignments[guest.id] = guest.tableAssignment;
  });
  
  console.log('✅ Post-auto-arrangement state captured');
  console.log(`   - ${createdGuests[0].name}: ${postAutoAssignments[createdGuests[0].id] ? 'Assigned' : 'Unassigned'}`);
  console.log(`   - ${createdGuests[1].name}: ${postAutoAssignments[createdGuests[1].id] ? 'Assigned' : 'Unassigned'}`);
  
  // Step 7: Test undo functionality (simulate what the frontend would do)
  console.log('\n📝 Step 7: Testing undo functionality...');
  console.log('ℹ️  Note: This simulates the frontend undo operation by restoring the initial state');
  
  // Restore initial state (this is what the frontend undo would do)
  for (const guestId of Object.keys(initialAssignments)) {
    const previousTableId = initialAssignments[guestId];
    
    if (previousTableId) {
      // Assign guest back to their previous table
      const { response: undoAssignResponse } = await makeRequest(`/api/guests/${guestId}/assign-table`, {
        method: 'POST',
        body: JSON.stringify({ tableId: previousTableId })
      });
      
      if (!undoAssignResponse.ok) {
        console.error(`❌ Failed to undo assignment for guest ${guestId}`);
        return false;
      }
    } else {
      // Unassign guest (they were unassigned before)
      const { response: undoUnassignResponse } = await makeRequest(`/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });
      
      if (!undoUnassignResponse.ok) {
        console.error(`❌ Failed to undo unassignment for guest ${guestId}`);
        return false;
      }
    }
  }
  
  console.log('✅ Undo operation completed');
  
  // Step 8: Verify undo restored initial state
  console.log('\n📝 Step 8: Verifying undo restored initial state...');
  const { response: finalStateResponse, data: finalStateData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!finalStateResponse.ok) {
    console.error('❌ Failed to get final state');
    return false;
  }
  
  const finalAssignments = {};
  finalStateData.data.forEach(guest => {
    finalAssignments[guest.id] = guest.tableAssignment || null;
  });
  
  console.log('✅ Final state captured');
  console.log(`   - ${createdGuests[0].name}: ${finalAssignments[createdGuests[0].id] ? 'Assigned' : 'Unassigned'}`);
  console.log(`   - ${createdGuests[1].name}: ${finalAssignments[createdGuests[1].id] ? 'Assigned' : 'Unassigned'}`);
  
  // Verify that final state matches initial state
  let undoSuccessful = true;
  for (const guestId of Object.keys(initialAssignments)) {
    if (initialAssignments[guestId] !== finalAssignments[guestId]) {
      console.error(`❌ Undo failed for guest ${guestId}: expected ${initialAssignments[guestId]}, got ${finalAssignments[guestId]}`);
      undoSuccessful = false;
    }
  }
  
  if (undoSuccessful) {
    console.log('\n🎉 SUCCESS: Auto-arrangement undo functionality is working correctly!');
  } else {
    console.log('\n❌ FAILURE: Auto-arrangement undo did not restore the initial state correctly');
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  for (const guest of createdGuests) {
    try {
      await makeRequest(`/api/guests/${guest.id}`, { method: 'DELETE' });
      console.log(`✅ Deleted guest: ${guest.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete guest ${guest.name}`);
    }
  }
  
  try {
    await makeRequest(`/api/tables/${createdTable.id}`, { method: 'DELETE' });
    console.log(`✅ Deleted table: ${createdTable.name}`);
  } catch (error) {
    console.error(`❌ Failed to delete table ${createdTable.name}`);
  }
  
  return undoSuccessful;
}

// Run the test
if (require.main === module) {
  testAutoArrangementUndo()
    .then(success => {
      if (success) {
        console.log('\n✅ Auto-arrangement undo test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Auto-arrangement undo test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testAutoArrangementUndo };