const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const eventId = 'demo-event-1';

async function debugGuestReassignment() {
    try {
        console.log('🔍 Debugging guest reassignment...\n');
        
        // Get current state
        const guestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
        const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${eventId}`);
        
        const guests = guestsResponse.data.success ? guestsResponse.data.data : guestsResponse.data;
        const tables = tablesResponse.data;
        
        console.log('📊 Current state:');
        console.log(`Total guests: ${guests.length}`);
        console.log(`Accepted guests: ${guests.filter(g => g.rsvpStatus === 'accepted').length}`);
        console.log(`Unassigned guests: ${guests.filter(g => g.rsvpStatus === 'accepted' && !g.tableAssignment).length}`);
        console.log(`Tables: ${tables.length}\n`);
        
        // Find an unassigned guest for testing
        const unassignedGuests = guests.filter(g => 
            g.rsvpStatus === 'accepted' && !g.tableAssignment
        );
        
        if (unassignedGuests.length === 0) {
            console.log('ℹ️  No unassigned guests found. Creating one by unassigning an existing guest...');
            
            // Find an assigned guest to unassign
            const assignedGuests = guests.filter(g => g.rsvpStatus === 'accepted' && g.tableAssignment);
            if (assignedGuests.length > 0) {
                const guestToUnassign = assignedGuests[0];
                console.log(`Unassigning ${guestToUnassign.name} from their current table...`);
                
                try {
                    await axios.delete(`${BASE_URL}/guests/${guestToUnassign.id}/table`);
                    console.log('✓ Guest unassigned successfully');
                    
                    // Refresh guest data
                    const updatedGuestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
                    const updatedGuests = updatedGuestsResponse.data.success ? updatedGuestsResponse.data.data : updatedGuestsResponse.data;
                    const nowUnassigned = updatedGuests.filter(g => g.rsvpStatus === 'accepted' && !g.tableAssignment);
                    
                    if (nowUnassigned.length > 0) {
                        console.log(`✓ Now have ${nowUnassigned.length} unassigned guests for testing\n`);
                    }
                } catch (error) {
                    console.log('❌ Failed to unassign guest:', error.response?.data || error.message);
                    return;
                }
            } else {
                console.log('❌ No assigned guests found to unassign');
                return;
            }
        }
        
        // Get fresh data after potential unassignment
        const freshGuestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
        const freshGuests = freshGuestsResponse.data.success ? freshGuestsResponse.data.data : freshGuestsResponse.data;
        const testUnassignedGuests = freshGuests.filter(g => 
            g.rsvpStatus === 'accepted' && !g.tableAssignment
        );
        
        if (testUnassignedGuests.length === 0) {
            console.log('❌ Still no unassigned guests available for testing');
            return;
        }
        
        const testGuest = testUnassignedGuests[0];
        const sourceTable = tables[0];
        const targetTable = tables[1];
        
        console.log('🧪 Testing guest reassignment:');
        console.log(`Guest: ${testGuest.name} (needs ${1 + (testGuest.additionalGuestCount || 0)} seats)`);
        console.log(`Source table: ${sourceTable.name} (capacity: ${sourceTable.capacity})`);
        console.log(`Target table: ${targetTable.name} (capacity: ${targetTable.capacity})`);
        
        // Check capacity of both tables
        const checkTableCapacity = (table) => {
            const assignedGuests = table.assignedGuests || [];
            let seatsUsed = 0;
            let guestDetails = [];
            
            for (const guestId of assignedGuests) {
                const guest = freshGuests.find(g => g.id === guestId);
                if (guest) {
                    const guestSeats = 1 + (guest.additionalGuestCount || 0);
                    seatsUsed += guestSeats;
                    guestDetails.push(`${guest.name} (${guestSeats} seats)`);
                }
            }
            
            return { seatsUsed, available: table.capacity - seatsUsed, guestDetails };
        };
        
        const sourceCapacity = checkTableCapacity(sourceTable);
        const targetCapacity = checkTableCapacity(targetTable);
        
        console.log(`\nSource table capacity: ${sourceCapacity.seatsUsed}/${sourceTable.capacity} (${sourceCapacity.available} available)`);
        if (sourceCapacity.guestDetails.length > 0) {
            console.log(`   Current guests: ${sourceCapacity.guestDetails.join(', ')}`);
        }
        
        console.log(`Target table capacity: ${targetCapacity.seatsUsed}/${targetTable.capacity} (${targetCapacity.available} available)`);
        if (targetCapacity.guestDetails.length > 0) {
            console.log(`   Current guests: ${targetCapacity.guestDetails.join(', ')}`);
        }
        
        const seatsNeeded = 1 + (testGuest.additionalGuestCount || 0);
        
        // Step 1: Assign to source table
        console.log(`\n📝 Step 1: Assigning ${testGuest.name} to ${sourceTable.name}...`);
        
        if (sourceCapacity.available >= seatsNeeded) {
            try {
                const assignResponse = await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                    tableId: sourceTable.id
                });
                console.log('✅ Step 1 successful - assigned to source table');
            } catch (error) {
                console.log('❌ Step 1 failed:');
                console.log('Status:', error.response?.status);
                console.log('Error:', error.response?.data);
                return;
            }
        } else {
            console.log(`❌ Source table doesn't have enough capacity (needs ${seatsNeeded}, has ${sourceCapacity.available})`);
            return;
        }
        
        // Step 2: Reassign to target table
        console.log(`\n📝 Step 2: Reassigning ${testGuest.name} to ${targetTable.name}...`);
        
        if (targetCapacity.available >= seatsNeeded) {
            try {
                const reassignResponse = await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                    tableId: targetTable.id
                });
                console.log('✅ Step 2 successful - reassigned to target table');
                console.log('Final result:', reassignResponse.data);
            } catch (error) {
                console.log('❌ Step 2 failed:');
                console.log('Status:', error.response?.status);
                console.log('Error:', error.response?.data);
                console.log('Full error:', error.message);
            }
        } else {
            console.log(`❌ Target table doesn't have enough capacity (needs ${seatsNeeded}, has ${targetCapacity.available})`);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugGuestReassignment();