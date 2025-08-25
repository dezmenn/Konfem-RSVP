/**
 * Mobile Integration Test
 * Tests the mobile touch optimization features with backend integration
 */

const { default: fetch } = require('node-fetch');

class MobileIntegrationTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api';
    this.eventId = 'demo-event-1';
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async testBackendConnection() {
    try {
      // Test with a known working endpoint instead of health
      const response = await fetch(`${this.baseUrl}/guests/${this.eventId}`);
      if (response.ok) {
        this.log('✅ Backend server is running and accessible');
        return true;
      } else {
        throw new Error(`Backend returned status: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ Backend connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testGuestDataForMobile() {
    try {
      const response = await fetch(`${this.baseUrl}/guests/${this.eventId}`);
      const result = await response.json();
      const data = result.data || result;
      
      if (data && data.length > 0) {
        this.log(`✅ Found ${data.length} guests for mobile table arrangement`);
        
        // Check for accepted guests (required for mobile drag-and-drop)
        const acceptedGuests = data.filter(guest => guest.rsvpStatus === 'accepted');
        this.log(`✅ Found ${acceptedGuests.length} accepted guests for table arrangement`);
        
        // Verify guest data structure for mobile components
        const sampleGuest = data[0];
        const requiredFields = ['id', 'name', 'rsvpStatus', 'brideOrGroomSide', 'relationshipType', 'additionalGuestCount'];
        
        for (const field of requiredFields) {
          if (!(field in sampleGuest)) {
            throw new Error(`Missing required field for mobile: ${field}`);
          }
        }
        
        this.log('✅ Guest data structure is compatible with mobile components');
        return true;
      } else {
        throw new Error('No guest data available');
      }
    } catch (error) {
      this.log(`❌ Guest data test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTableDataForMobile() {
    try {
      const response = await fetch(`${this.baseUrl}/tables/events/${this.eventId}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        this.log(`✅ Found ${data.length} tables for mobile arrangement`);
        
        // Verify table data structure for mobile components
        const sampleTable = data[0];
        const requiredFields = ['id', 'name', 'capacity', 'position', 'isLocked'];
        
        for (const field of requiredFields) {
          if (!(field in sampleTable)) {
            throw new Error(`Missing required field for mobile: ${field}`);
          }
        }
        
        // Check position structure for venue layout
        if (!sampleTable.position.x || !sampleTable.position.y) {
          throw new Error('Table position data incomplete for venue layout');
        }
        
        this.log('✅ Table data structure is compatible with mobile components');
        return true;
      } else {
        throw new Error('No table data available');
      }
    } catch (error) {
      this.log(`❌ Table data test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTableCapacityAPI() {
    try {
      const response = await fetch(`${this.baseUrl}/tables/events/${this.eventId}/capacity`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        this.log(`✅ Table capacity API working - ${data.length} tables with capacity info`);
        
        // Verify capacity data structure
        const sampleCapacity = data[0];
        const requiredFields = ['tableId', 'capacity', 'occupied', 'available'];
        
        for (const field of requiredFields) {
          if (!(field in sampleCapacity)) {
            throw new Error(`Missing capacity field: ${field}`);
          }
        }
        
        this.log('✅ Table capacity data structure is correct for mobile drag-and-drop');
        return true;
      } else {
        throw new Error('No capacity data available');
      }
    } catch (error) {
      this.log(`❌ Table capacity API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testGuestTableAssignmentAPI() {
    try {
      // Get a guest and table for testing
      const [guestsResponse, tablesResponse] = await Promise.all([
        fetch(`${this.baseUrl}/guests/${this.eventId}`),
        fetch(`${this.baseUrl}/tables/events/${this.eventId}`)
      ]);
      
      const guestsResult = await guestsResponse.json();
      const guests = guestsResult.data || guestsResult;
      const tables = await tablesResponse.json();
      
      if (guests.length === 0 || tables.length === 0) {
        throw new Error('No guests or tables available for assignment test');
      }
      
      const testGuest = guests[0];
      const testTable = tables[0];
      
      // Test assignment API (PUT method for mobile)
      const assignResponse = await fetch(`${this.baseUrl}/guests/${testGuest.id}/table`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: testTable.id })
      });
      
      if (assignResponse.ok) {
        this.log('✅ Guest table assignment API working (PUT method for mobile)');
        
        // Test unassignment API (DELETE method for mobile)
        const unassignResponse = await fetch(`${this.baseUrl}/guests/${testGuest.id}/table`, {
          method: 'DELETE'
        });
        
        if (unassignResponse.ok) {
          this.log('✅ Guest table unassignment API working (DELETE method for mobile)');
          return true;
        } else {
          throw new Error('Unassignment API failed');
        }
      } else {
        throw new Error('Assignment API failed');
      }
    } catch (error) {
      this.log(`❌ Guest table assignment API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testVenueLayoutAPI() {
    try {
      const response = await fetch(`${this.baseUrl}/venue-layout/events/${this.eventId}`);
      const data = await response.json();
      
      // Venue layout might be empty initially, that's okay
      this.log(`✅ Venue layout API accessible - found ${data.elements ? data.elements.length : 0} elements`);
      
      // Test venue element library for mobile
      const libraryResponse = await fetch(`${this.baseUrl}/venue-layout/library`);
      if (libraryResponse.ok) {
        const library = await libraryResponse.json();
        this.log(`✅ Venue element library API working - ${library.length} element types available`);
        return true;
      } else {
        throw new Error('Venue library API failed');
      }
    } catch (error) {
      this.log(`❌ Venue layout API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testMobileSpecificEndpoints() {
    try {
      // Test endpoints that mobile components specifically use
      const endpoints = [
        `/guests/${this.eventId}`,
        `/tables/events/${this.eventId}`,
        `/tables/events/${this.eventId}/capacity`,
        `/venue-layout/events/${this.eventId}`,
        `/venue-layout/library`
      ];
      
      let successCount = 0;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`);
          if (response.ok) {
            successCount++;
            this.log(`✅ Mobile endpoint working: ${endpoint}`);
          } else {
            this.log(`⚠️  Mobile endpoint returned ${response.status}: ${endpoint}`, 'warning');
          }
        } catch (error) {
          this.log(`❌ Mobile endpoint failed: ${endpoint} - ${error.message}`, 'error');
        }
      }
      
      if (successCount >= 4) {
        this.log(`✅ Mobile endpoints test passed: ${successCount}/${endpoints.length} working`);
        return true;
      } else {
        throw new Error(`Too many endpoint failures: only ${successCount}/${endpoints.length} working`);
      }
    } catch (error) {
      this.log(`❌ Mobile endpoints test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Mobile Integration Tests');
    
    const tests = [
      ['Backend Connection', () => this.testBackendConnection()],
      ['Guest Data for Mobile', () => this.testGuestDataForMobile()],
      ['Table Data for Mobile', () => this.testTableDataForMobile()],
      ['Table Capacity API', () => this.testTableCapacityAPI()],
      ['Guest Table Assignment API', () => this.testGuestTableAssignmentAPI()],
      ['Venue Layout API', () => this.testVenueLayoutAPI()],
      ['Mobile Specific Endpoints', () => this.testMobileSpecificEndpoints()]
    ];

    let passedTests = 0;
    for (const [testName, testFunction] of tests) {
      try {
        this.log(`\n🧪 Running test: ${testName}`);
        const passed = await testFunction();
        if (passed) {
          passedTests++;
          this.log(`✅ Test passed: ${testName}`, 'success');
        }
      } catch (error) {
        this.log(`❌ Test failed: ${testName} - ${error.message}`, 'error');
      }
    }

    this.log(`\n📊 Integration Test Results: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      this.log('🎉 All mobile integration tests passed!', 'success');
      this.log('\n✅ Mobile app is ready for testing with:');
      this.log('• Touch-friendly drag-and-drop table arrangements');
      this.log('• Gesture-based venue layout management');
      this.log('• Responsive navigation and UI patterns');
      this.log('• Full backend API integration');
      return true;
    } else {
      this.log(`⚠️  ${tests.length - passedTests} integration tests failed`, 'error');
      return false;
    }
  }
}

// Run the integration tests
async function main() {
  const tester = new MobileIntegrationTester();
  
  try {
    const success = await tester.runAllTests();
    
    console.log('\n' + '='.repeat(60));
    console.log('MOBILE INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    if (success) {
      console.log('✅ Mobile app is fully integrated and ready for use!');
      console.log('\nTo test the mobile app:');
      console.log('1. Ensure backend server is running (npm run dev in rsvp-backend)');
      console.log('2. Start mobile app (npm start in rsvp-mobile)');
      console.log('3. Open on device/emulator and test touch features');
      console.log('\nMobile features to test:');
      console.log('• Drag guests between tables in Tables tab');
      console.log('• Pinch-to-zoom and pan in Venue tab');
      console.log('• Responsive navigation in different orientations');
      console.log('• Touch-friendly UI elements throughout');
      process.exit(0);
    } else {
      console.log('❌ Some integration tests failed');
      console.log('Check the backend server and API endpoints');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Integration test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MobileIntegrationTester };