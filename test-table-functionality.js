const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

async function testTableFunctionality() {
  console.log('🧪 Testing Table Management Functionality...\n');

  try {
    // Test 1: Create a new table
    console.log('1. Creating a new table...');
    const createResponse = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: EVENT_ID,
        name: 'Test Table 1',
        capacity: 8,
        position: { x: 100, y: 100 }
      })
    });

    if (createResponse.ok) {
      const newTable = await createResponse.json();
      console.log('✅ Table created successfully:', newTable.name);
      console.log(`   ID: ${newTable.id}, Capacity: ${newTable.capacity}, Position: (${newTable.position.x}, ${newTable.position.y})`);
      
      const tableId = newTable.id;

      // Test 2: Get all tables for the event
      console.log('\n2. Fetching all tables for event...');
      const tablesResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}`);
      
      if (tablesResponse.ok) {
        const tables = await tablesResponse.json();
        console.log(`✅ Found ${tables.length} tables for event`);
        tables.forEach(table => {
          console.log(`   - ${table.name} (${table.capacity} seats) ${table.isLocked ? '🔒' : '🔓'}`);
        });
      } else {
        console.log('❌ Failed to fetch tables');
      }

      // Test 3: Update table properties
      console.log('\n3. Updating table properties...');
      const updateResponse = await fetch(`${API_BASE}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Test Table',
          capacity: 10,
          position: { x: 150, y: 150 }
        })
      });

      if (updateResponse.ok) {
        const updatedTable = await updateResponse.json();
        console.log('✅ Table updated successfully:', updatedTable.name);
        console.log(`   New capacity: ${updatedTable.capacity}, New position: (${updatedTable.position.x}, ${updatedTable.position.y})`);
      } else {
        console.log('❌ Failed to update table');
      }

      // Test 4: Lock the table
      console.log('\n4. Locking the table...');
      const lockResponse = await fetch(`${API_BASE}/tables/${tableId}/lock`, {
        method: 'POST'
      });

      if (lockResponse.ok) {
        const lockedTable = await lockResponse.json();
        console.log('✅ Table locked successfully');
        console.log(`   Locked status: ${lockedTable.isLocked}`);
      } else {
        console.log('❌ Failed to lock table');
      }

      // Test 5: Get table capacity information
      console.log('\n5. Getting table capacity information...');
      const capacityResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}/capacity`);
      
      if (capacityResponse.ok) {
        const capacityInfo = await capacityResponse.json();
        console.log('✅ Capacity information retrieved:');
        capacityInfo.forEach(info => {
          console.log(`   - ${info.name}: ${info.occupied}/${info.capacity} seats ${info.isOverCapacity ? '⚠️ OVER CAPACITY' : '✅'}`);
        });
      } else {
        console.log('❌ Failed to get capacity information');
      }

      // Test 6: Validate table arrangement
      console.log('\n6. Validating table arrangement...');
      const validateResponse = await fetch(`${API_BASE}/tables/events/${EVENT_ID}/validate`);
      
      if (validateResponse.ok) {
        const validation = await validateResponse.json();
        console.log(`✅ Validation completed - ${validation.isValid ? 'VALID' : 'INVALID'}`);
        
        if (validation.errors.length > 0) {
          console.log('   Errors:');
          validation.errors.forEach(error => console.log(`   - ❌ ${error}`));
        }
        
        if (validation.warnings.length > 0) {
          console.log('   Warnings:');
          validation.warnings.forEach(warning => console.log(`   - ⚠️ ${warning}`));
        }
      } else {
        console.log('❌ Failed to validate arrangement');
      }

      // Test 7: Duplicate the table
      console.log('\n7. Duplicating the table...');
      const duplicateResponse = await fetch(`${API_BASE}/tables/${tableId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 50, y: 50 } })
      });

      if (duplicateResponse.ok) {
        const duplicatedTable = await duplicateResponse.json();
        console.log('✅ Table duplicated successfully:', duplicatedTable.name);
        console.log(`   Position: (${duplicatedTable.position.x}, ${duplicatedTable.position.y})`);
      } else {
        console.log('❌ Failed to duplicate table');
      }

      // Test 8: Unlock the table
      console.log('\n8. Unlocking the table...');
      const unlockResponse = await fetch(`${API_BASE}/tables/${tableId}/unlock`, {
        method: 'POST'
      });

      if (unlockResponse.ok) {
        const unlockedTable = await unlockResponse.json();
        console.log('✅ Table unlocked successfully');
        console.log(`   Locked status: ${unlockedTable.isLocked}`);
      } else {
        console.log('❌ Failed to unlock table');
      }

      // Test 9: Delete the table (this should fail if there are assigned guests)
      console.log('\n9. Attempting to delete the table...');
      const deleteResponse = await fetch(`${API_BASE}/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        console.log('✅ Table deleted successfully');
      } else {
        const errorData = await deleteResponse.json();
        console.log('❌ Failed to delete table:', errorData.error);
      }

    } else {
      const errorData = await createResponse.json();
      console.log('❌ Failed to create table:', errorData.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Table functionality test completed!');
}

// Run the test
testTableFunctionality();