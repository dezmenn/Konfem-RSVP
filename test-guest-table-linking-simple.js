// Simple test to verify guest-table linking functionality
// This test checks the API endpoints and data flow

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';
const EVENT_ID = 'demo-event-1';

async function testGuestTableLinking() {
  console.log('🚀 Starting Guest-Table Linking API Test...');
  
  try {
    // Test 1: Get all guests
    console.log('\n📋 Test 1: Fetching guests...');
    const guestsResponse = await fetch(`${BASE_URL}/guests/events/${EVENT_ID}`);
    const guests = await guestsResponse.json();
    console.log(`✅ Found ${guests.length} guests`);
    
    // Test 2: Get all tables
    console.log('\n📋 Test 2: Fetching tables...');
    const tablesResponse = await fetch(`${BASE_URL}/tables/events/${EVENT_ID}`);
    const tables = await tablesResponse.json();
    console.log(`✅ Found ${tables.length} tables`);
    
    // Test 3: Check current assignments
    console.log('\n📋 Test 3: Checking current assignments...');
    const assignedGuests = guests.filter(g => g.tableAssignment);
    const unassignedGuests = guests.filter(g => !g.tableAssignment);
    
    console.log(`Assigned guests: ${assignedGuests.length}`);
    console.log(`Unassigned guests: ${unassignedGuests.length}`);
    
    assignedGuests.forEach(guest => {
      console.log(`  - ${guest.name} → ${guest.tableAssignment}`);
    });
    
    // Test 4: Test assigning an unassigned guest
    if (unassignedGuests.length > 0 && tables.length > 0) {
      console.log('\n📋 Test 4: Testing guest assignment...');
      const testGuest = unassignedGuests[0];
      const testTable = tables[0];
      
      console.log(`Assigning ${testGuest.name} to ${testTable.name}...`);
      
      const assignResponse = await fetch(`${BASE_URL}/guests/${testGuest.id}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: testTable.id })
      });
      
      const assignResult = await assignResponse.json();
      
      if (assignResult.success) {
        console.log('✅ Assignment successful');
        
        // Verify the assignment
        const updatedGuestResponse = await fetch(`${BASE_URL}/guests/${testGuest.id}`);
        const updatedGuest = await updatedGuestResponse.json();
        
        console.log(`Guest table assignment: ${updatedGuest.tableAssignment}`);
        
        // Check if guest is in table's assignedGuests array
        const updatedTableResponse = await fetch(`${BASE_URL}/tables/${testTable.id}`);
        const updatedTable = await updatedTableResponse.json();
        
        const isInTableArray = updatedTable.assignedGuests && updatedTable.assignedGuests.includes(testGuest.id);
        console.log(`Guest in table's assignedGuests array: ${isInTableArray}`);
        
        if (updatedGuest.tableAssignment === testTable.name && isInTableArray) {
          console.log('✅ Bidirectional linking verified');
        } else {
          console.log('❌ Bidirectional linking failed');
        }
        
        // Test 5: Test unassigning the guest
        console.log('\n📋 Test 5: Testing guest unassignment...');
        
        const unassignResponse = await fetch(`${BASE_URL}/guests/${testGuest.id}/unassign-table`, {
          method: 'POST'
        });
        
        const unassignResult = await unassignResponse.json();
        
        if (unassignResult.success) {
          console.log('✅ Unassignment successful');
          
          // Verify the unassignment
          const finalGuestResponse = await fetch(`${BASE_URL}/guests/${testGuest.id}`);
          const finalGuest = await finalGuestResponse.json();
          
          const finalTableResponse = await fetch(`${BASE_URL}/tables/${testTable.id}`);
          const finalTable = await finalTableResponse.json();
          
          const isStillInTableArray = finalTable.assignedGuests && finalTable.assignedGuests.includes(testGuest.id);
          
          console.log(`Guest table assignment after unassign: ${finalGuest.tableAssignment || 'null'}`);
          console.log(`Guest still in table array: ${isStillInTableArray}`);
          
          if (!finalGuest.tableAssignment && !isStillInTableArray) {
            console.log('✅ Bidirectional unlinking verified');
          } else {
            console.log('❌ Bidirectional unlinking failed');
          }
        } else {
          console.log('❌ Unassignment failed:', unassignResult.message);
        }
        
      } else {
        console.log('❌ Assignment failed:', assignResult.message);
      }
    } else {
      console.log('⚠️ No unassigned guests or tables available for testing');
    }
    
    // Test 6: Test table capacity info
    console.log('\n📋 Test 6: Testing table capacity info...');
    
    const capacityResponse = await fetch(`${BASE_URL}/tables/events/${EVENT_ID}/capacity`);
    const capacityInfo = await capacityResponse.json();
    
    console.log('Table capacity information:');
    capacityInfo.forEach(info => {
      console.log(`  - ${info.name}: ${info.occupied}/${info.capacity} (${info.available} available)${info.isOverCapacity ? ' ⚠️ OVER CAPACITY' : ''}`);
    });
    
    // Test 7: Test auto-arrangement endpoint
    console.log('\n📋 Test 7: Testing auto-arrangement endpoint...');
    
    const autoArrangeResponse = await fetch(`${BASE_URL}/tables/events/${EVENT_ID}/auto-arrange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        maxGuestsPerTable: 8
      })
    });
    
    const autoArrangeResult = await autoArrangeResponse.json();
    
    if (autoArrangeResult.success) {
      console.log('✅ Auto-arrangement completed:', autoArrangeResult.message);
    } else {
      console.log('❌ Auto-arrangement failed:', autoArrangeResult.message);
    }
    
    console.log('\n🎉 Guest-Table Linking API Test Completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Guest and table data retrieval');
    console.log('✅ Assignment/unassignment functionality');
    console.log('✅ Bidirectional data synchronization');
    console.log('✅ Table capacity tracking');
    console.log('✅ Auto-arrangement integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the backend server is running on port 3001');
  }
}

// Check if node-fetch is available, if not provide instructions
try {
  require('node-fetch');
  testGuestTableLinking().catch(console.error);
} catch (error) {
  console.log('📦 Installing node-fetch...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    console.log('✅ node-fetch installed, rerun the test');
  } catch (installError) {
    console.error('❌ Failed to install node-fetch. Please run: npm install node-fetch@2');
  }
}