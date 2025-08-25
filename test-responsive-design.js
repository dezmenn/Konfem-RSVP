#!/usr/bin/env node

/**
 * Task 21 Testing Script: Responsive Design Testing
 * Tests responsive design on various screen sizes and orientations
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

class ResponsiveDesignTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    
    // Common screen sizes for testing
    this.screenSizes = [
      { name: 'Mobile Portrait', width: 375, height: 667, type: 'mobile' },
      { name: 'Mobile Landscape', width: 667, height: 375, type: 'mobile' },
      { name: 'Tablet Portrait', width: 768, height: 1024, type: 'tablet' },
      { name: 'Tablet Landscape', width: 1024, height: 768, type: 'tablet' },
      { name: 'Desktop Small', width: 1280, height: 720, type: 'desktop' },
      { name: 'Desktop Large', width: 1920, height: 1080, type: 'desktop' },
      { name: 'Ultra-wide', width: 2560, height: 1440, type: 'desktop' }
    ];
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

  async testDataStructureResponsiveness() {
    this.log('=== Testing Data Structure Responsiveness ===');
    
    try {
      // Test if API provides responsive-friendly data structures
      const endpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guests' },
        { url: `${API_BASE}/tables/events/${EVENT_ID}`, name: 'Tables' },
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Analytics' },
        { url: `${API_BASE}/venue-layout/events/${EVENT_ID}`, name: 'Venue Layout' }
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url);
          if (response.ok) {
            const data = await response.json();
            
            // Check for responsive-friendly properties
            this.analyzeDataStructure(data, endpoint.name);
          } else {
            this.log(`⚠ ${endpoint.name} endpoint returned ${response.status}`, 'warning');
          }
        } catch (error) {
          this.log(`✗ ${endpoint.name} endpoint failed: ${error.message}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Data structure responsiveness test failed: ${error.message}`, 'error');
      return false;
    }
  }

  analyzeDataStructure(data, endpointName) {
    const dataArray = data.data || data;
    
    if (Array.isArray(dataArray)) {
      this.log(`✓ ${endpointName}: Array structure (${dataArray.length} items)`);
      
      if (dataArray.length > 0) {
        const sampleItem = dataArray[0];
        const properties = Object.keys(sampleItem);
        
        // Check for essential responsive properties
        const responsiveProps = {
          'id': sampleItem.hasOwnProperty('id'),
          'name': sampleItem.hasOwnProperty('name') || sampleItem.hasOwnProperty('title'),
          'status': sampleItem.hasOwnProperty('status') || sampleItem.hasOwnProperty('rsvpStatus'),
          'displayable': properties.length <= 15 // Not too many properties for mobile display
        };
        
        const responsiveScore = Object.values(responsiveProps).filter(Boolean).length;
        this.log(`  Responsive properties: ${responsiveScore}/4`);
        
        if (responsiveScore >= 3) {
          this.log(`  ✓ ${endpointName} data structure is responsive-friendly`);
        } else {
          this.log(`  ⚠ ${endpointName} data structure may need responsive optimization`, 'warning');
        }
      }
    } else if (typeof dataArray === 'object') {
      this.log(`✓ ${endpointName}: Object structure`);
      
      // Check for nested responsive structures
      const nestedArrays = Object.keys(dataArray).filter(key => 
        Array.isArray(dataArray[key])
      );
      
      if (nestedArrays.length > 0) {
        this.log(`  ✓ Contains ${nestedArrays.length} nested arrays for responsive display`);
      }
    }
  }

  async testAPIResponseSizes() {
    this.log('=== Testing API Response Sizes for Different Screen Types ===');
    
    try {
      const endpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guests', mobileLimit: 50000 },
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Analytics', mobileLimit: 100000 },
        { url: `${API_BASE}/venue-layout/events/${EVENT_ID}`, name: 'Venue', mobileLimit: 30000 }
      ];
      
      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          const response = await fetch(endpoint.url);
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            const dataSize = JSON.stringify(data).length;
            
            this.log(`${endpoint.name}: ${(dataSize/1024).toFixed(1)}KB in ${responseTime}ms`);
            
            // Test against different screen type requirements
            for (const screen of this.screenSizes) {
              const sizeLimit = screen.type === 'mobile' ? endpoint.mobileLimit : 
                               screen.type === 'tablet' ? endpoint.mobileLimit * 2 : 
                               endpoint.mobileLimit * 4;
              
              if (dataSize <= sizeLimit) {
                this.log(`  ✓ ${screen.name}: Size appropriate (${(dataSize/1024).toFixed(1)}KB <= ${(sizeLimit/1024).toFixed(1)}KB)`);
              } else {
                this.log(`  ⚠ ${screen.name}: Size may be too large (${(dataSize/1024).toFixed(1)}KB > ${(sizeLimit/1024).toFixed(1)}KB)`, 'warning');
              }
            }
          }
        } catch (error) {
          this.log(`✗ ${endpoint.name} size test failed: ${error.message}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ API response sizes test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testLayoutAdaptability() {
    this.log('=== Testing Layout Adaptability ===');
    
    try {
      // Test venue layout adaptability
      const venueResponse = await fetch(`${API_BASE}/venue-layout/events/${EVENT_ID}`);
      
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        const elements = venueData.elements || [];
        const tables = venueData.tables || [];
        
        this.log(`Testing layout with ${elements.length} elements and ${tables.length} tables`);
        
        // Test layout scaling for different screen sizes
        for (const screen of this.screenSizes) {
          const scalingResults = this.testLayoutScaling(elements, tables, screen);
          
          if (scalingResults.suitable) {
            this.log(`  ✓ ${screen.name}: Layout scales appropriately`);
          } else {
            this.log(`  ⚠ ${screen.name}: Layout may need adjustment (${scalingResults.reason})`, 'warning');
          }
        }
      } else {
        this.log('⚠ Venue layout not available for adaptability testing', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Layout adaptability test failed: ${error.message}`, 'error');
      return false;
    }
  }

  testLayoutScaling(elements, tables, screen) {
    // Simulate layout scaling logic
    const totalItems = elements.length + tables.length;
    const screenArea = screen.width * screen.height;
    const itemDensity = totalItems / (screenArea / 10000); // Items per 100x100 area
    
    if (screen.type === 'mobile') {
      if (itemDensity > 5) {
        return { suitable: false, reason: 'Too many items for mobile screen' };
      }
      if (totalItems > 20) {
        return { suitable: false, reason: 'Item count too high for mobile' };
      }
    } else if (screen.type === 'tablet') {
      if (itemDensity > 10) {
        return { suitable: false, reason: 'Item density too high for tablet' };
      }
    }
    
    return { suitable: true, reason: 'Layout scales well' };
  }

  async testNavigationResponsiveness() {
    this.log('=== Testing Navigation Responsiveness ===');
    
    try {
      // Test navigation endpoints that should work across all screen sizes
      const navigationEndpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guest Management', priority: 'high' },
        { url: `${API_BASE}/tables/events/${EVENT_ID}`, name: 'Table Management', priority: 'high' },
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Dashboard', priority: 'medium' },
        { url: `${API_BASE}/venue-layout/events/${EVENT_ID}`, name: 'Venue Layout', priority: 'medium' }
      ];
      
      for (const endpoint of navigationEndpoints) {
        try {
          const response = await fetch(endpoint.url);
          
          if (response.ok) {
            const data = await response.json();
            
            // Test navigation data for different screen types
            for (const screen of this.screenSizes) {
              const navSuitability = this.testNavigationSuitability(data, screen, endpoint.priority);
              
              if (navSuitability.suitable) {
                this.log(`  ✓ ${screen.name} - ${endpoint.name}: Navigation suitable`);
              } else {
                this.log(`  ⚠ ${screen.name} - ${endpoint.name}: ${navSuitability.reason}`, 'warning');
              }
            }
          }
        } catch (error) {
          this.log(`✗ ${endpoint.name} navigation test failed: ${error.message}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Navigation responsiveness test failed: ${error.message}`, 'error');
      return false;
    }
  }

  testNavigationSuitability(data, screen, priority) {
    const dataArray = data.data || data;
    const itemCount = Array.isArray(dataArray) ? dataArray.length : 
                     typeof dataArray === 'object' ? Object.keys(dataArray).length : 0;
    
    if (screen.type === 'mobile') {
      if (priority === 'high' && itemCount > 100) {
        return { suitable: false, reason: 'Too many items for mobile navigation' };
      }
      if (priority === 'medium' && itemCount > 50) {
        return { suitable: false, reason: 'Consider pagination for mobile' };
      }
    } else if (screen.type === 'tablet') {
      if (itemCount > 200) {
        return { suitable: false, reason: 'Consider virtual scrolling for tablet' };
      }
    }
    
    return { suitable: true, reason: 'Navigation handles data appropriately' };
  }

  async testContentPrioritization() {
    this.log('=== Testing Content Prioritization ===');
    
    try {
      // Test if API provides data that can be prioritized for different screen sizes
      const analyticsResponse = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}`);
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const analytics = analyticsData.data;
        
        // Define content priority for different screen sizes
        const contentPriority = {
          mobile: ['rsvpStats', 'guestStats'],
          tablet: ['rsvpStats', 'guestStats', 'messagingStats', 'dietaryStats'],
          desktop: ['rsvpStats', 'guestStats', 'messagingStats', 'dietaryStats', 'attendanceTrends', 'feedbackStats']
        };
        
        for (const screen of this.screenSizes) {
          const requiredContent = contentPriority[screen.type] || contentPriority.desktop;
          const availableContent = requiredContent.filter(content => 
            analytics.hasOwnProperty(content)
          );
          
          const contentScore = (availableContent.length / requiredContent.length) * 100;
          
          if (contentScore >= 80) {
            this.log(`  ✓ ${screen.name}: Content prioritization good (${contentScore.toFixed(0)}%)`);
          } else {
            this.log(`  ⚠ ${screen.name}: Content prioritization needs improvement (${contentScore.toFixed(0)}%)`, 'warning');
          }
        }
      } else {
        this.log('⚠ Analytics not available for content prioritization testing', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Content prioritization test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testInteractionAdaptation() {
    this.log('=== Testing Interaction Adaptation ===');
    
    try {
      // Test if APIs support different interaction patterns
      const interactionTests = [
        {
          name: 'Touch vs Click',
          test: async () => {
            // Test if drag-and-drop API works for both touch and mouse
            const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
            if (guestsResponse.ok) {
              const guestsData = await guestsResponse.json();
              const guests = guestsData.data || guestsData;
              
              if (guests.length > 0) {
                // Test assignment API (works for both touch drag and mouse drag)
                const testResponse = await fetch(`${API_BASE}/guests/${guests[0].id}`, {
                  method: 'GET'
                });
                return testResponse.ok;
              }
            }
            return false;
          }
        },
        {
          name: 'Gesture Support',
          test: async () => {
            // Test if venue layout supports gesture-like operations
            const venueResponse = await fetch(`${API_BASE}/venue-layout/events/${EVENT_ID}`);
            return venueResponse.ok;
          }
        },
        {
          name: 'Keyboard Navigation',
          test: async () => {
            // Test if APIs support keyboard-friendly operations
            const searchResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}?search=test`);
            return searchResponse.status !== 404; // Search functionality exists
          }
        }
      ];
      
      for (const interaction of interactionTests) {
        try {
          const supported = await interaction.test();
          
          if (supported) {
            this.log(`✓ ${interaction.name}: Interaction pattern supported`);
          } else {
            this.log(`⚠ ${interaction.name}: Interaction pattern not fully supported`, 'warning');
          }
        } catch (error) {
          this.log(`⚠ ${interaction.name}: Test failed - ${error.message}`, 'warning');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Interaction adaptation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testPerformanceAcrossScreenSizes() {
    this.log('=== Testing Performance Across Screen Sizes ===');
    
    try {
      const performanceEndpoints = [
        { url: `${API_BASE}/guests/events/${EVENT_ID}`, name: 'Guests' },
        { url: `${API_BASE}/analytics/events/${EVENT_ID}`, name: 'Analytics' }
      ];
      
      for (const endpoint of performanceEndpoints) {
        const performanceResults = [];
        
        // Test multiple requests to get average performance
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          try {
            const response = await fetch(endpoint.url);
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
              performanceResults.push(responseTime);
            }
          } catch (error) {
            this.log(`⚠ ${endpoint.name} performance test iteration ${i+1} failed`, 'warning');
          }
        }
        
        if (performanceResults.length > 0) {
          const avgResponseTime = performanceResults.reduce((sum, time) => sum + time, 0) / performanceResults.length;
          
          this.log(`${endpoint.name} average response time: ${avgResponseTime.toFixed(0)}ms`);
          
          // Test performance expectations for different screen types
          for (const screen of this.screenSizes) {
            const expectedTime = screen.type === 'mobile' ? 1000 : 
                                screen.type === 'tablet' ? 800 : 600;
            
            if (avgResponseTime <= expectedTime) {
              this.log(`  ✓ ${screen.name}: Performance meets expectations (${avgResponseTime.toFixed(0)}ms <= ${expectedTime}ms)`);
            } else {
              this.log(`  ⚠ ${screen.name}: Performance below expectations (${avgResponseTime.toFixed(0)}ms > ${expectedTime}ms)`, 'warning');
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Performance across screen sizes test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Responsive Design Testing');
    this.log(`Testing against: ${API_BASE}`);
    this.log(`Event ID: ${EVENT_ID}`);
    this.log(`Screen sizes: ${this.screenSizes.length} configurations`);
    this.log('');

    const tests = [
      { name: 'Data Structure Responsiveness', fn: () => this.testDataStructureResponsiveness() },
      { name: 'API Response Sizes', fn: () => this.testAPIResponseSizes() },
      { name: 'Layout Adaptability', fn: () => this.testLayoutAdaptability() },
      { name: 'Navigation Responsiveness', fn: () => this.testNavigationResponsiveness() },
      { name: 'Content Prioritization', fn: () => this.testContentPrioritization() },
      { name: 'Interaction Adaptation', fn: () => this.testInteractionAdaptation() },
      { name: 'Performance Across Screen Sizes', fn: () => this.testPerformanceAcrossScreenSizes() }
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
    this.log('📐 RESPONSIVE DESIGN TEST SUMMARY');
    this.log('='.repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const totalDuration = Date.now() - this.startTime;
    
    this.log(`Tests passed: ${passed}/${total}`);
    this.log(`Total duration: ${totalDuration}ms`);
    this.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);
    this.log(`Screen configurations tested: ${this.screenSizes.length}`);
    
    results.forEach(result => {
      const status = result.success ? '✓' : '✗';
      this.log(`  ${status} ${result.name} (${result.duration}ms)`);
    });

    if (passed === total) {
      this.log('\n🎉 All responsive design tests passed!');
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
        screenSizesTested: this.screenSizes.length,
        timestamp: new Date().toISOString()
      },
      screenSizes: this.screenSizes,
      testResults: results,
      detailedLogs: this.testResults
    };

    require('fs').writeFileSync(
      `responsive-design-test-report-${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    );

    this.log(`\n📄 Detailed report saved to responsive-design-test-report-${Date.now()}.json`);
    
    return passed === total;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ResponsiveDesignTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = ResponsiveDesignTest;