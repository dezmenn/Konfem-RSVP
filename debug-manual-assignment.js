const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const eventId = 'demo-event-1';

async function debugManualAssignment() {
    try {
        console.log('🔍 Debugging manual assignment...');
        
        // Get guests and tables
        const guestsResponse = await axios.get(`${BASE_URL}/guests/${eventId}`);
        const tablesResponse = await axios.get(`${BASE_URL}/tables/events/${eventId}`);
        
        console.log('📊 Available data:');
        console.log(`Guests: ${guestsResponse.data.data.length}`);
        console.log(`Tables: ${tablesResponse.data.length}`);
        
        if (guestsResponse.data.data.length > 0 && tablesResponse.data.length > 0) {
            const testGuest = guestsResponse.data.data[0];
            const testTable = tablesResponse.data[0];
            
            console.log(`\n🧪 Testing assignment:`);
            console.log(`Guest: ${testGuest.name} (ID: ${testGuest.id})`);
            console.log(`Table: ${testTable.name} (ID: ${testTable.id})`);
            
            try {
                const assignResponse = await axios.put(`${BASE_URL}/guests/${testGuest.id}/table`, {
                    tableId: testTable.id
                });
                
                console.log('✅ Assignment successful:', assignResponse.data);
            } catch (error) {
                console.log('❌ Assignment failed:');
                console.log('Status:', error.response?.status);
                console.log('Error:', error.response?.data);
                console.log('Full error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugManualAssignment();