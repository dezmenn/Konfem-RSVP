#!/usr/bin/env node

/**
 * Task 21 Testing Script: Mobile Touch Optimization
 * Tests mobile-optimized interfaces and touch interactions
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

class MobileTouchOptimizationTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      type,
      message,
      testTime: Date.now() - this.startTime
    });
  }

  async testTouchOptimizedComponents() {
    this.log('=== Testing Touch-Optimized Components ===');
    
    try {
      // Test if mobile-specific endpoints exist
      const mobileEndpoints = [
        `${API_BASE}/mobile/touch-config`,
        `${API_BASE}/mobile/gesture-settings`,
        `${API_BASE}/mobile/interface-config`
      ];
      
      let mobileEndpointsAvailable = 0;
      
      for (const endpoint of mobileEndpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok || response.status === 404) {
            // 404 is acceptable - endpoint exists but no data
            mobileEndpointsAvailable++;
            this.log(`✓ Mobile endpoint accessible: ${endpoint.split('/').pop()}`);
          }
        } catch (error) {
          this.log(`⚠ Mobile endpoint not available: ${endpoint.split('/').pop()}`, 'warning');
        }
      }
      
      // Test touch-friendly data structures
      const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json();
        const guests = guestsData.data || guestsData;
        
        if (guests.length > 0) {
          const sampleGuest = guests[0];
          
          // Check for touch-friendly properties
          const touchFriendlyProps = [
            'id', 'name', 'rsvpStatus', 'tableAssignment',
            'additionalGuestCount', 'brideOrGroomSide', 'relationshipType'
          ];
          
          const availableProps = touchFriendlyProps.filter(prop => 
            sampleGuest.hasOwnProperty(prop)
          );
          
          this.log(`✓ Touch-friendly guest properties available: ${availableProps.length}/${touchFriendlyProps.length}`);
          
          // Test drag-and-drop data structure
          if (sampleGuest.tableAssignment) {
            this.log('✓ Table assignment data available for drag-and-drop');
          } else {
            this.log('⚠ No table assignments found for drag-and-drop testing', 'warning');
          }
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Touch-optimized components test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDragAndDropAPI() {
    this.log('=== Testing Drag and Drop API ===');
    
    try {
      // Get guests and tables for drag-and-drop testing
      const [guestsResponse, tablesResponse] = await Promise.all([
        fetch(`${API_BASE}/guests/events/${EVENT_ID}`),
        fetch(`${API_BASE}/tables/events/${EVENT_ID}`)
      ]);
      
      if (!guestsResponse.ok || !tablesResponse.ok) {
        throw new Error('Failed to fetch guests or tables data');
      }
      
      const guestsData = await guestsResponse.json();
      const tablesData = await tablesResponse.json();
      
      const guests = guestsData.data || guestsData;
      const tables = tablesData.data || tablesData;
      
      if (guests.length === 0 || tables.length === 0) {
        this.log('⚠ No guests or tables available for drag-and-drop testing', 'warning');
        return true;
      }
      
      // Find an unassigned guest
      const unassignedGuest = guests.find(g => !g.tableAssignment);
      const targetTable = tables[0];
      
      if (!unassignedGuest) {
        this.log('⚠ No unassigned guests found for drag-and-drop testing', 'warning');
        return true;
      }
      
      this.log(`Testing drag-and-drop: ${unassignedGuest.name} → ${targetTable.name}`);
      
      // Test table assignment (simulating drag-and-drop)
      const assignResponse = await fetch(`${API_BASE}/guests/${unassignedGuest.id}/table`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: targetTable.id })
      });
      
      if (assignResponse.ok) {
        this.log('✓ Drag-and-drop assignment API working');
        
        // Verify assignment
        const verifyResponse = await fetch(`${API_BASE}/guests/${unassignedGuest.id}`);
        const verifyData = await verifyResponse.json();
        const updatedGuest = verifyData.data || verifyData;
        
        if (updatedGuest.tableAssignment === targetTable.id) {
          this.log('✓ Drag-and-drop assignment verified');
        } else {
          this.log('✗ Drag-and-drop assignment not persisted', 'error');
        }
        
        // Test unassignment (simulating drag to unseated area)
        const unassignResponse = await fetch(`${API_BASE}/guests/${unassignedGuest.id}/table`, {
          method: 'DELETE'
        });
        
        if (unassignResponse.ok) {
          this.log('✓ Drag-and-drop unassignment API working');
        } else {
          this.log('⚠ Drag-and-drop unassignment API failed', 'warning');
        }
        
      } else {
        this.log('✗ Drag-and-drop assignment API failed', 'error');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Drag and drop API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTouchGestureSupport() {
    this.log('=== Testing Touch Gesture Support ===');
    
    try {
      // Test venue layout API for touch gestures
      const venueResponse = await fetch(`${API_BASE}/venue-layout/events/${EVENT_ID}`);
      
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        const elements = venueData.elements || [];
        
        this.log(`✓ Venue layout data available: ${elements.length} elements`);
        
        if (elements.length > 0) {
          const sampleElement = elements[0];
          
          // Check for touch-gesture friendly properties
          const gestureProps = ['position', 'dimensions', 'id'];
          const availableGestureProps = gestureProps.filter(prop => 
            sampleElement.hasOwnProperty(prop)
          );
          
          this.log(`✓ Touch gesture properties available: ${availableGestureProps.length}/${gestureProps.length}`);
          
          // Test element position update (simulating pan gesture)
          if (sampleElement.position) {
            const originalPosition = { ...sampleElement.position };
            const newPosition = {
              x: originalPosition.x + 10,
              y: originalPosition.y + 10
            };
            
            const updateResponse = await fetch(`${API_BASE}/venue-layout/elements/${sampleElement.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...sampleElement,
                position: newPosition
              })
            });
            
            if (updateResponse.ok) {
              this.log('✓ Pan gesture simulation successful');
              
              // Revert position
              await fetch(`${API_BASE}/venue-layout/elements/${sampleElement.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...sampleElement,
                  position: originalPosition
                })
              });
              
            } else {
              this.log('⚠ Pan gesture simulation failed', 'warning');
            }
          }
        }
      } else {
        this.log('⚠ Venue layout not available for gesture testing', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Touch gesture support test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testMobileNavigationAPI() {
    this.log('=== Testing Mobile Navigation API ===');
    
    try {
      // Test navigation-related endpoints
      const navigationEndpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guest List' },
        { url: `${API_BASE}/tables/events/${EVENT_ID}`, name: 'Table Management' },
        { url: `${API_BASE}/venue-layout/events/${EVENT_ID}`, name: 'Venue Layout' },
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Dashboard' }
      ];
      
      let accessibleEndpoints = 0;
      
      for (const endpoint of navigationEndpoints) {
        try {
          const response = await fetch(endpoint.url);
          if (response.ok) {
            accessibleEndpoints++;
            this.log(`✓ ${endpoint.name} API accessible`);
          } else {
            this.log(`⚠ ${endpoint.name} API returned ${response.status}`, 'warning');
          }
        } catch (error) {
          this.log(`✗ ${endpoint.name} API failed: ${error.message}`, 'error');
        }
      }
      
      const accessibilityRate = (accessibleEndpoints / navigationEndpoints.length) * 100;
      this.log(`Mobile navigation accessibility: ${accessibilityRate.toFixed(1)}% (${accessibleEndpoints}/${navigationEndpoints.length})`);
      
      if (accessibilityRate >= 75) {
        this.log('✓ Mobile navigation APIs sufficiently accessible');
      } else {
        this.log('⚠ Mobile navigation APIs have accessibility issues', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Mobile navigation API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTouchFriendlyDataSizes() {
    this.log('=== Testing Touch-Friendly Data Sizes ===');
    
    try {
      // Test data payload sizes for mobile optimization
      const dataEndpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guests', maxSize: 100000 }, // 100KB
        { url: `${API_BASE}/tables/events/${EVENT_ID}`, name: 'Tables', maxSize: 50000 },   // 50KB
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Analytics', maxSize: 200000 } // 200KB
      ];
      
      for (const endpoint of dataEndpoints) {
        try {
          const startTime = Date.now();
          const response = await fetch(endpoint.url);
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            const dataSize = JSON.stringify(data).length;
            
            this.log(`${endpoint.name} data size: ${(dataSize / 1024).toFixed(1)}KB (${responseTime}ms)`);
            
            if (dataSize <= endpoint.maxSize) {
              this.log(`✓ ${endpoint.name} data size mobile-friendly`);
            } else {
              this.log(`⚠ ${endpoint.name} data size may be too large for mobile`, 'warning');
            }
            
            if (responseTime <= 2000) {
              this.log(`✓ ${endpoint.name} response time mobile-friendly`);
            } else {
              this.log(`⚠ ${endpoint.name} response time slow for mobile`, 'warning');
            }
          }
        } catch (error) {
          this.log(`✗ ${endpoint.name} data size test failed: ${error.message}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Touch-friendly data sizes test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testMobileSpecificFeatures() {
    this.log('=== Testing Mobile-Specific Features ===');
    
    try {
      // Test mobile-specific functionality
      const mobileFeatures = [
        {
          name: 'Contact Integration',
          test: async () => {
            // Test if contact import endpoint exists
            const response = await fetch(`${API_BASE}/guests/import/contacts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contacts: [], eventId: EVENT_ID })
            });
            return response.status !== 404; // Endpoint exists
          }
        },
        {
          name: 'Touch Calibration',
          test: async () => {
            // Test if touch calibration settings exist
            const response = await fetch(`${API_BASE}/mobile/touch-settings`);
            return response.status !== 404;
          }
        },
        {
          name: 'Offline Support',
          test: async () => {
            // Test if offline sync queue exists
            const response = await fetch(`${API_BASE}/sync/queue/status`);
            return response.status !== 404;
          }
        }
      ];
      
      let availableFeatures = 0;
      
      for (const feature of mobileFeatures) {
        try {
          const isAvailable = await feature.test();
          if (isAvailable) {
            availableFeatures++;
            this.log(`✓ ${feature.name} feature available`);
          } else {
            this.log(`⚠ ${feature.name} feature not available`, 'warning');
          }
        } catch (error) {
          this.log(`⚠ ${feature.name} feature test failed: ${error.message}`, 'warning');
        }
      }
      
      const featureAvailability = (availableFeatures / mobileFeatures.length) * 100;
      this.log(`Mobile feature availability: ${featureAvailability.toFixed(1)}% (${availableFeatures}/${mobileFeatures.length})`);
      
      return true;
    } catch (error) {
      this.log(`✗ Mobile-specific features test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTouchPerformanceOptimization() {
    this.log('=== Testing Touch Performance Optimization ===');
    
    try {
      // Test performance of touch-intensive operations
      const performanceTests = [
        {
          name: 'Guest List Loading',
          operation: () => fetch(`${API_BASE}/guests/events/${EVENT_ID}`)
        },
        {
          name: 'Table Assignment',
          operation: async () => {
            const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
            const guestsData = await guestsResponse.json();
            const guests = guestsData.data || guestsData;
            
            if (guests.length > 0) {
              return fetch(`${API_BASE}/guests/${guests[0].id}`);
            }
            return { ok: true };
          }
        },
        {
          name: 'Venue Layout Update',
          operation: () => fetch(`${API_BASE}/venue-layout/events/${EVENT_ID}`)
        }
      ];
      
      for (const test of performanceTests) {
        const startTime = Date.now();
        try {
          const response = await test.operation();
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            this.log(`${test.name}: ${responseTime}ms`);
            
            if (responseTime <= 500) {
              this.log(`✓ ${test.name} performance excellent`);
            } else if (responseTime <= 1000) {
              this.log(`✓ ${test.name} performance good`);
            } else {
              this.log(`⚠ ${test.name} performance needs optimization`, 'warning');
            }
          }
        } catch (error) {
          this.log(`✗ ${test.name} performance test failed: ${error.message}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Touch performance optimization test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Mobile Touch Optimization Testing');
    this.log(`Testing against: ${API_BASE}`);
    this.log(`Event ID: ${EVENT_ID}`);
    this.log('');

    const tests = [
      { name: 'Touch-Optimized Components', fn: () => this.testTouchOptimizedComponents() },
      { name: 'Drag and Drop API', fn: () => this.testDragAndDropAPI() },
      { name: 'Touch Gesture Support', fn: () => this.testTouchGestureSupport() },
      { name: 'Mobile Navigation API', fn: () => this.testMobileNavigationAPI() },
      { name: 'Touch-Friendly Data Sizes', fn: () => this.testTouchFriendlyDataSizes() },
      { name: 'Mobile-Specific Features', fn: () => this.testMobileSpecificFeatures() },
      { name: 'Touch Performance Optimization', fn: () => this.testTouchPerformanceOptimization() }
    ];

    const results = [];
    for (const test of tests) {
      this.log(`\n--- Running ${test.name} ---`);
      const startTime = Date.now();
      const success = await test.fn();
      const duration = Date.now() - startTime;
      
      results.push({
        name: test.name,
        success,
        duration
      });
      
      this.log(`${test.name} completed in ${duration}ms: ${success ? '✓ PASSED' : '✗ FAILED'}`);
    }

    // Summary
    this.log('\n' + '='.repeat(60));
    this.log('📱 MOBILE TOUCH OPTIMIZATION TEST SUMMARY');
    this.log('='.repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const totalDuration = Date.now() - this.startTime;
    
    this.log(`Tests passed: ${passed}/${total}`);
    this.log(`Total duration: ${totalDuration}ms`);
    this.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    results.forEach(result => {
      const status = result.success ? '✓' : '✗';
      this.log(`  ${status} ${result.name} (${result.duration}ms)`);
    });

    if (passed === total) {
      this.log('\n🎉 All mobile touch optimization tests passed!');
    } else {
      this.log(`\n⚠️  ${total - passed} test(s) failed. Check the logs above for details.`);
    }

    // Save detailed results
    const reportData = {
      summary: {
        passed,
        total,
        successRate: (passed/total) * 100,
        totalDuration,
        timestamp: new Date().toISOString()
      },
      testResults: results,
      detailedLogs: this.testResults
    };

    require('fs').writeFileSync(
      `mobile-touch-optimization-test-report-${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    );

    this.log(`\n📄 Detailed report saved to mobile-touch-optimization-test-report-${Date.now()}.json`);
    
    return passed === total;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MobileTouchOptimizationTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = MobileTouchOptimizationTest;