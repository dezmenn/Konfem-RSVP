/**
 * Debug script to reproduce the auto-arrangement undo issue
 * This will help us identify exactly what's failing
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const TEST_EVENT_ID = 'demo-event-1'; // Use the demo event

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

async function debugAutoArrangementUndo() {
  console.log('🔍 Debugging Auto-Arrangement Undo Issue\n');
  
  // Step 1: Get current guest state
  console.log('📝 Step 1: Getting current guest state...');
  const { response: guestsResponse, data: guestsData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!guestsResponse.ok || !guestsData.success) {
    console.error('❌ Failed to get guests');
    return;
  }
  
  console.log(`✅ Found ${guestsData.data.length} guests`);
  
  // Show current assignments
  const currentAssignments = {};
  guestsData.data.forEach(guest => {
    currentAssignments[guest.id] = guest.tableAssignment;
    console.log(`   - ${guest.name}: ${guest.tableAssignment || 'unassigned'} (RSVP: ${guest.rsvpStatus})`);
  });
  
  // Step 2: Perform auto-arrangement
  console.log('\n📝 Step 2: Performing auto-arrangement...');
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
    return;
  }
  
  console.log(`✅ Auto-arrangement completed: ${autoData.message}`);
  
  // Step 3: Get post-auto-arrangement state
  console.log('\n📝 Step 3: Getting post-auto-arrangement state...');
  const { response: postAutoResponse, data: postAutoData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!postAutoResponse.ok || !postAutoData.success) {
    console.error('❌ Failed to get post-auto-arrangement state');
    return;
  }
  
  const postAutoAssignments = {};
  postAutoData.data.forEach(guest => {
    postAutoAssignments[guest.id] = guest.tableAssignment;
    console.log(`   - ${guest.name}: ${guest.tableAssignment || 'unassigned'} (was: ${currentAssignments[guest.id] || 'unassigned'})`);
  });
  
  // Step 4: Test individual guest assignment/unassignment
  console.log('\n📝 Step 4: Testing individual API endpoints...');
  
  // Find a guest that was assigned by auto-arrangement
  const assignedGuest = postAutoData.data.find(g => g.tableAssignment && g.rsvpStatus === 'accepted');
  if (!assignedGuest) {
    console.error('❌ No assigned guest found to test with');
    return;
  }
  
  console.log(`Testing with guest: ${assignedGuest.name} (currently at table: ${assignedGuest.tableAssignment})`);
  
  // Test unassignment
  console.log('\n🧪 Testing unassignment API...');
  const { response: unassignResponse, data: unassignData } = await makeRequest(`/api/guests/${assignedGuest.id}/unassign-table`, {
    method: 'POST'
  });
  
  if (unassignResponse.ok && unassignData.success) {
    console.log(`✅ Successfully unassigned ${assignedGuest.name}`);
    
    // Verify unassignment
    const { response: verifyUnassignResponse, data: verifyUnassignData } = await makeRequest(`/api/guests/guest/${assignedGuest.id}`);
    if (verifyUnassignResponse.ok && verifyUnassignData.success) {
      console.log(`✅ Verified unassignment: tableAssignment = ${verifyUnassignData.data.tableAssignment}`);
    }
  } else {
    console.error(`❌ Failed to unassign ${assignedGuest.name}:`, unassignData);
    return;
  }
  
  // Test reassignment
  console.log('\n🧪 Testing assignment API...');
  const originalTableId = assignedGuest.tableAssignment;
  const { response: assignResponse, data: assignData } = await makeRequest(`/api/guests/${assignedGuest.id}/assign-table`, {
    method: 'POST',
    body: JSON.stringify({ tableId: originalTableId })
  });
  
  if (assignResponse.ok && assignData.success) {
    console.log(`✅ Successfully reassigned ${assignedGuest.name} to table ${originalTableId}`);
    
    // Verify reassignment
    const { response: verifyAssignResponse, data: verifyAssignData } = await makeRequest(`/api/guests/guest/${assignedGuest.id}`);
    if (verifyAssignResponse.ok && verifyAssignData.success) {
      console.log(`✅ Verified reassignment: tableAssignment = ${verifyAssignData.data.tableAssignment}`);
    }
  } else {
    console.error(`❌ Failed to reassign ${assignedGuest.name}:`, assignData);
    return;
  }
  
  // Step 5: Test the full undo simulation
  console.log('\n📝 Step 5: Simulating full undo operation...');
  
  console.log('Previous state to restore:');
  Object.entries(currentAssignments).forEach(([guestId, tableId]) => {
    const guest = guestsData.data.find(g => g.id === guestId);
    console.log(`   - ${guest?.name || guestId}: ${tableId || 'unassigned'}`);
  });
  
  let undoErrors = [];
  
  for (const [guestId, previousTableId] of Object.entries(currentAssignments)) {
    const guest = guestsData.data.find(g => g.id === guestId);
    if (!guest) continue;
    
    console.log(`\nRestoring ${guest.name} to ${previousTableId || 'unassigned'}...`);
    
    try {
      if (previousTableId) {
        const { response: restoreResponse, data: restoreData } = await makeRequest(`/api/guests/${guestId}/assign-table`, {
          method: 'POST',
          body: JSON.stringify({ tableId: previousTableId })
        });
        
        if (restoreResponse.ok && restoreData.success) {
          console.log(`✅ Successfully restored ${guest.name} to table ${previousTableId}`);
        } else {
          console.error(`❌ Failed to restore ${guest.name} to table ${previousTableId}:`, restoreData);
          undoErrors.push(`${guest.name}: ${restoreData.error || 'Unknown error'}`);
        }
      } else {
        const { response: restoreResponse, data: restoreData } = await makeRequest(`/api/guests/${guestId}/unassign-table`, {
          method: 'POST'
        });
        
        if (restoreResponse.ok && restoreData.success) {
          console.log(`✅ Successfully unassigned ${guest.name}`);
        } else {
          console.error(`❌ Failed to unassign ${guest.name}:`, restoreData);
          undoErrors.push(`${guest.name}: ${restoreData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error(`❌ Exception while restoring ${guest.name}:`, error.message);
      undoErrors.push(`${guest.name}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 Debug Summary:');
  console.log('==================');
  
  if (undoErrors.length === 0) {
    console.log('✅ All undo operations completed successfully');
    console.log('✅ The API endpoints are working correctly');
    console.log('ℹ️  The issue might be in the frontend state management or data capture');
  } else {
    console.log(`❌ ${undoErrors.length} undo operations failed:`);
    undoErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n💡 Recommendations:');
  console.log('- Check browser console for detailed error logs');
  console.log('- Verify that the frontend is capturing the previous state correctly');
  console.log('- Check if there are any data type mismatches (null vs undefined)');
  console.log('- Ensure the assignment history is being populated correctly');
}

// Run the debug script
if (require.main === module) {
  debugAutoArrangementUndo()
    .catch(error => {
      console.error('\n❌ Debug script failed:', error);
      process.exit(1);
    });
}

module.exports = { debugAutoArrangementUndo };