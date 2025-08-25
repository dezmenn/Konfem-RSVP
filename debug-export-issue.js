const fetch = require('node-fetch');
const fs = require('fs');

async function debugExportIssue() {
  console.log('🔍 Debugging Export Issue...\n');

  const baseUrl = 'http://localhost:5000';
  const testEventId = 'demo-event-1';

  try {
    // Test 1: Check if server is running
    console.log('1. Checking if server is running...');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ Server is running');
      } else {
        console.log('❌ Server health check failed');
        return;
      }
    } catch (error) {
      console.log('❌ Server is not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
      return;
    }

    // Test 2: Check if we can access tables directly
    console.log('\n2. Testing direct table access...');
    try {
      const tablesResponse = await fetch(`${baseUrl}/api/tables/event/${testEventId}`);
      if (tablesResponse.ok) {
        const tables = await tablesResponse.json();
        console.log(`✅ Found ${tables.length} tables via API:`);
        tables.forEach((table, index) => {
          const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
          console.log(`   ${index + 1}. ${table.name} (${assignedCount}/${table.capacity} guests)`);
        });
      } else {
        const error = await tablesResponse.text();
        console.log('❌ Failed to fetch tables:', error);
      }
    } catch (error) {
      console.log('❌ Error fetching tables:', error.message);
    }

    // Test 3: Check if we can access guests directly
    console.log('\n3. Testing direct guest access...');
    try {
      const guestsResponse = await fetch(`${baseUrl}/api/guests/event/${testEventId}`);
      if (guestsResponse.ok) {
        const guests = await guestsResponse.json();
        console.log(`✅ Found ${guests.length} guests via API`);
        
        // Show first few guests
        guests.slice(0, 3).forEach((guest, index) => {
          console.log(`   ${index + 1}. ${guest.name} (RSVP: ${guest.rsvpStatus}, +${guest.additionalGuestCount})`);
        });
      } else {
        const error = await guestsResponse.text();
        console.log('❌ Failed to fetch guests:', error);
      }
    } catch (error) {
      console.log('❌ Error fetching guests:', error.message);
    }

    // Test 4: Check venue elements
    console.log('\n4. Testing venue elements access...');
    try {
      const venueResponse = await fetch(`${baseUrl}/api/venue-layout/event/${testEventId}/elements`);
      if (venueResponse.ok) {
        const venueElements = await venueResponse.json();
        console.log(`✅ Found ${venueElements.length} venue elements via API`);
        venueElements.forEach((element, index) => {
          console.log(`   ${index + 1}. ${element.name} (${element.type})`);
        });
      } else {
        const error = await venueResponse.text();
        console.log('❌ Failed to fetch venue elements:', error);
      }
    } catch (error) {
      console.log('❌ Error fetching venue elements:', error.message);
    }

    // Test 5: Test export formats endpoint
    console.log('\n5. Testing export formats...');
    try {
      const formatsResponse = await fetch(`${baseUrl}/api/exports/formats`);
      if (formatsResponse.ok) {
        const formats = await formatsResponse.json();
        console.log('✅ Export formats available:');
        console.log(`   Seating Chart: ${formats.seatingChart.formats.join(', ')}`);
        console.log(`   Guest List: ${formats.guestList.formats.join(', ')}`);
        console.log(`   Venue Layout: ${formats.venueLayout.formats.join(', ')}`);
      } else {
        const error = await formatsResponse.text();
        console.log('❌ Failed to get export formats:', error);
      }
    } catch (error) {
      console.log('❌ Error getting export formats:', error.message);
    }

    // Test 6: Test PDF export with detailed error handling
    console.log('\n6. Testing PDF export with detailed logging...');
    try {
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

      console.log(`   Response status: ${pdfResponse.status} ${pdfResponse.statusText}`);
      console.log(`   Content-Type: ${pdfResponse.headers.get('content-type')}`);
      console.log(`   Content-Disposition: ${pdfResponse.headers.get('content-disposition')}`);

      if (pdfResponse.ok) {
        const buffer = await pdfResponse.buffer();
        const filename = `debug-seating-chart-${Date.now()}.pdf`;
        fs.writeFileSync(filename, buffer);
        
        console.log(`✅ PDF export successful: ${filename}`);
        console.log(`   File size: ${buffer.length} bytes`);
        
        if (buffer.length > 10000) {
          console.log('✅ PDF file size suggests it contains actual content');
        } else {
          console.log('⚠️  PDF file is quite small, might be mostly empty');
        }
        
        // Try to read the PDF content as text to see if it contains "No tables"
        const pdfText = buffer.toString('utf8');
        if (pdfText.includes('No tables')) {
          console.log('❌ PDF contains "No tables" message');
        } else {
          console.log('✅ PDF does not contain "No tables" message');
        }
        
      } else {
        const errorText = await pdfResponse.text();
        console.log('❌ PDF export failed:');
        console.log(errorText);
      }
    } catch (error) {
      console.log('❌ Error during PDF export:', error.message);
    }

    // Test 7: Test XLSX export
    console.log('\n7. Testing XLSX export...');
    try {
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
        const buffer = await xlsxResponse.buffer();
        const filename = `debug-seating-chart-${Date.now()}.xlsx`;
        fs.writeFileSync(filename, buffer);
        
        console.log(`✅ XLSX export successful: ${filename}`);
        console.log(`   File size: ${buffer.length} bytes`);
        
        // Try to read the XLSX file to verify it contains data
        try {
          const XLSX = require('xlsx');
          const workbook = XLSX.readFile(filename);
          const sheetNames = workbook.SheetNames;
          console.log(`✅ XLSX file is valid, sheets: ${sheetNames.join(', ')}`);
          
          // Check if Table Assignments sheet has data
          if (sheetNames.includes('Table Assignments')) {
            const tableSheet = workbook.Sheets['Table Assignments'];
            const tableData = XLSX.utils.sheet_to_json(tableSheet, { header: 1 });
            console.log(`   Table Assignments sheet has ${tableData.length} rows`);
            
            if (tableData.length > 1) {
              console.log('✅ XLSX contains table assignment data');
            } else {
              console.log('❌ XLSX Table Assignments sheet is empty');
            }
          }
        } catch (error) {
          console.log('❌ XLSX file validation failed:', error.message);
        }
      } else {
        const errorText = await xlsxResponse.text();
        console.log('❌ XLSX export failed:', errorText);
      }
    } catch (error) {
      console.log('❌ Error during XLSX export:', error.message);
    }

    // Test 8: Test CSV export
    console.log('\n8. Testing CSV export...');
    try {
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
        const csvContent = await csvResponse.text();
        const filename = `debug-seating-chart-${Date.now()}.csv`;
        fs.writeFileSync(filename, csvContent);
        
        console.log(`✅ CSV export successful: ${filename}`);
        console.log(`   File size: ${csvContent.length} bytes`);
        
        // Check if CSV contains table data
        const lines = csvContent.split('\n');
        const dataLines = lines.filter(line => line.trim() && !line.startsWith('Statistics'));
        
        console.log(`   CSV has ${lines.length} total lines, ${dataLines.length} data lines`);
        
        if (dataLines.length > 1) {
          console.log('✅ CSV contains table data');
          console.log('   First few lines:');
          dataLines.slice(0, 3).forEach((line, index) => {
            console.log(`      ${index + 1}. ${line.substring(0, 80)}...`);
          });
        } else {
          console.log('❌ CSV appears to be empty or contain only headers');
        }
      } else {
        const errorText = await csvResponse.text();
        console.log('❌ CSV export failed:', errorText);
      }
    } catch (error) {
      console.log('❌ Error during CSV export:', error.message);
    }

    console.log('\n🔍 Debug Summary:');
    console.log('If the exports are still showing empty data, the issue is likely:');
    console.log('1. Mock services not being used (check server logs for "Demo data loaded")');
    console.log('2. Export routes not using the correct mock services');
    console.log('3. DemoDataService not returning the expected data structure');
    console.log('4. Event ID mismatch between demo data and export request');
    
    console.log('\n📋 Next steps:');
    console.log('1. Check server console logs for "Demo data loaded successfully"');
    console.log('2. Verify that SKIP_DB_SETUP=true is set in .env file');
    console.log('3. Restart the server to ensure demo mode is active');
    console.log('4. Check the generated files to see actual content');

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugExportIssue();