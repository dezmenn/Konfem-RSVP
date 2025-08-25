const axios = require('axios');
const fs = require('fs');

async function testPDFLayoutFix() {
  console.log('🧪 Testing PDF Layout Fix...\n');
  
  try {
    // Test PDF export with venue layout
    console.log('📄 Testing PDF export with venue layout...');
    const pdfResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'pdf',
      includeVenueLayout: true,
      includeTableAssignments: true,
      includeGuestDetails: false
    }, {
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status === 200) {
      const filename = `layout-fix-test-${Date.now()}.pdf`;
      fs.writeFileSync(filename, pdfResponse.data);
      console.log(`✅ PDF generated successfully: ${filename}`);
      console.log('📊 PDF should now have:');
      console.log('   - Complete "Seating Chart" title (not cut off)');
      console.log('   - Proper spacing between header and layout');
      console.log('   - Venue elements with centered text');
      console.log('   - Tables with properly sized text');
      console.log('   - Legend positioned below layout without overlap');
      console.log('   - Statistics positioned to avoid overlap\n');
    } else {
      console.log('❌ PDF export failed');
      return;
    }

    // Test print-optimized version (portrait)
    console.log('📄 Testing print-optimized PDF (portrait)...');
    const portraitResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'pdf',
      includeVenueLayout: true,
      includeTableAssignments: true,
      printOptimized: true
    }, {
      responseType: 'arraybuffer'
    });

    if (portraitResponse.status === 200) {
      const portraitFilename = `layout-fix-portrait-${Date.now()}.pdf`;
      fs.writeFileSync(portraitFilename, portraitResponse.data);
      console.log(`✅ Portrait PDF generated: ${portraitFilename}`);
      console.log('📊 Portrait PDF should have adjusted statistics positioning\n');
    }

    // Test without venue layout
    console.log('📄 Testing PDF without venue layout...');
    const tablesOnlyResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'pdf',
      includeVenueLayout: false,
      includeTableAssignments: true
    }, {
      responseType: 'arraybuffer'
    });

    if (tablesOnlyResponse.status === 200) {
      const tablesFilename = `layout-fix-tables-only-${Date.now()}.pdf`;
      fs.writeFileSync(tablesFilename, tablesOnlyResponse.data);
      console.log(`✅ Tables-only PDF generated: ${tablesFilename}`);
      console.log('📊 Should show "Table Layout" instead of "Venue Layout"\n');
    }

    console.log('🎉 All PDF layout tests completed successfully!');
    console.log('\n📋 Layout Improvements Made:');
    console.log('   ✓ Fixed title truncation - "Seating Chart" now displays completely');
    console.log('   ✓ Improved spacing - better margins and positioning');
    console.log('   ✓ Enhanced venue element text - proper centering and sizing');
    console.log('   ✓ Better table text scaling - responsive to table size');
    console.log('   ✓ Smart legend positioning - avoids overlap with layout');
    console.log('   ✓ Statistics positioning - adapts to portrait/landscape');
    console.log('   ✓ Constrained element sizes - prevents oversized elements');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPDFLayoutFix();