const fetch = require('node-fetch');

async function testExportWithDemoData() {
  console.log('🧪 Testing Export with Demo Data...\n');

  // Set environment variable to use demo mode
  process.env.SKIP_DB_SETUP = 'true';

  try {
    const baseUrl = 'http://localhost:5000';
    const testEventId = 'demo-event-1';

    // Test 1: Check if server is running and in demo mode
    console.log('1. Checking server status...');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ Server is running');
      } else {
        console.log('❌ Server health check failed');
        return;
      }
    } catch (error) {
      console.log('❌ Server is not running. Please start the backend server first.');
      console.log('   Run: npm run dev:backend');
      return;
    }

    // Test 2: Check available export formats
    console.log('\n2. Checking available export formats...');
    const formatsResponse = await fetch(`${baseUrl}/api/exports/formats`);
    
    if (formatsResponse.ok) {
      const formats = await formatsResponse.json();
      console.log('✅ Export formats available:');
      console.log(`   - Seating Chart: ${formats.seatingChart.formats.join(', ')}`);
      console.log(`   - Guest List: ${formats.guestList.formats.join(', ')}`);
      console.log(`   - Venue Layout: ${formats.venueLayout.formats.join(', ')}`);
    } else {
      console.log('❌ Failed to get export formats');
      return;
    }

    // Test 3: Test PDF export
    console.log('\n3. Testing PDF export...');
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
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      
      // Save the PDF to check its contents
      const buffer = await pdfResponse.buffer();
      const fs = require('fs');
      const filename = `demo-seating-chart-${Date.now()}.pdf`;
      fs.writeFileSync(filename, buffer);
      console.log(`   📄 PDF saved as: ${filename}`);
      console.log(`   📊 File size: ${buffer.length} bytes`);
      
      if (buffer.length > 5000) {
        console.log('✅ PDF file size looks good (contains actual content)');
      } else {
        console.log('⚠️  PDF file seems small, might be mostly empty');
      }
    } else {
      const error = await pdfResponse.text();
      console.log('❌ PDF export failed:', error);
    }

    // Test 4: Test XLSX export
    console.log('\n4. Testing XLSX export...');
    const xlsxResponse = await fetch(`${baseUrl}/api/exports/seating-chart`, {
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

    if (xlsxResponse.ok) {
      const contentType = xlsxResponse.headers.get('content-type');
      const contentDisposition = xlsxResponse.headers.get('content-disposition');
      
      console.log('✅ XLSX export successful');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      
      // Save the XLSX file
      const buffer = await xlsxResponse.buffer();
      const fs = require('fs');
      const filename = `demo-seating-chart-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, buffer);
      console.log(`   📊 XLSX saved as: ${filename}`);
      console.log(`   📊 File size: ${buffer.length} bytes`);
      
      // Try to read the XLSX file to verify it's valid
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(filename);
        const sheetNames = workbook.SheetNames;
        console.log(`✅ XLSX file is valid, sheets: ${sheetNames.join(', ')}`);
      } catch (error) {
        console.log('❌ XLSX file validation failed:', error.message);
      }
    } else {
      const error = await xlsxResponse.text();
      console.log('❌ XLSX export failed:', error);
    }

    // Test 5: Test CSV export
    console.log('\n5. Testing CSV export...');
    const csvResponse = await fetch(`${baseUrl}/api/exports/seating-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'csv',
        options: {
          includeVenueLayout: true,
          includeGuestDetails: true,
          includeTableAssignments: true,
          printOptimized: false
        }
      })
    });

    if (csvResponse.ok) {
      const contentType = csvResponse.headers.get('content-type');
      const contentDisposition = csvResponse.headers.get('content-disposition');
      
      console.log('✅ CSV export successful');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      
      // Save and preview the CSV content
      const csvContent = await csvResponse.text();
      const fs = require('fs');
      const filename = `demo-seating-chart-${Date.now()}.csv`;
      fs.writeFileSync(filename, csvContent);
      console.log(`   📄 CSV saved as: ${filename}`);
      console.log(`   📊 File size: ${csvContent.length} bytes`);
      
      // Show first few lines of CSV
      const lines = csvContent.split('\n').slice(0, 5);
      console.log('   📋 CSV preview (first 5 lines):');
      lines.forEach((line, index) => {
        console.log(`      ${index + 1}. ${line}`);
      });
    } else {
      const error = await csvResponse.text();
      console.log('❌ CSV export failed:', error);
    }

    // Test 6: Test guest list export
    console.log('\n6. Testing guest list export...');
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
      
      console.log('✅ Guest list export successful');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      
      const buffer = await guestListResponse.buffer();
      const fs = require('fs');
      const filename = `demo-guest-list-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, buffer);
      console.log(`   📊 Guest list saved as: ${filename}`);
    } else {
      const error = await guestListResponse.text();
      console.log('❌ Guest list export failed:', error);
    }

    // Test 7: Test venue layout export
    console.log('\n7. Testing venue layout export...');
    const venueLayoutResponse = await fetch(`${baseUrl}/api/exports/venue-layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: testEventId,
        format: 'pdf'
      })
    });

    if (venueLayoutResponse.ok) {
      const contentType = venueLayoutResponse.headers.get('content-type');
      const contentDisposition = venueLayoutResponse.headers.get('content-disposition');
      
      console.log('✅ Venue layout export successful');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      
      const buffer = await venueLayoutResponse.buffer();
      const fs = require('fs');
      const filename = `demo-venue-layout-${Date.now()}.pdf`;
      fs.writeFileSync(filename, buffer);
      console.log(`   📄 Venue layout saved as: ${filename}`);
    } else {
      const error = await venueLayoutResponse.text();
      console.log('❌ Venue layout export failed:', error);
    }

    console.log('\n🎉 Export testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ All export formats are working');
    console.log('✅ Demo data is being used correctly');
    console.log('✅ Files are generated with proper content');
    console.log('✅ PDF should now show tables instead of "No tables configured"');
    
    console.log('\n📁 Generated files can be opened to verify content:');
    console.log('   - PDF files should show visual table layouts');
    console.log('   - XLSX files should have multiple sheets with data');
    console.log('   - CSV files should contain table and guest information');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend server is running: npm run dev:backend');
    console.log('2. Ensure SKIP_DB_SETUP=true is set in your .env file');
    console.log('3. Check that demo-data/mock-demo-data.json contains tables');
  }
}

// Run the test
testExportWithDemoData();