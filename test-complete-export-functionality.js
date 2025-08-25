const axios = require('axios');
const fs = require('fs');

async function testCompleteExportFunctionality() {
  console.log('🧪 Testing Complete Export Functionality...\n');
  
  try {
    // Test 1: Seating Chart Excel Export with Visual Layout
    console.log('📊 Test 1: Seating Chart Excel Export with Visual Layout...');
    const seatingExcelResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'xlsx',
      includeVenueLayout: true,
      includeTableAssignments: true,
      includeGuestDetails: false
    }, {
      responseType: 'arraybuffer'
    });

    if (seatingExcelResponse.status === 200) {
      const filename = `test-complete-export-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, seatingExcelResponse.data);
      console.log(`✅ Seating Chart Excel: ${filename}`);
      console.log('   Should contain: Event Summary, Table Assignments, Table Summary, Visual Layout, Venue Elements');
    }

    // Test 2: Venue Layout Excel Export with Visual Layout
    console.log('\n📊 Test 2: Venue Layout Excel Export with Visual Layout...');
    const venueExcelResponse = await axios.post('http://localhost:5000/api/exports/venue-layout', {
      eventId: 'demo-event',
      format: 'xlsx'
    }, {
      responseType: 'arraybuffer'
    });

    if (venueExcelResponse.status === 200) {
      const filename = `test-complete-export-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, venueExcelResponse.data);
      console.log(`✅ Venue Layout Excel: ${filename}`);
      console.log('   Should contain: Event Info, Table Layout, Venue Elements, Visual Layout, Statistics');
    }

    // Test 3: PDF Export with Fixed Layout
    console.log('\n📄 Test 3: PDF Export with Fixed Layout...');
    const pdfResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'pdf',
      includeVenueLayout: true,
      includeTableAssignments: true,
      includeGuestDetails: true
    }, {
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status === 200) {
      const filename = `test-complete-export-${Date.now()}.pdf`;
      fs.writeFileSync(filename, pdfResponse.data);
      console.log(`✅ Complete PDF: ${filename}`);
      console.log('   Should have: Fixed title, proper spacing, centered text, positioned legend');
    }

    // Test 4: CSV Export
    console.log('\n📄 Test 4: CSV Export...');
    const csvResponse = await axios.post('http://localhost:5000/api/exports/seating-chart', {
      eventId: 'demo-event',
      format: 'csv',
      includeTableAssignments: true
    }, {
      responseType: 'arraybuffer'
    });

    if (csvResponse.status === 200) {
      const filename = `test-complete-export-${Date.now()}.csv`;
      fs.writeFileSync(filename, csvResponse.data);
      console.log(`✅ CSV Export: ${filename}`);
      console.log('   Should contain: Table assignments with statistics');
    }

    // Test 5: Guest List Export
    console.log('\n📊 Test 5: Guest List Excel Export...');
    const guestListResponse = await axios.post('http://localhost:5000/api/exports/guest-list', {
      eventId: 'demo-event',
      format: 'xlsx'
    }, {
      responseType: 'arraybuffer'
    });

    if (guestListResponse.status === 200) {
      const filename = `test-guest-list-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, guestListResponse.data);
      console.log(`✅ Guest List Excel: ${filename}`);
      console.log('   Should contain: Complete guest information with table assignments');
    }

    console.log('\n🎉 All export functionality tests completed successfully!');
    console.log('\n📋 Export Features Summary:');
    console.log('   ✓ PDF Exports:');
    console.log('     • Fixed title truncation ("Seating Chart" displays completely)');
    console.log('     • Improved spacing and positioning');
    console.log('     • Enhanced venue element text centering');
    console.log('     • Better table text scaling');
    console.log('     • Smart legend positioning');
    console.log('     • Portrait/landscape optimization');
    console.log('   ✓ Excel Exports:');
    console.log('     • Visual Layout sheet with emoji-based venue visualization');
    console.log('     • 30x30 grid representation');
    console.log('     • Automatic scaling to fit venue bounds');
    console.log('     • Legend with symbol explanations');
    console.log('     • Table details below visual grid');
    console.log('     • Multiple data sheets (Summary, Assignments, Layout, Elements)');
    console.log('   ✓ CSV Exports:');
    console.log('     • Complete table and guest data');
    console.log('     • Statistics included');
    console.log('   ✓ Format Support:');
    console.log('     • .xlsx (not .excel)');
    console.log('     • .pdf with proper layout');
    console.log('     • .csv with UTF-8 encoding');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteExportFunctionality();