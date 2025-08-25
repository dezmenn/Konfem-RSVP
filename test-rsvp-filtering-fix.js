const axios = require('axios');

console.log('🎯 Testing RSVP Status Filtering in Auto-Arrangement...\n');

async function testRSVPFiltering() {
  try {
    const baseURL = 'http://localhost:3001';
    const eventId = 'demo-event-1';

    console.log('📊 Step 1: Analyzing guest RSVP statuses...');
    
    // Get all guests
    const guestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const guests = guestsResponse.data.success ? guestsResponse.data.data : [];
    
    const tablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const tables = tablesResponse.data || [];
    
    console.log(`  Total guests: ${guests.length}`);
    console.log(`  Total tables: ${tables.length}`);
    
    // Analyze RSVP statuses
    const rsvpStatusCounts = {};
    guests.forEach(guest => {
      const status = guest.rsvpStatus || 'no_status';
      rsvpStatusCounts[status] = (rsvpStatusCounts[status] || 0) + 1;
    });
    
    console.log('\n  RSVP Status Breakdown:');
    Object.entries(rsvpStatusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count} guests`);
    });
    
    // Identify guests by status
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');
    const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined');
    const noResponseGuests = guests.filter(g => g.rsvpStatus === 'no_response' || !g.rsvpStatus);
    
    console.log('\n  Guest Categories:');
    console.log(`    Accepted (should be arranged): ${acceptedGuests.length}`);
    console.log(`    Pending (should be ignored): ${pendingGuests.length}`);
    console.log(`    Declined (should be ignored): ${declinedGuests.length}`);
    console.log(`    No Response (should be ignored): ${noResponseGuests.length}`);
    
    // Show some examples
    if (acceptedGuests.length > 0) {
      console.log('\n  Sample accepted guests:');
      acceptedGuests.slice(0, 3).forEach(guest => {
        console.log(`    - ${guest.name} (${guest.rsvpStatus})`);
      });
    }
    
    if (pendingGuests.length > 0) {
      console.log('\n  Sample pending guests (should NOT be arranged):');
      pendingGuests.slice(0, 3).forEach(guest => {
        console.log(`    - ${guest.name} (${guest.rsvpStatus})`);
      });
    }
    
    console.log('\n🚀 Step 2: Running auto-arrangement with RSVP filtering...');
    
    const autoArrangeOptions = {
      respectRelationships: true,
      balanceBrideGroomSides: true,
      considerDietaryRestrictions: false,
      keepFamiliesTogether: true,
      maxGuestsPerTable: 8
    };
    
    const arrangeResponse = await axios.post(
      `${baseURL}/api/tables/events/${eventId}/auto-arrange`,
      autoArrangeOptions,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log(`  Auto arrangement result: ${arrangeResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Message: ${arrangeResponse.data.message}`);
    console.log(`  Guests arranged: ${arrangeResponse.data.arrangedGuests}`);
    
    if (!arrangeResponse.data.success) {
      if (arrangeResponse.data.message.includes('No guests with accepted RSVP status')) {
        console.log('  ✅ Correctly identified no accepted guests to arrange');
      } else {
        console.log('  ❌ Unexpected failure reason');
      }
      return;
    }
    
    console.log('\n🔍 Step 3: Verifying only accepted guests were arranged...');
    
    // Get fresh data after arrangement
    const finalGuestsResponse = await axios.get(`${baseURL}/api/guests/${eventId}`);
    const finalGuests = finalGuestsResponse.data.success ? finalGuestsResponse.data.data : [];
    
    const finalTablesResponse = await axios.get(`${baseURL}/api/tables/events/${eventId}`);
    const finalTables = finalTablesResponse.data || [];
    
    // Check which guests got assigned
    const arrangedGuestIds = new Set();
    finalTables.forEach(table => {
      if (table.assignedGuests) {
        table.assignedGuests.forEach(guestId => arrangedGuestIds.add(guestId));
      }
    });
    
    // Analyze arranged guests by RSVP status
    const arrangedByStatus = {
      accepted: 0,
      pending: 0,
      declined: 0,
      no_response: 0,
      no_status: 0
    };
    
    const incorrectlyArranged = [];
    
    finalGuests.forEach(guest => {
      if (arrangedGuestIds.has(guest.id)) {
        const status = guest.rsvpStatus || 'no_status';
        
        if (status === 'accepted') {
          arrangedByStatus.accepted++;
        } else {
          // This guest should NOT have been arranged
          arrangedByStatus[status] = (arrangedByStatus[status] || 0) + 1;
          incorrectlyArranged.push({
            name: guest.name,
            status: status,
            table: finalTables.find(t => t.assignedGuests && t.assignedGuests.includes(guest.id))?.name
          });
        }
      }
    });
    
    console.log('  Arranged guests by RSVP status:');
    console.log(`    Accepted: ${arrangedByStatus.accepted} (✅ correct)`);
    console.log(`    Pending: ${arrangedByStatus.pending} (${arrangedByStatus.pending > 0 ? '❌ should be 0' : '✅ correct'})`);
    console.log(`    Declined: ${arrangedByStatus.declined} (${arrangedByStatus.declined > 0 ? '❌ should be 0' : '✅ correct'})`);
    console.log(`    No Response: ${arrangedByStatus.no_response} (${arrangedByStatus.no_response > 0 ? '❌ should be 0' : '✅ correct'})`);
    console.log(`    No Status: ${arrangedByStatus.no_status} (${arrangedByStatus.no_status > 0 ? '❌ should be 0' : '✅ correct'})`);
    
    if (incorrectlyArranged.length > 0) {
      console.log('\n  ❌ Incorrectly arranged guests:');
      incorrectlyArranged.forEach(guest => {
        console.log(`    ${guest.name} (${guest.status}) assigned to ${guest.table}`);
      });
    } else {
      console.log('\n  ✅ No incorrectly arranged guests found');
    }
    
    // Verify that pending/declined guests remain unassigned
    console.log('\n🔍 Step 4: Verifying non-accepted guests remain unassigned...');
    
    const shouldRemainUnassigned = [...pendingGuests, ...declinedGuests, ...noResponseGuests];
    const incorrectlyLeftUnassigned = [];
    const correctlyLeftUnassigned = [];
    
    shouldRemainUnassigned.forEach(guest => {
      if (arrangedGuestIds.has(guest.id)) {
        incorrectlyLeftUnassigned.push(guest);
      } else {
        correctlyLeftUnassigned.push(guest);
      }
    });
    
    console.log(`  Non-accepted guests that should remain unassigned: ${shouldRemainUnassigned.length}`);
    console.log(`  Correctly left unassigned: ${correctlyLeftUnassigned.length}`);
    console.log(`  Incorrectly assigned: ${incorrectlyLeftUnassigned.length}`);
    
    if (incorrectlyLeftUnassigned.length > 0) {
      console.log('\n  ❌ Non-accepted guests that were incorrectly assigned:');
      incorrectlyLeftUnassigned.forEach(guest => {
        const table = finalTables.find(t => t.assignedGuests && t.assignedGuests.includes(guest.id));
        console.log(`    ${guest.name} (${guest.rsvpStatus}) assigned to ${table?.name}`);
      });
    }
    
    console.log('\n🎉 RSVP Filtering Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testPassed = incorrectlyArranged.length === 0 && 
                      arrangedByStatus.pending === 0 && 
                      arrangedByStatus.declined === 0 && 
                      arrangedByStatus.no_response === 0 &&
                      arrangedByStatus.no_status === 0;
    
    if (testPassed) {
      console.log('✅ RSVP FILTERING IS WORKING CORRECTLY!');
      console.log('');
      console.log('🎯 Verified Features:');
      console.log('   ✅ Only guests with "accepted" RSVP status are arranged');
      console.log('   ✅ Pending guests are left unassigned');
      console.log('   ✅ Declined guests are left unassigned');
      console.log('   ✅ No-response guests are left unassigned');
      console.log('   ✅ Algorithm respects RSVP status filtering');
      console.log('');
      console.log('📊 Results Summary:');
      console.log(`   Total guests: ${guests.length}`);
      console.log(`   Accepted guests: ${acceptedGuests.length}`);
      console.log(`   Guests arranged: ${arrangedByStatus.accepted}`);
      console.log(`   Filtering accuracy: 100%`);
      console.log('');
      console.log('🚀 Auto arrangement now only assigns tables to confirmed attendees!');
      
    } else {
      console.log('❌ RSVP FILTERING HAS ISSUES');
      console.log('');
      console.log('🔧 Issues Found:');
      if (arrangedByStatus.pending > 0) {
        console.log(`   ❌ ${arrangedByStatus.pending} pending guests were incorrectly arranged`);
      }
      if (arrangedByStatus.declined > 0) {
        console.log(`   ❌ ${arrangedByStatus.declined} declined guests were incorrectly arranged`);
      }
      if (arrangedByStatus.no_response > 0) {
        console.log(`   ❌ ${arrangedByStatus.no_response} no-response guests were incorrectly arranged`);
      }
      if (arrangedByStatus.no_status > 0) {
        console.log(`   ❌ ${arrangedByStatus.no_status} guests without status were incorrectly arranged`);
      }
      
      console.log('');
      console.log('💡 The algorithm should only process guests with rsvpStatus === "accepted"');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running. Please start it with:');
      console.log('   cd rsvp-backend && npm run dev');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run the test
testRSVPFiltering().catch(console.error);