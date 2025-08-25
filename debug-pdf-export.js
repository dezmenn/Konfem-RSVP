const fetch = require('node-fetch');

async function debugPDFExport() {
  const baseUrl = 'http://localhost:5000';
  const testEventId = 'demo-event-1';

  console.log('Debugging PDF Export Issue...\n');

  try {
    // First, let's check what tables exist
    console.log('1. Checking available tables...');
    const tablesResponse = await fetch(`${baseUrl}/api/tables/event/${testEventId}`);
    
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name} (capacity: ${table.capacity}, position: ${table.position.x}, ${table.position.y})`);
        if (table.assignedGuests && table.assignedGuests.length > 0) {
          console.log(`      Assigned guests: ${table.assignedGuests.length}`);
        }
      });
    } else {
      console.log('❌ Failed to fetch tables:', await tablesResponse.text());
      return;
    }

    // Check guests
    console.log('\n2. Checking available guests...');
    const guestsResponse = await fetch(`${baseUrl}/api/guests/event/${testEventId}`);
    
    if (guestsResponse.ok) {
      const guests = await guestsResponse.json();
      console.log(`✅ Found ${guests.length} guests:`);
      guests.slice(0, 5).forEach((guest, index) => {
        console.log(`   ${index + 1}. ${guest.name} (RSVP: ${guest.rsvpStatus}, additional: ${guest.additionalGuestCount})`);
      });
      if (guests.length > 5) {
        console.log(`   ... and ${guests.length - 5} more guests`);
      }
    } else {
      console.log('❌ Failed to fetch guests:', await guestsResponse.text());
    }

    // Check venue elements
    console.log('\n3. Checking venue elements...');
    const venueResponse = await fetch(`${baseUrl}/api/venue-layout/event/${testEventId}/elements`);
    
    if (venueResponse.ok) {
      const venueElements = await venueResponse.json();
      console.log(`✅ Found ${venueElements.length} venue elements`);
      venueElements.forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.name || element.type} (${element.type})`);
      });
    } else {
      console.log('❌ Failed to fetch venue elements:', await venueResponse.text());
    }

    // Now test the PDF export
    console.log('\n4. Testing PDF export...');
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
      
      // Save the PDF to check its contents
      const buffer = await pdfResponse.buffer();
      const fs = require('fs');
      const filename = `debug-export-${Date.now()}.pdf`;
      fs.writeFileSync(filename, buffer);
      console.log(`✅ PDF saved as: ${filename}`);
      console.log(`File size: ${buffer.length} bytes`);
      
      if (buffer.length < 1000) {
        console.log('⚠️  PDF file seems very small, might be empty or have issues');
      }
    } else {
      const error = await pdfResponse.text();
      console.log('❌ PDF export failed:', error);
    }

    // Test venue layout export specifically
    console.log('\n5. Testing venue layout PDF export...');
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
      const buffer = await venueLayoutResponse.buffer();
      const fs = require('fs');
      const filename = `debug-venue-layout-${Date.now()}.pdf`;
      fs.writeFileSync(filename, buffer);
      console.log(`✅ Venue layout PDF saved as: ${filename}`);
      console.log(`File size: ${buffer.length} bytes`);
    } else {
      const error = await venueLayoutResponse.text();
      console.log('❌ Venue layout PDF export failed:', error);
    }

    console.log('\n🔍 Debug completed! Check the generated PDF files to see the actual content.');

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.log('\nMake sure the backend server is running on http://localhost:5000');
  }
}

// Run the debug
debugPDFExport();