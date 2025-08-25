const axios = require('axios');

async function testSimpleRoute() {
  console.log('Testing simple invitation route...\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Test the simple test route
    console.log('Testing POST /api/invitations/test...');
    const testResponse = await axios.post(`${baseURL}/api/invitations/test`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Test route response:', testResponse.data);
    
  } catch (error) {
    console.error('❌ Test route failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 Backend server is not running!');
    } else if (error.response && error.response.status === 404) {
      console.error('\n🚨 Route not found - invitation routes may not be properly loaded!');
      console.error('The server may need to be restarted to pick up the module changes.');
    }
  }
}

testSimpleRoute();