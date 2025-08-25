const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_EVENT_ID = 'demo-event-1';

async function testExportFunctionality() {
  console.log('🧪 Testing Export Functionality');
  console.log('================================\n');

  try {
    // Test 1: Get available export formats
    console.log('1. Testing export formats endpoint...');
    const formatsResponse = await axios.get(`${API_BASE_URL}/exports/formats`);
    console.log('✅ Export formats retrieved successfully');
    console.log('Available formats:', JSON.stringify(formatsResponse.data, null, 2));
    console.log();

    // Test 2: Export seating chart as CSV
    console.log('2. Testing seating chart CSV export...');
    const seatingChartCsvResponse = await axios.post(`${API_BASE_URL}/exports/seating-chart`, {
      eventId: TEST_EVENT_ID,
      format: 'csv',
      options: {
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      }
    }, {
      responseType: 'arraybuffer'
    });

    if (seatingChartCsvResponse.status === 200) {
      const filename = 'test-seating-chart.csv';
      fs.writeFileSync(filename, seatingChartCsvResponse.data);
      console.log(`✅ Seating chart CSV exported successfully: ${filename}`);
      
      // Verify CSV content
      const csvContent = fs.readFileSync(filename, 'utf-8');
      const lines = csvContent.split('\n');
      console.log(`   - CSV has ${lines.length} lines`);
      console.log(`   - Headers: ${lines[0]}`);
      console.log(`   - Contains statistics: ${csvContent.includes('Statistics') ? 'Yes' : 'No'}`);
    }
    console.log();

    // Test 3: Export guest list as CSV
    console.log('3. Testing guest list CSV export...');
    const guestListCsvResponse = await axios.post(`${API_BASE_URL}/exports/guest-list`, {
      eventId: TEST_EVENT_ID,
      format: 'csv'
    }, {
      responseType: 'arraybuffer'
    });

    if (guestListCsvResponse.status === 200) {
      const filename = 'test-guest-list.csv';
      fs.writeFileSync(filename, guestListCsvResponse.data);
      console.log(`✅ Guest list CSV exported successfully: ${filename}`);
      
      // Verify CSV content
      const csvContent = fs.readFileSync(filename, 'utf-8');
      const lines = csvContent.split('\n');
      console.log(`   - CSV has ${lines.length} lines`);
      console.log(`   - Headers: ${lines[0]}`);
      console.log(`   - Sample data: ${lines[1] || 'No data'}`);
    }
    console.log();

    // Test 4: Export seating chart as PDF (placeholder)
    console.log('4. Testing seating chart PDF export (placeholder)...');
    const seatingChartPdfResponse = await axios.post(`${API_BASE_URL}/exports/seating-chart`, {
      eventId: TEST_EVENT_ID,
      format: 'pdf',
      options: {
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: true
      }
    }, {
      responseType: 'arraybuffer'
    });

    if (seatingChartPdfResponse.status === 200) {
      const filename = 'test-seating-chart.pdf';
      fs.writeFileSync(filename, seatingChartPdfResponse.data);
      console.log(`✅ Seating chart PDF exported successfully: ${filename} (placeholder)`);
    }
    console.log();

    // Test 5: Export venue layout as Excel (placeholder)
    console.log('5. Testing venue layout Excel export (placeholder)...');
    const venueLayoutExcelResponse = await axios.post(`${API_BASE_URL}/exports/venue-layout`, {
      eventId: TEST_EVENT_ID,
      format: 'excel'
    }, {
      responseType: 'arraybuffer'
    });

    if (venueLayoutExcelResponse.status === 200) {
      const filename = 'test-venue-layout.xlsx';
      fs.writeFileSync(filename, venueLayoutExcelResponse.data);
      console.log(`✅ Venue layout Excel exported successfully: ${filename} (placeholder)`);
    }
    console.log();

    // Test 6: Error handling - invalid format
    console.log('6. Testing error handling - invalid format...');
    try {
      await axios.post(`${API_BASE_URL}/exports/seating-chart`, {
        eventId: TEST_EVENT_ID,
        format: 'xml'
      });
      console.log('❌ Should have failed with invalid format');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid format error handled correctly');
        console.log(`   - Error: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error response');
      }
    }
    console.log();

    // Test 7: Error handling - missing eventId
    console.log('7. Testing error handling - missing eventId...');
    try {
      await axios.post(`${API_BASE_URL}/exports/guest-list`, {
        format: 'csv'
      });
      console.log('❌ Should have failed with missing eventId');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Missing eventId error handled correctly');
        console.log(`   - Error: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error response');
      }
    }
    console.log();

    // Test 8: Test with different export options
    console.log('8. Testing seating chart with minimal options...');
    const minimalOptionsResponse = await axios.post(`${API_BASE_URL}/exports/seating-chart`, {
      eventId: TEST_EVENT_ID,
      format: 'csv',
      options: {
        includeVenueLayout: false,
        includeGuestDetails: false,
        includeTableAssignments: true,
        printOptimized: false
      }
    }, {
      responseType: 'arraybuffer'
    });

    if (minimalOptionsResponse.status === 200) {
      const filename = 'test-seating-chart-minimal.csv';
      fs.writeFileSync(filename, minimalOptionsResponse.data);
      console.log(`✅ Seating chart with minimal options exported: ${filename}`);
    }
    console.log();

    console.log('🎉 All export functionality tests completed successfully!');
    console.log('\nGenerated test files:');
    console.log('- test-seating-chart.csv');
    console.log('- test-guest-list.csv');
    console.log('- test-seating-chart.pdf (placeholder)');
    console.log('- test-venue-layout.xlsx (placeholder)');
    console.log('- test-seating-chart-minimal.csv');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Helper function to check if server is running
async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Checking if server is running...');
  const isServerRunning = await checkServerHealth();
  
  if (!isServerRunning) {
    console.error('❌ Server is not running. Please start the backend server first:');
    console.error('   cd rsvp-backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await testExportFunctionality();
}

main();