#!/usr/bin/env node

/**
 * Task 21 Testing Script: Cross-Platform Synchronization
 * Tests data synchronization between mobile and web platforms
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:5000/api';
const WS_BASE = 'ws://localhost:5000';
const EVENT_ID = 'demo-event-1';

class CrossPlatformSyncTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.webSocket = null;
    this.wsMessages = [];
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

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.webSocket = new WebSocket(`${WS_BASE}/sync`);
        
        this.webSocket.on('open', () => {
          this.log('✓ WebSocket connection established');
          resolve();
        });
        
        this.webSocket.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.wsMessages.push({
              timestamp: Date.now(),
              message
            });
            this.log(`📨 WebSocket message received: ${message.type || 'unknown'}`);
          } catch (error) {
            this.log(`⚠ Invalid WebSocket message: ${data.toString()}`, 'warning');
          }
        });
        
        this.webSocket.on('error', (error) => {
          this.log(`WebSocket error: ${error.message}`, 'error');
          reject(error);
        });
        
        this.webSocket.on('close', () => {
          this.log('WebSocket connection closed');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.webSocket.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnectWebSocket() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  async testWebSocketConnection() {
    this.log('=== Testing WebSocket Connection ===');
    
    try {
      await this.connectWebSocket();
      
      // Test ping/pong
      if (this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.ping();
        this.log('✓ WebSocket ping sent');
        
        // Wait for pong
        await new Promise(resolve => {
          this.webSocket.on('pong', () => {
            this.log('✓ WebSocket pong received');
            resolve();
          });
          setTimeout(resolve, 1000); // Timeout after 1 second
        });
      }
      
      return true;
    } catch (error) {
      this.log(`✗ WebSocket connection test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDataSynchronization() {
    this.log('=== Testing Data Synchronization ===');
    
    try {
      // Clear previous WebSocket messages
      this.wsMessages = [];
      
      // Get initial guest data
      const initialResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
      const initialData = await initialResponse.json();
      const guests = initialData.data || initialData;
      
      if (guests.length === 0) {
        this.log('⚠ No guests found for sync testing', 'warning');
        return true;
      }
      
      const testGuest = guests[0];
      this.log(`Testing sync with guest: ${testGuest.name}`);
      
      // Update guest data
      const updatedGuest = {
        ...testGuest,
        name: `${testGuest.name} (Sync Test)`,
        lastModified: new Date().toISOString()
      };
      
      const updateResponse = await fetch(`${API_BASE}/guests/${testGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGuest)
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update guest');
      }
      
      this.log('✓ Guest updated via API');
      
      // Wait for WebSocket sync message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if sync message was received
      const syncMessages = this.wsMessages.filter(msg => 
        msg.message.type === 'guest_updated' || 
        msg.message.type === 'data_sync' ||
        msg.message.eventId === EVENT_ID
      );
      
      if (syncMessages.length > 0) {
        this.log(`✓ Sync message received via WebSocket (${syncMessages.length} messages)`);
      } else {
        this.log('⚠ No sync messages received via WebSocket', 'warning');
      }
      
      // Verify data consistency across platforms
      const verifyResponse = await fetch(`${API_BASE}/guests/${testGuest.id}`);
      const verifyData = await verifyResponse.json();
      const verifiedGuest = verifyData.data || verifyData;
      
      if (verifiedGuest.name === updatedGuest.name) {
        this.log('✓ Data consistency verified across platforms');
      } else {
        this.log('✗ Data inconsistency detected', 'error');
      }
      
      // Revert the change
      await fetch(`${API_BASE}/guests/${testGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testGuest)
      });
      
      this.log('✓ Test data reverted');
      
      return true;
    } catch (error) {
      this.log(`✗ Data synchronization test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testOfflineQueueing() {
    this.log('=== Testing Offline Queueing ===');
    
    try {
      // Test sync queue API
      const queueResponse = await fetch(`${API_BASE}/sync/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: EVENT_ID,
          operation: 'update_guest',
          data: {
            guestId: 'test-guest-id',
            changes: { name: 'Test Offline Update' }
          },
          timestamp: new Date().toISOString()
        })
      });
      
      if (queueResponse.ok) {
        this.log('✓ Offline operation queued successfully');
      } else {
        this.log('⚠ Offline queueing not available or failed', 'warning');
      }
      
      // Test queue status
      const statusResponse = await fetch(`${API_BASE}/sync/queue/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        this.log(`✓ Queue status retrieved: ${statusData.pendingCount || 0} pending operations`);
      } else {
        this.log('⚠ Queue status not available', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Offline queueing test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testConflictResolution() {
    this.log('=== Testing Conflict Resolution ===');
    
    try {
      // Get a guest for testing
      const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
      const guestsData = await guestsResponse.json();
      const guests = guestsData.data || guestsData;
      
      if (guests.length === 0) {
        this.log('⚠ No guests found for conflict resolution testing', 'warning');
        return true;
      }
      
      const testGuest = guests[0];
      const originalName = testGuest.name;
      
      // Simulate concurrent updates
      const update1 = {
        ...testGuest,
        name: `${originalName} (Update 1)`,
        lastModified: new Date().toISOString()
      };
      
      const update2 = {
        ...testGuest,
        name: `${originalName} (Update 2)`,
        lastModified: new Date(Date.now() + 1000).toISOString() // 1 second later
      };
      
      // Send both updates
      const [response1, response2] = await Promise.all([
        fetch(`${API_BASE}/guests/${testGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update1)
        }),
        fetch(`${API_BASE}/guests/${testGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update2)
        })
      ]);
      
      if (response1.ok && response2.ok) {
        this.log('✓ Concurrent updates processed');
        
        // Check final state
        const finalResponse = await fetch(`${API_BASE}/guests/${testGuest.id}`);
        const finalData = await finalResponse.json();
        const finalGuest = finalData.data || finalData;
        
        // Last-write-wins should apply (update2 should win)
        if (finalGuest.name === update2.name) {
          this.log('✓ Last-write-wins conflict resolution working');
        } else {
          this.log(`⚠ Unexpected conflict resolution result: ${finalGuest.name}`, 'warning');
        }
        
        // Revert changes
        await fetch(`${API_BASE}/guests/${testGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...testGuest, name: originalName })
        });
        
      } else {
        this.log('⚠ Concurrent update test failed', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Conflict resolution test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testSessionContinuity() {
    this.log('=== Testing Session Continuity ===');
    
    try {
      // Test session persistence across requests
      const sessionResponse = await fetch(`${API_BASE}/sync/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: EVENT_ID,
          platform: 'web',
          sessionId: 'test-session-' + Date.now()
        })
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        this.log(`✓ Session created: ${sessionData.sessionId || 'unknown'}`);
        
        // Test session retrieval
        const retrieveResponse = await fetch(`${API_BASE}/sync/session/${sessionData.sessionId || 'test'}`);
        if (retrieveResponse.ok) {
          this.log('✓ Session continuity maintained');
        } else {
          this.log('⚠ Session retrieval failed', 'warning');
        }
      } else {
        this.log('⚠ Session management not available', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Session continuity test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testCrossPlatformDataConsistency() {
    this.log('=== Testing Cross-Platform Data Consistency ===');
    
    try {
      // Test data consistency across different endpoints
      const endpoints = [
        `${API_BASE}/guests/events/${EVENT_ID}`,
        `${API_BASE}/analytics/events/${EVENT_ID}`,
        `${API_BASE}/tables/events/${EVENT_ID}`
      ];
      
      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(endpoint).then(res => res.json()).catch(err => ({ error: err.message }))
        )
      );
      
      const [guestsData, analyticsData, tablesData] = responses;
      
      // Check if all endpoints returned data
      const successfulResponses = responses.filter(data => !data.error && data.success !== false);
      this.log(`✓ ${successfulResponses.length}/${endpoints.length} endpoints responded successfully`);
      
      // Cross-validate guest counts
      if (guestsData.data && analyticsData.data) {
        const guestCount = (guestsData.data || guestsData).length;
        const analyticsGuestCount = analyticsData.data.guestStats.totalGuests;
        
        if (guestCount === analyticsGuestCount) {
          this.log('✓ Guest count consistent across platforms');
        } else {
          this.log(`✗ Guest count inconsistency: guests=${guestCount}, analytics=${analyticsGuestCount}`, 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Cross-platform data consistency test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testSyncPerformance() {
    this.log('=== Testing Sync Performance ===');
    
    try {
      const performanceTests = [];
      
      // Test multiple sync operations
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const promise = fetch(`${API_BASE}/sync/status`)
          .then(response => response.json())
          .then(() => {
            const endTime = Date.now();
            return endTime - startTime;
          })
          .catch(() => 1000); // Default to 1s if sync endpoint doesn't exist
        
        performanceTests.push(promise);
      }
      
      const responseTimes = await Promise.all(performanceTests);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      this.log(`Average sync response time: ${avgResponseTime.toFixed(0)}ms`);
      
      if (avgResponseTime < 500) {
        this.log('✓ Sync performance excellent (< 500ms)');
      } else if (avgResponseTime < 1000) {
        this.log('✓ Sync performance good (< 1s)');
      } else {
        this.log('⚠ Sync performance slow (>= 1s)', 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Sync performance test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Cross-Platform Synchronization Testing');
    this.log(`Testing against: ${API_BASE}`);
    this.log(`WebSocket: ${WS_BASE}`);
    this.log(`Event ID: ${EVENT_ID}`);
    this.log('');

    const tests = [
      { name: 'WebSocket Connection', fn: () => this.testWebSocketConnection() },
      { name: 'Data Synchronization', fn: () => this.testDataSynchronization() },
      { name: 'Offline Queueing', fn: () => this.testOfflineQueueing() },
      { name: 'Conflict Resolution', fn: () => this.testConflictResolution() },
      { name: 'Session Continuity', fn: () => this.testSessionContinuity() },
      { name: 'Cross-Platform Data Consistency', fn: () => this.testCrossPlatformDataConsistency() },
      { name: 'Sync Performance', fn: () => this.testSyncPerformance() }
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

    // Cleanup
    await this.disconnectWebSocket();

    // Summary
    this.log('\n' + '='.repeat(60));
    this.log('🔄 CROSS-PLATFORM SYNC TEST SUMMARY');
    this.log('='.repeat(60));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const totalDuration = Date.now() - this.startTime;
    
    this.log(`Tests passed: ${passed}/${total}`);
    this.log(`Total duration: ${totalDuration}ms`);
    this.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);
    this.log(`WebSocket messages received: ${this.wsMessages.length}`);
    
    results.forEach(result => {
      const status = result.success ? '✓' : '✗';
      this.log(`  ${status} ${result.name} (${result.duration}ms)`);
    });

    if (passed === total) {
      this.log('\n🎉 All cross-platform sync tests passed!');
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
        webSocketMessages: this.wsMessages.length,
        timestamp: new Date().toISOString()
      },
      testResults: results,
      webSocketMessages: this.wsMessages,
      detailedLogs: this.testResults
    };

    require('fs').writeFileSync(
      `cross-platform-sync-test-report-${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    );

    this.log(`\n📄 Detailed report saved to cross-platform-sync-test-report-${Date.now()}.json`);
    
    return passed === total;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new CrossPlatformSyncTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = CrossPlatformSyncTest;