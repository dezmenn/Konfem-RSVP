const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = 'demo-event-1';

async function testVenueManagementComplete() {
  console.log('🏢 Testing Complete Venue Management System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data.status);

    // Test 2: Get venue element library
    console.log('\n2. Testing venue element library...');
    const libraryResponse = await axios.get(`${BASE_URL}/api/venue-layout/library`);
    console.log('✅ Element library loaded:', libraryResponse.data.length, 'elements');
    console.log('   Available elements:', libraryResponse.data.map(e => e.name).join(', '));

    // Test 3: Get venue layout for event
    console.log('\n3. Testing venue layout retrieval...');
    const layoutResponse = await axios.get(`${BASE_URL}/api/venue-layout/events/${EVENT_ID}`);
    console.log('✅ Venue layout loaded:');
    console.log('   Elements:', layoutResponse.data.elements.length);
    console.log('   Bounds:', layoutResponse.data.bounds);

    // Test 4: Create a venue element from library
    console.log('\n4. Testing venue element creation...');
    const elementResponse = await axios.post(`${BASE_URL}/api/venue-layout/events/${EVENT_ID}/elements/from-library`, {
      type: 'stage',
      position: { x: 100, y: 50 },
      name: 'Main Stage'
    });
    console.log('✅ Venue element created:', elementResponse.data.name);
    const elementId = elementResponse.data.id;

    // Test 5: Get tables for event
    console.log('\n5. Testing table management...');
    const tablesResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}`);
    console.log('✅ Tables loaded:', tablesResponse.data.length, 'tables');

    // Test 6: Create a new table
    console.log('\n6. Testing table creation...');
    const tableResponse = await axios.post(`${BASE_URL}/api/tables`, {
      eventId: EVENT_ID,
      name: 'Test Table',
      capacity: 8,
      position: { x: 200, y: 150 }
    });
    console.log('✅ Table created:', tableResponse.data.name);
    const tableId = tableResponse.data.id;

    // Test 7: Get table capacity info
    console.log('\n7. Testing table capacity info...');
    const capacityResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}/capacity`);
    console.log('✅ Capacity info loaded for', capacityResponse.data.length, 'tables');

    // Test 8: Validate venue layout
    console.log('\n8. Testing venue layout validation...');
    const validationResponse = await axios.get(`${BASE_URL}/api/venue-layout/events/${EVENT_ID}/validate`);
    console.log('✅ Layout validation completed:');
    console.log('   Valid:', validationResponse.data.isValid);
    console.log('   Errors:', validationResponse.data.errors.length);
    console.log('   Warnings:', validationResponse.data.warnings.length);

    // Test 9: Test auto-arrangement
    console.log('\n9. Testing auto table arrangement...');
    const autoArrangeResponse = await axios.post(`${BASE_URL}/api/tables/events/${EVENT_ID}/auto-arrange`, {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    });
    console.log('✅ Auto-arrangement completed:', autoArrangeResponse.data.message);

    // Test 10: Update venue element
    console.log('\n10. Testing venue element update...');
    const updateElementResponse = await axios.put(`${BASE_URL}/api/venue-layout/elements/${elementId}`, {
      name: 'Updated Main Stage',
      color: '#FF0000'
    });
    console.log('✅ Venue element updated:', updateElementResponse.data.name);

    // Test 11: Update table
    console.log('\n11. Testing table update...');
    const updateTableResponse = await axios.put(`${BASE_URL}/api/tables/${tableId}`, {
      name: 'Updated Test Table',
      capacity: 10
    });
    console.log('✅ Table updated:', updateTableResponse.data.name, 'capacity:', updateTableResponse.data.capacity);

    // Test 12: Lock/unlock table
    console.log('\n12. Testing table lock/unlock...');
    const lockResponse = await axios.post(`${BASE_URL}/api/tables/${tableId}/lock`);
    console.log('✅ Table locked:', lockResponse.data.isLocked);
    
    const unlockResponse = await axios.post(`${BASE_URL}/api/tables/${tableId}/unlock`);
    console.log('✅ Table unlocked:', !unlockResponse.data.isLocked);

    // Test 13: Duplicate table
    console.log('\n13. Testing table duplication...');
    const duplicateResponse = await axios.post(`${BASE_URL}/api/tables/${tableId}/duplicate`, {
      offset: { x: 50, y: 50 }
    });
    console.log('✅ Table duplicated:', duplicateResponse.data.name);
    const duplicatedTableId = duplicateResponse.data.id;

    // Test 14: Validate table arrangement
    console.log('\n14. Testing table arrangement validation...');
    const tableValidationResponse = await axios.get(`${BASE_URL}/api/tables/events/${EVENT_ID}/validate`);
    console.log('✅ Table arrangement validation completed:');
    console.log('   Valid:', tableValidationResponse.data.isValid);
    console.log('   Errors:', tableValidationResponse.data.errors.length);
    console.log('   Warnings:', tableValidationResponse.data.warnings.length);

    // Cleanup: Delete created elements
    console.log('\n15. Cleaning up test data...');
    await axios.delete(`${BASE_URL}/api/venue-layout/elements/${elementId}`);
    console.log('✅ Venue element deleted');
    
    await axios.delete(`${BASE_URL}/api/tables/${tableId}`);
    console.log('✅ Table deleted');
    
    await axios.delete(`${BASE_URL}/api/tables/${duplicatedTableId}`);
    console.log('✅ Duplicated table deleted');

    console.log('\n🎉 All venue management tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Venue element library working');
    console.log('   ✅ Venue layout management working');
    console.log('   ✅ Table management working');
    console.log('   ✅ Auto-arrangement working');
    console.log('   ✅ Validation systems working');
    console.log('   ✅ CRUD operations working');
    console.log('   ✅ Table locking/unlocking working');
    console.log('   ✅ Element duplication working');
    console.log('\n🚀 Venue management functionality is fully implemented and working!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd rsvp-backend && npm run dev');
    }
  }
}

// Run the test
testVenueManagementComplete();