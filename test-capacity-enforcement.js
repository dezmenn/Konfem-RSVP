const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const eventId = 'demo-event-1';

async function testCapacityEnforcement() {
    try {
        console.log('🔍 Testing capacity enforcement...\n');
        
        // Get guests and tables
        const guestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
        const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${eventId}`);
        
        const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
        const tables = tablesResponse.data;
        
        // Find a full table
        let fullTable = null;
        for (const table of tables) {
            const assignedGuests = table.assignedGuests || [];
            let seatsUsed = 0;
            
            for (const guestId of assignedGuests) {
                const guest = guests.find(g => g.id === guestId);
                if (guest) {
                    seatsUsed += 1 + (guest.additionalGuestCount || 0);
                }
            }
            
            if (seatsUsed >= table.capacity) {
                fullTable = table;
                console.log(`Found full table: ${table.name} (${seatsUsed}/${table.capacity} seats used)`);
                break;
            }
        }
        
        if (!fullTable) {
            console.log('❌ No full tables found to test capacity enforcement');
            return;
        }
        
        // Create a test guest to try to assign to the full table
        console.log('\n🧪 Creating test guest...');
        const testGuestData = {
            name: 'Test Guest',
            phoneNumber: '+1234567999',
            dietaryRestrictions: [],
            additionalGuestCount: 1, // This guest needs 2 seats
            relationshipType: 'Friend',
            brideOrGroomSide: 'bride',
            rsvpStatus: 'accepted',
            specialRequests: '',
            eventId: eventId
        };
        
        const createResponse = await axios.post(`${BASE_URL}/guests`, testGuestData);
        const testGuest = createResponse.data.success ? createResponse.data.data : createResponse.data;
        console.log(`✓ Created test guest: ${testGuest.name} (needs 2 seats)`);
        
        // Try to assign the test guest to the full table
        console.log(`\n🧪 Attempting to assign test guest to full table: ${fullTable.name}`);
        
        try {
            await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                tableId: fullTable.id
            });
            
            console.log('❌ ERROR: Assignment should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ SUCCESS: Assignment correctly rejected due to capacity limits');
                console.log('Error message:', error.response.data.error || error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }
        
        // Clean up: delete the test guest
        console.log('\n🧹 Cleaning up test guest...');
        await axios.delete(`${BASE_URL}/guests/${testGuest.id}`);
        console.log('✓ Test guest deleted');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCapacityEnforcement();