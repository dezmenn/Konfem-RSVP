const fetch = require('node-fetch');

async function testExportFormats() {
  const baseUrl = 'http://localhost:5000';
  const testEventId = 'demo-event-1';

  console.log('Testing Export Functionality with XLSX Format...\n');

  try {
    // Test 1: Check available formats
    console.log('1. Testing available formats endpoint...');
    const formatsResponse = await fetch(`${baseUrl}/api/exports/formats`);
    const formats = await formatsResponse.json();
    
    console.log('Available formats:');
    console.log('- Seating Chart:', formats.seatingChart.formats);
    console.log('- Guest List:', formats.guestList.formats);
    console.log('- Venue Layout:', formats.venueLayout.formats);
    
    // Verify xlsx is included
    if (formats.seatingChart.formats.includes('xlsx')) {
      console.log('✅ XLSX format is available for seating chart');
    } else {
      console.log('❌ XLSX format is missing for seating chart');
    }

    // Test 2: Export seating chart as XLSX
    console.log('\n2. Testing seating chart export as XLSX...');
    const seatingChartResponse = await fetch(`${baseUrl}/api/exports/seating-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'xlsx',
        options: {
          includeVenueLayout: true,
          includeGuestDetails: true,
          includeTableAssignments: true,
          printOptimized: false
        }
      })
    });

    if (seatingChartResponse.ok) {
      const contentType = seatingChartResponse.headers.get('content-type');
      const contentDisposition = seatingChartResponse.headers.get('content-disposition');
      
      console.log('✅ Seating chart XLSX export successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);
      
      if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        console.log('✅ Correct XLSX content type');
      } else {
        console.log('❌ Incorrect content type for XLSX');
      }
    } else {
      const error = await seatingChartResponse.text();
      console.log('❌ Seating chart XLSX export failed:', error);
    }

    // Test 3: Export guest list as XLSX
    console.log('\n3. Testing guest list export as XLSX...');
    const guestListResponse = await fetch(`${baseUrl}/api/exports/guest-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'xlsx'
      })
    });

    if (guestListResponse.ok) {
      const contentType = guestListResponse.headers.get('content-type');
      const contentDisposition = guestListResponse.headers.get('content-disposition');
      
      console.log('✅ Guest list XLSX export successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);
    } else {
      const error = await guestListResponse.text();
      console.log('❌ Guest list XLSX export failed:', error);
    }

    // Test 4: Export venue layout as XLSX
    console.log('\n4. Testing venue layout export as XLSX...');
    const venueLayoutResponse = await fetch(`${baseUrl}/api/exports/venue-layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'xlsx'
      })
    });

    if (venueLayoutResponse.ok) {
      const contentType = venueLayoutResponse.headers.get('content-type');
      const contentDisposition = venueLayoutResponse.headers.get('content-disposition');
      
      console.log('✅ Venue layout XLSX export successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);
    } else {
      const error = await venueLayoutResponse.text();
      console.log('❌ Venue layout XLSX export failed:', error);
    }

    // Test 5: Test PDF export (should still work)
    console.log('\n5. Testing PDF export (should still work)...');
    const pdfResponse = await fetch(`${baseUrl}/api/exports/seating-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'pdf',
        options: {
          includeVenueLayout: true,
          includeGuestDetails: true,
          includeTableAssignments: true,
          printOptimized: false
        }
      })
    });

    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      const contentDisposition = pdfResponse.headers.get('content-disposition');
      
      console.log('✅ PDF export successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);
      
      if (contentType === 'application/pdf') {
        console.log('✅ Correct PDF content type');
      } else {
        console.log('❌ Incorrect content type for PDF');
      }
    } else {
      const error = await pdfResponse.text();
      console.log('❌ PDF export failed:', error);
    }

    // Test 6: Test old 'excel' format should fail
    console.log('\n6. Testing old "excel" format (should fail)...');
    const oldFormatResponse = await fetch(`${baseUrl}/api/exports/seating-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'excel'
      })
    });

    if (!oldFormatResponse.ok) {
      const error = await oldFormatResponse.json();
      console.log('✅ Old "excel" format correctly rejected:', error.error);
    } else {
      console.log('❌ Old "excel" format should have been rejected');
    }

    console.log('\n🎉 Export format testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\nMake sure the backend server is running on http://localhost:5000');
  }
}

// Run the test
testExportFormats();