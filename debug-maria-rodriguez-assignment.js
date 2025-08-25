/**
 * Debug script to investigate why Maria Rodriguez cannot be assigned to table 2
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

async function debugMariaRodriguezAssignment() {
  console.log('🔍 Debugging Maria Rodriguez Assignment Issue\n');
  
  // Step 1: Find Maria Rodriguez
  console.log('📝 Step 1: Finding Maria Rodriguez...');
  const { response: guestsResponse, data: guestsData } = await makeRequest(`/api/guests/${TEST_EVENT_ID}`);
  
  if (!guestsResponse.ok || !guestsData.success) {
    console.error('❌ Failed to get guests');
    return;
  }
  
  const mariaRodriguez = guestsData.data.find(guest => 
    guest.name.toLowerCase().includes('maria') && guest.name.toLowerCase().includes('rodriguez')
  );
  
  if (!mariaRodriguez) {
    console.error('❌ Maria Rodriguez not found in guest list');
    console.log('Available guests:');
    guestsData.data.forEach(guest => console.log(`   - ${guest.name} (${guest.id})`));
    return;
  }
  
  console.log(`✅ Found Maria Rodriguez:`);
  console.log(`   - ID: ${mariaRodriguez.id}`);
  console.log(`   - Name: ${mariaRodriguez.name}`);
  console.log(`   - RSVP Status: ${mariaRodriguez.rsvpStatus}`);
  console.log(`   - Additional Guests: ${mariaRodriguez.additionalGuestCount || 0}`);
  console.log(`   - Current Table: ${mariaRodriguez.tableAssignment || 'unassigned'}`);
  console.log(`   - Bride/Groom Side: ${mariaRodriguez.brideOrGroomSide}`);
  console.log(`   - Relationship: ${mariaRodriguez.relationshipType}`);
  
  // Step 2: Get Table 2 information
  console.log('\n📝 Step 2: Getting Table 2 information...');
  const { response: tablesResponse, data: tablesData } = await makeRequest(`/api/tables/events/${TEST_EVENT_ID}`);
  
  if (!tablesResponse.ok) {
    console.error('❌ Failed to get tables');
    return;
  }
  
  const table2 = tablesData.find(table => table.name === 'Table 2' || table.id === 'table-2');
  
  if (!table2) {
    console.error('❌ Table 2 not found');
    console.log('Available tables:');
    tablesData.forEach(table => console.log(`   - ${table.name} (${table.id})`));
    return;
  }
  
  console.log(`✅ Found Table 2:`);
  console.log(`   - ID: ${table2.id}`);
  console.log(`   - Name: ${table2.name}`);
  console.log(`   - Capacity: ${table2.capacity}`);
  console.log(`   - Is Locked: ${table2.isLocked || false}`);
  console.log(`   - Assigned Guests: ${table2.assignedGuests ? table2.assignedGuests.length : 0}`);
  
  if (table2.assignedGuests && table2.assignedGuests.length > 0) {
    console.log('   - Current guests:');
    for (const guestId of table2.assignedGuests) {
      const guest = guestsData.data.find(g => g.id === guestId);
      if (guest) {
        const seatsNeeded = 1 + (guest.additionalGuestCount || 0);
        console.log(`     * ${guest.name} (${seatsNeeded} seats)`);
      } else {
        console.log(`     * Unknown guest (${guestId})`);
      }
    }
  }
  
  // Step 3: Calculate current capacity usage
  console.log('\n📝 Step 3: Calculating capacity usage...');
  let currentSeatsUsed = 0;
  
  if (table2.assignedGuests) {
    for (const guestId of table2.assignedGuests) {
      const guest = guestsData.data.find(g => g.id === guestId);
      if (guest) {
        const seatsNeeded = 1 + (guest.additionalGuestCount || 0);
        currentSeatsUsed += seatsNeeded;
      }
    }
  }
  
  const mariaSeatsNeeded = 1 + (mariaRodriguez.additionalGuestCount || 0);
  const availableSeats = table2.capacity - currentSeatsUsed;
  
  console.log(`✅ Capacity Analysis:`);
  console.log(`   - Table capacity: ${table2.capacity}`);
  console.log(`   - Currently used seats: ${currentSeatsUsed}`);
  console.log(`   - Available seats: ${availableSeats}`);
  console.log(`   - Maria needs: ${mariaSeatsNeeded} seats`);
  console.log(`   - Can fit Maria: ${availableSeats >= mariaSeatsNeeded ? '✅ YES' : '❌ NO'}`);
  
  // Step 4: Check for potential issues
  console.log('\n📝 Step 4: Checking for potential issues...');
  
  const issues = [];
  
  if (table2.isLocked) {
    issues.push('Table 2 is locked');
  }
  
  if (mariaRodriguez.rsvpStatus !== 'accepted') {
    issues.push(`Maria's RSVP status is '${mariaRodriguez.rsvpStatus}' (should be 'accepted')`);
  }
  
  if (availableSeats < mariaSeatsNeeded) {
    issues.push(`Insufficient capacity: needs ${mariaSeatsNeeded} seats, only ${availableSeats} available`);
  }
  
  if (issues.length > 0) {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No obvious issues found');
  }
  
  // Step 5: Test the assignment API directly
  console.log('\n📝 Step 5: Testing assignment API directly...');
  
  const { response: assignResponse, data: assignData } = await makeRequest(`/api/guests/${mariaRodriguez.id}/assign-table`, {
    method: 'POST',
    body: JSON.stringify({ tableId: table2.id })
  });
  
  if (assignResponse.ok && assignData.success) {
    console.log('✅ Assignment API call succeeded!');
    console.log(`✅ Maria Rodriguez successfully assigned to ${table2.name}`);
    
    // Verify the assignment
    const { response: verifyResponse, data: verifyData } = await makeRequest(`/api/guests/guest/${mariaRodriguez.id}`);
    if (verifyResponse.ok && verifyData.success) {
      console.log(`✅ Verified: Maria's table assignment is now ${verifyData.data.tableAssignment}`);
    }
  } else {
    console.log('❌ Assignment API call failed:');
    console.log(`   - Status: ${assignResponse.status}`);
    console.log(`   - Response: ${JSON.stringify(assignData, null, 2)}`);
  }
  
  // Step 6: Summary and recommendations
  console.log('\n📊 Summary and Recommendations:');
  console.log('================================');
  
  if (assignResponse.ok && assignData.success) {
    console.log('✅ Maria Rodriguez CAN be assigned to Table 2');
    console.log('💡 The issue might be in the frontend UI or drag-and-drop logic');
    console.log('💡 Check the browser console for frontend errors');
  } else {
    console.log('❌ Maria Rodriguez CANNOT be assigned to Table 2');
    console.log('💡 Backend validation is preventing the assignment');
    console.log('💡 Check the issues listed above for the root cause');
  }
}

// Run the debug script
if (require.main === module) {
  debugMariaRodriguezAssignment()
    .catch(error => {
      console.error('\n❌ Debug script failed:', error);
      process.exit(1);
    });
}

module.exports = { debugMariaRodriguezAssignment };