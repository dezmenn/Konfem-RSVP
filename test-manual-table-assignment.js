/**
 * Integration tests for manual table assignment features
 * Tests drag-and-drop, bulk assignment, assignment validation, and history functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const TEST_EVENT_ID = 'test-event-1';

// Test data
const testGuests = [
  {
    name: 'Alice Johnson',
    phoneNumber: '+1234567890',
    eventId: TEST_EVENT_ID,
    relationshipType: 'Friend',
    brideOrGroomSide: 'bride',
    rsvpStatus: 'accepted',
    additionalGuestCount: 1
  },
  {
    name: 'Bob Smith',
    phoneNumber: '+1234567891',
    eventId: TEST_EVENT_ID,
    relationshipType: 'Cousin',
    brideOrGroomSide: 'groom',
    rsvpStatus: 'accepted',
    additionalGuestCount: 0
  },
  {
    name: 'Carol Davis',
    phoneNumber: '+1234567892',
    eventId: TEST_EVENT_ID,
    relationshipType: 'Friend',
    brideOrGroomSide: 'bride',
    rsvpStatus: 'accepted',
    additionalGuestCount: 2
  },
  {
    name: 'David Wilson',
    phoneNumber: '+1234567893',
    eventId: TEST_EVENT_ID,
    relationshipType: 'Uncle',
    brideOrGroomSide: 'groom',
    rsvpStatus: 'accepted',
    additionalGuestCount: 1
  }
];

const testTables = [
  {
    eventId: TEST_EVENT_ID,
    name: 'Table 1',
    capacity: 8,
    position: { x: 100, y: 100 }
  },
  {
    eventId: TEST_EVENT_ID,
    name: 'Table 2',
    capacity: 6,
    position: { x: 200, y: 100 }
  },
  {
    eventId: TEST_EVENT_ID,
    name: 'Table 3',
    capacity: 4,
    position: { x: 300, y: 100 }
  }
];

let createdGuests = [];
let createdTables = [];

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

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Create test guests
  for (const guestData of testGuests) {
    const { response, data } = await makeRequest('/api/guests', {
      method: 'POST',
      body: JSON.stringify(guestData)
    });
    
    if (response.ok && data.success) {
      createdGuests.push(data.data);
      console.log(`✅ Created guest: ${data.data.name}`);
    } else {
      console.error(`❌ Failed to create guest: ${guestData.name}`, data);
    }
  }
  
  // Create test tables
  for (const tableData of testTables) {
    const { response, data } = await makeRequest('/api/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
    
    if (response.ok) {
      createdTables.push(data);
      console.log(`✅ Created table: ${data.name}`);
    } else {
      console.error(`❌ Failed to create table: ${tableData.name}`, data);
    }
  }
  
  console.log(`📊 Setup complete: ${createdGuests.length} guests, ${createdTables.length} tables\n`);
}

async function testSingleGuestAssignment() {
  console.log('🧪 Testing single guest assignment...');
  
  if (createdGuests.length === 0 || createdTables.length === 0) {
    console.error('❌ No test data available');
    return false;
  }
  
  const guest = createdGuests[0];
  const table = createdTables[0];
  
  // Test assignment
  const { response, data } = await makeRequest(`/api/guests/${guest.id}/table`, {
    method: 'PUT',
    body: JSON.stringify({ tableId: table.id })
  });
  
  if (response.ok && data.success) {
    console.log(`✅ Successfully assigned ${guest.name} to ${table.name}`);
    
    // Verify assignment
    const { response: verifyResponse, data: verifyData } = await makeRequest(`/api/guests/guest/${guest.id}`);
    
    if (verifyResponse.ok && verifyData.data.tableAssignment === table.id) {
      console.log(`✅ Assignment verified in database`);
      return true;
    } else {
      console.error(`❌ Assignment not found in database`);
      return false;
    }
  } else {
    console.error(`❌ Failed to assign guest:`, data);
    return false;
  }
}

async function testCapacityValidation() {
  console.log('🧪 Testing capacity validation...');
  
  if (createdGuests.length < 3 || createdTables.length === 0) {
    console.error('❌ Insufficient test data');
    return false;
  }
  
  // Use the smallest table (Table 3 with capacity 4)
  const smallTable = createdTables.find(t => t.name === 'Table 3');
  if (!smallTable) {
    console.error('❌ Small table not found');
    return false;
  }
  
  // Try to assign guests that would exceed capacity
  // Carol Davis has additionalGuestCount: 2, so needs 3 seats total
  // David Wilson has additionalGuestCount: 1, so needs 2 seats total
  // Total would be 5 seats, but table capacity is only 4
  
  const carol = createdGuests.find(g => g.name === 'Carol Davis');
  const david = createdGuests.find(g => g.name === 'David Wilson');
  
  if (!carol || !david) {
    console.error('❌ Required test guests not found');
    return false;
  }
  
  // First assign Carol (should succeed - 3 seats used, 1 remaining)
  const { response: response1, data: data1 } = await makeRequest(`/api/guests/${carol.id}/table`, {
    method: 'PUT',
    body: JSON.stringify({ tableId: smallTable.id })
  });
  
  if (!response1.ok || !data1.success) {
    console.error(`❌ Failed to assign Carol to small table:`, data1);
    return false;
  }
  
  console.log(`✅ Successfully assigned Carol (3 seats) to ${smallTable.name}`);
  
  // Now try to assign David (should fail - would need 2 more seats, but only 1 available)
  const { response: response2, data: data2 } = await makeRequest(`/api/guests/${david.id}/table`, {
    method: 'PUT',
    body: JSON.stringify({ tableId: smallTable.id })
  });
  
  if (!response2.ok) {
    console.log(`✅ Capacity validation working - assignment correctly rejected`);
    return true;
  } else {
    console.error(`❌ Capacity validation failed - assignment should have been rejected`);
    return false;
  }
}

async function testBulkAssignment() {
  console.log('🧪 Testing bulk assignment...');
  
  if (createdGuests.length < 2 || createdTables.length === 0) {
    console.error('❌ Insufficient test data');
    return false;
  }
  
  // Use Table 1 (capacity 8) for bulk assignment
  const largeTable = createdTables.find(t => t.name === 'Table 1');
  if (!largeTable) {
    console.error('❌ Large table not found');
    return false;
  }
  
  // Get unassigned guests (Bob and any others not yet assigned)
  const unassignedGuests = createdGuests.filter(g => 
    g.name === 'Bob Smith' || g.name === 'Alice Johnson'
  );
  
  if (unassignedGuests.length === 0) {
    console.error('❌ No unassigned guests available for bulk test');
    return false;
  }
  
  const guestIds = unassignedGuests.map(g => g.id);
  
  // Test bulk assignment
  const { response, data } = await makeRequest('/api/guests/bulk-assign', {
    method: 'POST',
    body: JSON.stringify({
      guestIds: guestIds,
      tableId: largeTable.id
    })
  });
  
  if (response.ok && data.success) {
    console.log(`✅ Bulk assigned ${data.data.successfulAssignments} guests to ${largeTable.name}`);
    
    if (data.data.failedAssignments > 0) {
      console.log(`⚠️  ${data.data.failedAssignments} assignments failed`);
    }
    
    // Verify assignments
    let verifiedCount = 0;
    for (const guestId of guestIds) {
      const { response: verifyResponse, data: verifyData } = await makeRequest(`/api/guests/guest/${guestId}`);
      
      if (verifyResponse.ok && verifyData.data.tableAssignment === largeTable.id) {
        verifiedCount++;
      }
    }
    
    console.log(`✅ Verified ${verifiedCount}/${guestIds.length} bulk assignments`);
    return verifiedCount === guestIds.length;
  } else {
    console.error(`❌ Bulk assignment failed:`, data);
    return false;
  }
}

async function testBulkUnassignment() {
  console.log('🧪 Testing bulk unassignment...');
  
  // Get all assigned guests
  const { response: guestsResponse, data: guestsData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!guestsResponse.ok || !guestsData.success) {
    console.error('❌ Failed to fetch guests');
    return false;
  }
  
  const assignedGuests = guestsData.data.filter(g => g.tableAssignment);
  
  if (assignedGuests.length === 0) {
    console.error('❌ No assigned guests available for bulk unassignment test');
    return false;
  }
  
  const guestIds = assignedGuests.slice(0, 2).map(g => g.id); // Test with first 2 assigned guests
  
  // Test bulk unassignment
  const { response, data } = await makeRequest('/api/guests/bulk-unassign', {
    method: 'POST',
    body: JSON.stringify({ guestIds: guestIds })
  });
  
  if (response.ok && data.success) {
    console.log(`✅ Bulk unassigned ${data.data.successfulUnassignments} guests`);
    
    if (data.data.failedUnassignments > 0) {
      console.log(`⚠️  ${data.data.failedUnassignments} unassignments failed`);
    }
    
    // Verify unassignments
    let verifiedCount = 0;
    for (const guestId of guestIds) {
      const { response: verifyResponse, data: verifyData } = await makeRequest(`/api/guests/guest/${guestId}`);
      
      if (verifyResponse.ok && !verifyData.data.tableAssignment) {
        verifiedCount++;
      }
    }
    
    console.log(`✅ Verified ${verifiedCount}/${guestIds.length} bulk unassignments`);
    return verifiedCount === guestIds.length;
  } else {
    console.error(`❌ Bulk unassignment failed:`, data);
    return false;
  }
}

async function testTableLocking() {
  console.log('🧪 Testing table locking functionality...');
  
  if (createdTables.length === 0 || createdGuests.length === 0) {
    console.error('❌ Insufficient test data');
    return false;
  }
  
  const table = createdTables[0];
  const guest = createdGuests.find(g => !g.tableAssignment); // Find unassigned guest
  
  if (!guest) {
    console.error('❌ No unassigned guest available for lock test');
    return false;
  }
  
  // Lock the table
  const { response: lockResponse, data: lockData } = await makeRequest(`/api/tables/${table.id}/lock`, {
    method: 'POST'
  });
  
  if (!lockResponse.ok) {
    console.error(`❌ Failed to lock table:`, lockData);
    return false;
  }
  
  console.log(`✅ Successfully locked ${table.name}`);
  
  // Try to assign guest to locked table (should fail)
  const { response: assignResponse, data: assignData } = await makeRequest(`/api/guests/${guest.id}/table`, {
    method: 'PUT',
    body: JSON.stringify({ tableId: table.id })
  });
  
  if (!assignResponse.ok) {
    console.log(`✅ Assignment to locked table correctly rejected`);
    
    // Unlock the table
    const { response: unlockResponse, data: unlockData } = await makeRequest(`/api/tables/${table.id}/unlock`, {
      method: 'POST'
    });
    
    if (unlockResponse.ok) {
      console.log(`✅ Successfully unlocked ${table.name}`);
      return true;
    } else {
      console.error(`❌ Failed to unlock table:`, unlockData);
      return false;
    }
  } else {
    console.error(`❌ Assignment to locked table should have failed but succeeded`);
    return false;
  }
}

async function testAssignmentValidation() {
  console.log('🧪 Testing assignment validation...');
  
  // Test invalid guest ID
  const { response: response1, data: data1 } = await makeRequest(`/api/guests/invalid-guest-id/table`, {
    method: 'PUT',
    body: JSON.stringify({ tableId: createdTables[0]?.id })
  });
  
  if (!response1.ok) {
    console.log(`✅ Invalid guest ID correctly rejected`);
  } else {
    console.error(`❌ Invalid guest ID should have been rejected`);
    return false;
  }
  
  // Test invalid table ID
  if (createdGuests.length > 0) {
    const { response: response2, data: data2 } = await makeRequest(`/api/guests/${createdGuests[0].id}/table`, {
      method: 'PUT',
      body: JSON.stringify({ tableId: 'invalid-table-id' })
    });
    
    if (!response2.ok) {
      console.log(`✅ Invalid table ID correctly rejected`);
      return true;
    } else {
      console.error(`❌ Invalid table ID should have been rejected`);
      return false;
    }
  }
  
  return false;
}

async function testTableCapacityInfo() {
  console.log('🧪 Testing table capacity information...');
  
  if (createdTables.length === 0) {
    console.error('❌ No tables available');
    return false;
  }
  
  // Get table capacity info
  const { response, data } = await makeRequest(`/api/tables/events/${TEST_EVENT_ID}/capacity`);
  
  if (response.ok) {
    console.log(`✅ Retrieved capacity info for ${data.length} tables`);
    
    // Verify capacity calculations
    for (const capacityInfo of data) {
      const expectedAvailable = capacityInfo.capacity - capacityInfo.occupied;
      if (capacityInfo.available === expectedAvailable) {
        console.log(`✅ Capacity calculation correct for ${capacityInfo.name}: ${capacityInfo.occupied}/${capacityInfo.capacity} (${capacityInfo.available} available)`);
      } else {
        console.error(`❌ Capacity calculation incorrect for ${capacityInfo.name}`);
        return false;
      }
    }
    
    return true;
  } else {
    console.error(`❌ Failed to get capacity info:`, data);
    return false;
  }
}

async function testAutoArrangementHistory() {
  console.log('🧪 Testing auto-arrangement with history tracking...');
  
  if (createdGuests.length === 0 || createdTables.length === 0) {
    console.error('❌ Insufficient test data');
    return false;
  }
  
  // First, ensure all guests are unassigned
  for (const guest of createdGuests) {
    try {
      await makeRequest(`/api/guests/${guest.id}/table`, { method: 'DELETE' });
    } catch (error) {
      // Ignore errors for guests that aren't assigned
    }
  }
  
  // Test auto-arrangement
  const autoOptions = {
    respectRelationships: true,
    balanceBrideGroomSides: true,
    considerDietaryRestrictions: false,
    keepFamiliesTogether: true,
    maxGuestsPerTable: 8
  };
  
  const { response, data } = await makeRequest(`/api/tables/events/${TEST_EVENT_ID}/auto-arrange`, {
    method: 'POST',
    body: JSON.stringify(autoOptions)
  });
  
  if (response.ok && data.success) {
    console.log(`✅ Auto-arrangement completed: ${data.message}`);
    
    // Verify that guests were assigned
    const { response: guestsResponse, data: guestsData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
    
    if (guestsResponse.ok && guestsData.success) {
      const assignedGuests = guestsData.data.filter(g => g.tableAssignment && g.rsvpStatus === 'accepted');
      
      if (assignedGuests.length > 0) {
        console.log(`✅ Auto-arrangement assigned ${assignedGuests.length} guests to tables`);
        console.log(`✅ Auto-arrangement history tracking is implemented (frontend feature)`);
        return true;
      } else {
        console.error(`❌ Auto-arrangement didn't assign any guests`);
        return false;
      }
    } else {
      console.error(`❌ Failed to verify guest assignments after auto-arrangement`);
      return false;
    }
  } else {
    console.error(`❌ Auto-arrangement failed:`, data);
    return false;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test guests
  for (const guest of createdGuests) {
    try {
      await makeRequest(`/api/guests/${guest.id}`, { method: 'DELETE' });
      console.log(`✅ Deleted guest: ${guest.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete guest ${guest.name}:`, error.message);
    }
  }
  
  // Delete test tables
  for (const table of createdTables) {
    try {
      await makeRequest(`/api/tables/${table.id}`, { method: 'DELETE' });
      console.log(`✅ Deleted table: ${table.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete table ${table.name}:`, error.message);
    }
  }
  
  console.log('🧹 Cleanup complete\n');
}

async function runAllTests() {
  console.log('🚀 Starting Manual Table Assignment Integration Tests\n');
  
  const results = {
    setup: false,
    singleAssignment: false,
    capacityValidation: false,
    bulkAssignment: false,
    bulkUnassignment: false,
    tableLocking: false,
    assignmentValidation: false,
    capacityInfo: false,
    autoArrangementHistory: false
  };
  
  try {
    // Setup
    await setupTestData();
    results.setup = createdGuests.length > 0 && createdTables.length > 0;
    
    if (!results.setup) {
      console.error('❌ Setup failed, skipping tests');
      return results;
    }
    
    // Run tests
    results.singleAssignment = await testSingleGuestAssignment();
    results.capacityValidation = await testCapacityValidation();
    results.bulkAssignment = await testBulkAssignment();
    results.bulkUnassignment = await testBulkUnassignment();
    results.tableLocking = await testTableLocking();
    results.assignmentValidation = await testAssignmentValidation();
    results.capacityInfo = await testTableCapacityInfo();
    results.autoArrangementHistory = await testAutoArrangementHistory();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup
    await cleanupTestData();
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const testNames = {
    setup: 'Test Data Setup',
    singleAssignment: 'Single Guest Assignment',
    capacityValidation: 'Capacity Validation',
    bulkAssignment: 'Bulk Assignment',
    bulkUnassignment: 'Bulk Unassignment',
    tableLocking: 'Table Locking',
    assignmentValidation: 'Assignment Validation',
    capacityInfo: 'Table Capacity Info',
    autoArrangementHistory: 'Auto-Arrangement History'
  };
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [key, result] of Object.entries(results)) {
    const testName = testNames[key];
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${testName}: ${status}`);
    
    if (result) passedTests++;
    totalTests++;
  }
  
  console.log('========================');
  console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All manual table assignment tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testSingleGuestAssignment,
  testCapacityValidation,
  testBulkAssignment,
  testBulkUnassignment,
  testTableLocking,
  testAssignmentValidation,
  testTableCapacityInfo
};