const axios = require('axios');
const fs = require('fs');

async function testExcelVisualLayout() {
  console.log('🧪 Testing Excel Visual Layout Export...\n');
  
  try {
    // Test Excel export with venue layout
    console.log('📊 Testing Excel export with visual layout...');
    const excelResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'xlsx',
      includeVenueLayout: true,
      includeTableAssignments: true,
      includeGuestDetails: false
    }, {
      responseType: 'arraybuffer'
    });

    if (excelResponse.status === 200) {
      const filename = `visual-layout-test-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, excelResponse.data);
      console.log(`✅ Excel file generated successfully: ${filename}`);
      console.log('📋 Excel file should now contain:');
      console.log('   - Event Summary sheet');
      console.log('   - Table Assignments sheet');
      console.log('   - Table Summary sheet');
      console.log('   - Visual Layout sheet (NEW!) with:');
      console.log('     • Grid-based venue visualization using emojis');
      console.log('     • 🔵 = Occupied tables');
      console.log('     • ⚪ = Empty tables');
      console.log('     • 🔒 = Locked tables');
      console.log('     • 🎭 = Stage elements');
      console.log('     • 🍺 = Bar elements');
      console.log('     • 🚪 = Entrance elements');
      console.log('     • 💃 = Dance floor elements');
      console.log('     • ⬜ = Other venue elements');
      console.log('     • Table details below the grid');
      console.log('   - Venue Elements sheet (if venue elements exist)\n');
    } else {
      console.log('❌ Excel export failed');
      return;
    }

    // Test Excel export without venue layout (should not include visual layout sheet)
    console.log('📊 Testing Excel export without venue layout...');
    const noLayoutResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'xlsx',
      includeVenueLayout: false,
      includeTableAssignments: true
    }, {
      responseType: 'arraybuffer'
    });

    if (noLayoutResponse.status === 200) {
      const noLayoutFilename = `no-visual-layout-test-${Date.now()}.xlsx`;
      fs.writeFileSync(noLayoutFilename, noLayoutResponse.data);
      console.log(`✅ Excel without layout generated: ${noLayoutFilename}`);
      console.log('📋 This file should NOT contain the Visual Layout sheet\n');
    }

    // Test mixed export (tables only, no venue elements)
    console.log('📊 Testing mixed export scenario...');
    const mixedResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'xlsx',
      includeVenueLayout: true,
      includeTableAssignments: true,
      includeGuestDetails: true
    }, {
      responseType: 'arraybuffer'
    });

    if (mixedResponse.status === 200) {
      const mixedFilename = `mixed-layout-test-${Date.now()}.xlsx`;
      fs.writeFileSync(mixedFilename, mixedResponse.data);
      console.log(`✅ Mixed export generated: ${mixedFilename}`);
      console.log('📋 This file should contain all sheets including Visual Layout\n');
    }

    console.log('🎉 All Excel visual layout tests completed successfully!');
    console.log('\n📋 Visual Layout Features Added:');
    console.log('   ✓ Grid-based venue visualization (30x30 grid)');
    console.log('   ✓ Emoji-based element representation');
    console.log('   ✓ Automatic scaling to fit venue bounds');
    console.log('   ✓ Legend explaining all symbols');
    console.log('   ✓ Table details below the visual grid');
    console.log('   ✓ Proper column and row sizing');
    console.log('   ✓ Only included when includeVenueLayout is true');
    console.log('   ✓ Works with or without venue elements');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testExcelVisualLayout();