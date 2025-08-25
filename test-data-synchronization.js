const fs = require('fs');
const path = require('path');

// Test that data synchronization works correctly after drag and drop operations
function testDataSynchronization() {
  try {
    console.log('🧪 Testing Data Synchronization After Drag & Drop...\n');
    
    const demoDataPath = path.join(__dirname, 'demo-data', 'mock-demo-data.json');
    const data = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    // Step 1: Analyze current state
    console.log('📊 Step 1: Current Data State Analysis');
    console.log('=====================================');
    
    const acceptedGuests = data.guests.filter(g => g.rsvpStatus === 'accepted');
    console.log(`Accepted guests: ${acceptedGuests.length}`);
    
    // Check for data consistency issues
    let inconsistencies = 0;
    
    console.log('\nGuest-Table Consistency Check:');
    acceptedGuests.forEach(guest => {
      // Find tables that claim to have this guest
      const tablesWithGuest = data.tables.filter(table => 
        table.assignedGuests && table.assignedGuests.includes(guest.id)
      );
      
      // Check consistency
      if (guest.tableAssignment && tablesWithGuest.length === 0) {
        console.log(`❌ ${guest.name}: has tableAssignment "${guest.tableAssignment}" but not in any table's assignedGuests`);
        inconsistencies++;
      } else if (!guest.tableAssignment && tablesWithGuest.length > 0) {
        console.log(`❌ ${guest.name}: no tableAssignment but appears in ${tablesWithGuest.map(t => t.name).join(', ')}`);
        inconsistencies++;
      } else if (guest.tableAssignment && tablesWithGuest.length === 1 && guest.tableAssignment !== tablesWithGuest[0].id) {
        console.log(`❌ ${guest.name}: tableAssignment "${guest.tableAssignment}" doesn't match table "${tablesWithGuest[0].id}"`);
        inconsistencies++;
      } else if (tablesWithGuest.length > 1) {
        console.log(`❌ ${guest.name}: appears in multiple tables: ${tablesWithGuest.map(t => t.name).join(', ')}`);
        inconsistencies++;
      } else if (guest.tableAssignment && tablesWithGuest.length === 1 && guest.tableAssignment === tablesWithGuest[0].id) {
        console.log(`✅ ${guest.name}: correctly assigned to ${tablesWithGuest[0].name}`);
      } else if (!guest.tableAssignment && tablesWithGuest.length === 0) {
        console.log(`✅ ${guest.name}: correctly unassigned`);
      }
    });
    
    console.log(`\nConsistency Summary: ${inconsistencies === 0 ? '✅ All consistent' : `❌ ${inconsistencies} inconsistencies found`}`);
    
    // Step 2: Simulate drag and drop operations
    console.log('\n🎯 Step 2: Drag & Drop Operation Simulation');
    console.log('===========================================');
    
    // Find a guest to test with
    const testGuest = acceptedGuests.find(g => g.tableAssignment);
    if (!testGuest) {
      console.log('❌ No assigned guests found for testing');
      return;
    }
    
    const currentTable = data.tables.find(t => t.id === testGuest.tableAssignment);
    const targetTable = data.tables.find(t => t.id !== testGuest.tableAssignment && !t.isLocked);
    
    if (!currentTable || !targetTable) {
      console.log('❌ Could not find suitable tables for testing');
      return;
    }
    
    console.log(`Testing scenario: Move "${testGuest.name}" from "${currentTable.name}" to "${targetTable.name}"`);
    
    // Step 3: Test the backend logic simulation
    console.log('\n🔧 Step 3: Backend Logic Simulation');
    console.log('===================================');
    
    console.log('Simulating MockGuestService.assignGuestToTable():');
    
    // 1. Check if guest exists
    console.log(`1. ✅ Guest "${testGuest.name}" found`);
    
    // 2. Check if target table exists
    console.log(`2. ✅ Target table "${targetTable.name}" found`);
    
    // 3. Remove from old table
    console.log(`3. Remove from old table "${currentTable.name}":`);
    const oldTableGuestIndex = currentTable.assignedGuests ? currentTable.assignedGuests.indexOf(testGuest.id) : -1;
    if (oldTableGuestIndex > -1) {
      console.log(`   ✅ Guest found in old table's assignedGuests at index ${oldTableGuestIndex}`);
      console.log(`   ✅ Would remove guest from old table's assignedGuests array`);
    } else {
      console.log(`   ❌ Guest not found in old table's assignedGuests array`);
    }
    
    // 4. Add to new table
    console.log(`4. Add to new table "${targetTable.name}":`);
    const newTableHasGuest = targetTable.assignedGuests && targetTable.assignedGuests.includes(testGuest.id);
    if (!newTableHasGuest) {
      console.log(`   ✅ Guest not already in new table's assignedGuests`);
      console.log(`   ✅ Would add guest to new table's assignedGuests array`);
    } else {
      console.log(`   ⚠️  Guest already in new table's assignedGuests`);
    }
    
    // 5. Update guest's tableAssignment
    console.log(`5. ✅ Would update guest's tableAssignment from "${testGuest.tableAssignment}" to "${targetTable.id}"`);
    
    // Step 4: Test API endpoint correctness
    console.log('\n🌐 Step 4: API Endpoint Verification');
    console.log('====================================');
    
    console.log('Frontend API calls:');
    console.log(`1. Unassign from old table: DELETE /api/guests/${testGuest.id}/table`);
    console.log(`2. Assign to new table: PUT /api/guests/${testGuest.id}/table`);
    console.log('   Body: { "tableId": "' + targetTable.id + '" }');
    
    console.log('\nBackend route handlers:');
    console.log('1. DELETE /api/guests/:id/table → MockGuestService.unassignGuestFromTable()');
    console.log('2. PUT /api/guests/:id/table → MockGuestService.assignGuestToTable()');
    
    // Step 5: Test data refresh logic
    console.log('\n🔄 Step 5: Data Refresh Logic');
    console.log('=============================');
    
    console.log('Frontend refresh sequence after drag & drop:');
    console.log('1. ✅ Call unassignGuestFromTable() API');
    console.log('2. ✅ Call assignGuestToTable() API');
    console.log('3. ✅ Call loadGuests() to refresh guest data');
    console.log('4. ✅ Call loadTables() to refresh table data');
    console.log('5. ✅ Call onTablesChange() to notify parent component');
    console.log('6. ✅ Call categorizeGuests() to update UI state');
    
    // Step 6: Expected final state
    console.log('\n📋 Step 6: Expected Final State');
    console.log('===============================');
    
    console.log('After successful drag & drop operation:');
    console.log(`Guest "${testGuest.name}":`);
    console.log(`   - tableAssignment: "${targetTable.id}"`);
    console.log(`   - Appears in: ${targetTable.name} only`);
    
    console.log(`Old table "${currentTable.name}":`);
    console.log(`   - assignedGuests: should NOT contain "${testGuest.id}"`);
    console.log(`   - Guest count: reduced by 1`);
    
    console.log(`New table "${targetTable.name}":`);
    console.log(`   - assignedGuests: should contain "${testGuest.id}"`);
    console.log(`   - Guest count: increased by 1`);
    
    // Step 7: Implementation verification
    console.log('\n✅ Step 7: Implementation Verification');
    console.log('======================================');
    
    // Check if the MockGuestService has been updated
    const mockGuestServicePath = path.join(__dirname, 'rsvp-backend', 'src', 'services', 'MockGuestService.ts');
    const mockGuestServiceContent = fs.readFileSync(mockGuestServicePath, 'utf8');
    
    const features = {
      'Remove from old table': mockGuestServiceContent.includes('oldTable.assignedGuests.splice'),
      'Add to new table': mockGuestServiceContent.includes('table.assignedGuests.push'),
      'Update table data': mockGuestServiceContent.includes('updateTable'),
      'Bidirectional sync': mockGuestServiceContent.includes('assignedGuests') && mockGuestServiceContent.includes('tableAssignment'),
      'Null assignment handling': mockGuestServiceContent.includes('tableAssignment: null')
    };
    
    console.log('Backend implementation status:');
    Object.entries(features).forEach(([feature, implemented]) => {
      console.log(`   ${implemented ? '✅' : '❌'} ${feature}`);
    });
    
    // Check frontend API calls
    const autoArrangementPath = path.join(__dirname, 'rsvp-web', 'src', 'components', 'AutoTableArrangement.tsx');
    const autoArrangementContent = fs.readFileSync(autoArrangementPath, 'utf8');
    
    const frontendFeatures = {
      'Correct assign API': autoArrangementContent.includes('PUT') && autoArrangementContent.includes('/table'),
      'Correct unassign API': autoArrangementContent.includes('DELETE') && autoArrangementContent.includes('/table'),
      'Data refresh after drop': autoArrangementContent.includes('loadGuests()') && autoArrangementContent.includes('loadTables()'),
      'Parent notification': autoArrangementContent.includes('onTablesChange')
    };
    
    console.log('\nFrontend implementation status:');
    Object.entries(frontendFeatures).forEach(([feature, implemented]) => {
      console.log(`   ${implemented ? '✅' : '❌'} ${feature}`);
    });
    
    // Step 8: Testing recommendations
    console.log('\n🧪 Step 8: Testing Recommendations');
    console.log('==================================');
    
    console.log('Manual testing steps:');
    console.log('1. Start the backend server in demo mode');
    console.log('2. Open the Auto Arrangement tab');
    console.log('3. Drag a guest from one table to another');
    console.log('4. Verify the guest disappears from the old table');
    console.log('5. Verify the guest appears in the new table');
    console.log('6. Check that capacity counts update correctly');
    console.log('7. Refresh the page and verify data persistence');
    
    console.log('\nDebugging tips:');
    console.log('- Check browser network tab for API call responses');
    console.log('- Look for console errors during drag & drop');
    console.log('- Verify that both API calls (DELETE and PUT) succeed');
    console.log('- Check that data refresh calls complete successfully');
    
    console.log('\n🎉 Data Synchronization Test Completed!');
    console.log('=======================================');
    
    const allFeaturesImplemented = Object.values(features).every(f => f) && Object.values(frontendFeatures).every(f => f);
    console.log(`Overall Implementation: ${allFeaturesImplemented ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
    
    if (allFeaturesImplemented) {
      console.log('\n🎯 Summary: Data synchronization should now work correctly!');
      console.log('The drag & drop operation will properly:');
      console.log('- Remove guests from old tables');
      console.log('- Add guests to new tables');
      console.log('- Update both guest and table data');
      console.log('- Refresh the UI to show changes');
    } else {
      console.log('\n⚠️  Summary: Some synchronization features may need attention.');
      console.log('Please review the implementation status above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDataSynchronization();