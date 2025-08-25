const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const eventId = 'demo-event-1';

async function testCapacityValidation() {
    try {
        console.log('🔍 Testing capacity validation with additional guests...\n');
        
        // Get guests and tables
        const guestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
        const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${eventId}`);
        
        const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
        const tables = tablesResponse.data;
        
        console.log('📊 Current state:');
        console.log(`Total guests: ${guests.length}`);
        console.log(`Accepted guests: ${guests.filter(g => g.rsvpStatus === 'accepted').length}`);
        console.log(`Tables: ${tables.length}\n`);
        
        // Show table capacity details
        console.log('📋 Table capacity analysis:');
        for (const table of tables) {
            const assignedGuests = table.assignedGuests || [];
            let seatsUsed = 0;
            let guestDetails = [];
            
            for (const guestId of assignedGuests) {
                const guest = guests.find(g => g.id === guestId);
                if (guest) {
                    const guestSeats = 1 + (guest.additionalGuestCount || 0);
                    seatsUsed += guestSeats;
                    guestDetails.push(`${guest.name} (${guestSeats} seats)`);
                }
            }
            
            const available = table.capacity - seatsUsed;
            const status = available > 0 ? '✅' : '❌';
            
            console.log(`${status} ${table.name}: ${seatsUsed}/${table.capacity} seats used, ${available} available`);
            if (guestDetails.length > 0) {
                console.log(`   Guests: ${guestDetails.join(', ')}`);
            }
        }
        
        // Test manual assignment with capacity validation
        console.log('\n🧪 Testing manual assignment with capacity validation:');
        
        // Find an unassigned guest
        const unassignedGuests = guests.filter(g => 
            g.rsvpStatus === 'accepted' && !g.tableAssignment
        );
        
        if (unassignedGuests.length > 0) {
            const testGuest = unassignedGuests[0];
            const seatsNeeded = 1 + (testGuest.additionalGuestCount || 0);
            
            console.log(`\nTesting guest: ${testGuest.name} (needs ${seatsNeeded} seats)`);
            
            // Find a table with enough capacity
            let suitableTable = null;
            for (const table of tables) {
                const assignedGuests = table.assignedGuests || [];
                let seatsUsed = 0;
                
                for (const guestId of assignedGuests) {
                    const guest = guests.find(g => g.id === guestId);
                    if (guest) {
                        seatsUsed += 1 + (guest.additionalGuestCount || 0);
                    }
                }
                
                const available = table.capacity - seatsUsed;
                if (available >= seatsNeeded) {
                    suitableTable = table;
                    break;
                }
            }
            
            if (suitableTable) {
                console.log(`Found suitable table: ${suitableTable.name}`);
                
                try {
                    const assignResponse = await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                        tableId: suitableTable.id
                    });
                    
                    console.log('✅ Assignment successful!');
                    console.log('Response:', assignResponse.data);
                } catch (error) {
                    console.log('❌ Assignment failed:');
                    console.log('Status:', error.response?.status);
                    console.log('Error:', error.response?.data);
                }
            } else {
                console.log('❌ No suitable table found with enough capacity');
            }
        } else {
            console.log('ℹ️  No unassigned guests available for testing');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCapacityValidation();