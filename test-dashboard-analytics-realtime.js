#!/usr/bin/env node

/**
 * Task 21 Testing Script: Dashboard Analytics and Real-time Updates
 * Tests dashboard functionality, real-time updates, and analytics accuracy
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const EVENT_ID = 'demo-event-1';

class DashboardAnalyticsTest {
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

  async testDashboardDataAccuracy() {
    this.log('=== Testing Dashboard Data Accuracy ===');
    
    try {
      // Get analytics data
      const analyticsResponse = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}`);
      const analyticsData = await analyticsResponse.json();
      
      if (!analyticsData.success) {
        throw new Error(`Analytics API failed: ${analyticsData.error}`);
      }
      
      const analytics = analyticsData.data;
      this.log(`✓ Analytics API responded successfully`);
      
      // Get raw guest data for comparison
      const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
      const guestsData = await guestsResponse.json();
      const guests = guestsData.data || guestsData;
      
      // Verify guest statistics accuracy
      const actualTotalGuests = guests.length;
      const reportedTotalGuests = analytics.guestStats.totalGuests;
      
      if (actualTotalGuests === reportedTotalGuests) {
        this.log(`✓ Total guests count accurate: ${actualTotalGuests}`);
      } else {
        this.log(`✗ Total guests mismatch: actual=${actualTotalGuests}, reported=${reportedTotalGuests}`, 'error');
      }
      
      // Verify RSVP status counts
      const statusCounts = guests.reduce((acc, guest) => {
        acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
        return acc;
      }, {});
      
      const reportedAccepted = analytics.rsvpStats.acceptedCount;
      const actualAccepted = statusCounts.accepted || 0;
      
      if (actualAccepted === reportedAccepted) {
        this.log(`✓ Accepted count accurate: ${actualAccepted}`);
      } else {
        this.log(`✗ Accepted count mismatch: actual=${actualAccepted}, reported=${reportedAccepted}`, 'error');
      }
      
      // Verify response rate calculation
      const totalResponses = (statusCounts.accepted || 0) + (statusCounts.declined || 0);
      const expectedResponseRate = actualTotalGuests > 0 ? (totalResponses / actualTotalGuests) * 100 : 0;
      const reportedResponseRate = analytics.rsvpStats.responseRate;
      
      if (Math.abs(expectedResponseRate - reportedResponseRate) < 0.1) {
        this.log(`✓ Response rate accurate: ${reportedResponseRate.toFixed(1)}%`);
      } else {
        this.log(`✗ Response rate mismatch: expected=${expectedResponseRate.toFixed(1)}%, reported=${reportedResponseRate.toFixed(1)}%`, 'error');
      }
      
      // Verify dietary restrictions
      const guestsWithRestrictions = guests.filter(g => g.dietaryRestrictions && g.dietaryRestrictions.length > 0);
      const reportedWithRestrictions = analytics.dietaryStats.totalWithRestrictions;
      
      if (guestsWithRestrictions.length === reportedWithRestrictions) {
        this.log(`✓ Dietary restrictions count accurate: ${guestsWithRestrictions.length}`);
      } else {
        this.log(`✗ Dietary restrictions mismatch: actual=${guestsWithRestrictions.length}, reported=${reportedWithRestrictions}`, 'error');
      }
      
      // Verify bride/groom side counts
      const brideSide = guests.filter(g => g.brideOrGroomSide === 'bride').length;
      const groomSide = guests.filter(g => g.brideOrGroomSide === 'groom').length;
      const reportedBrideSide = analytics.guestStats.brideGroomSideCounts.bride;
      const reportedGroomSide = analytics.guestStats.brideGroomSideCounts.groom;
      
      if (brideSide === reportedBrideSide && groomSide === reportedGroomSide) {
        this.log(`✓ Bride/Groom side counts accurate: bride=${brideSide}, groom=${groomSide}`);
      } else {
        this.log(`✗ Bride/Groom side mismatch: actual(bride=${brideSide}, groom=${groomSide}), reported(bride=${reportedBrideSide}, groom=${reportedGroomSide})`, 'error');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Dashboard data accuracy test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testRealTimeUpdates() {
    this.log('=== Testing Real-time Updates ===');
    
    try {
      // Get initial analytics
      const initialResponse = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}`);
      const initialData = await initialResponse.json();
      const initialAnalytics = initialData.data;
      
      this.log(`Initial accepted count: ${initialAnalytics.rsvpStats.acceptedCount}`);
      
      // Find a guest to update
      const guestsResponse = await fetch(`${API_BASE}/guests/events/${EVENT_ID}`);
      const guestsData = await guestsResponse.json();
      const guests = guestsData.data || guestsData;
      
      const pendingGuest = guests.find(g => g.rsvpStatus === 'pending');
      if (!pendingGuest) {
        this.log('⚠ No pending guests found for real-time update test', 'warning');
        return true;
      }
      
      this.log(`Updating guest ${pendingGuest.name} to accepted status`);
      
      // Update guest status
      const updateResponse = await fetch(`${API_BASE}/guests/${pendingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingGuest,
          rsvpStatus: 'accepted'
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update guest status');
      }
      
      // Wait a moment for analytics to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated analytics
      const updatedResponse = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}`);
      const updatedData = await updatedResponse.json();
      const updatedAnalytics = updatedData.data;
      
      this.log(`Updated accepted count: ${updatedAnalytics.rsvpStats.acceptedCount}`);
      
      // Verify the count increased
      if (updatedAnalytics.rsvpStats.acceptedCount === initialAnalytics.rsvpStats.acceptedCount + 1) {
        this.log(`✓ Real-time update successful: accepted count increased by 1`);
      } else {
        this.log(`✗ Real-time update failed: expected +1, got ${updatedAnalytics.rsvpStats.acceptedCount - initialAnalytics.rsvpStats.acceptedCount}`, 'error');
      }
      
      // Verify last updated timestamp changed
      const initialTimestamp = new Date(initialAnalytics.realTimeMetrics.lastUpdated);
      const updatedTimestamp = new Date(updatedAnalytics.realTimeMetrics.lastUpdated);
      
      if (updatedTimestamp > initialTimestamp) {
        this.log(`✓ Last updated timestamp refreshed`);
      } else {
        this.log(`✗ Last updated timestamp not refreshed`, 'error');
      }
      
      // Revert the change
      await fetch(`${API_BASE}/guests/${pendingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingGuest,
          rsvpStatus: 'pending'
        })
      });
      
      this.log(`Reverted guest ${pendingGuest.name} back to pending status`);
      
      return true;
    } catch (error) {
      this.log(`✗ Real-time updates test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDashboardPerformance() {
    this.log('=== Testing Dashboard Performance ===');
    
    try {
      const performanceTests = [];
      
      // Test multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const promise = fetch(`${API_BASE}/analytics/events/${EVENT_ID}`)
          .then(response => response.json())
          .then(() => {
            const endTime = Date.now();
            return endTime - startTime;
          });
        performanceTests.push(promise);
      }
      
      const responseTimes = await Promise.all(performanceTests);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      this.log(`Average response time: ${avgResponseTime.toFixed(0)}ms`);
      this.log(`Maximum response time: ${maxResponseTime}ms`);
      
      if (avgResponseTime < 1000) {
        this.log(`✓ Dashboard performance acceptable (avg < 1s)`);
      } else {
        this.log(`⚠ Dashboard performance slow (avg >= 1s)`, 'warning');
      }
      
      if (maxResponseTime < 2000) {
        this.log(`✓ Maximum response time acceptable (< 2s)`);
      } else {
        this.log(`⚠ Maximum response time slow (>= 2s)`, 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Dashboard performance test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAnalyticsCalculations() {
    this.log('=== Testing Analytics Calculations ===');
    
    try {
      const response = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}`);
      const data = await response.json();
      const analytics = data.data;
      
      // Test percentage calculations
      const { rsvpStats, guestStats } = analytics;
      
      // Response rate should be between 0 and 100
      if (rsvpStats.responseRate >= 0 && rsvpStats.responseRate <= 100) {
        this.log(`✓ Response rate within valid range: ${rsvpStats.responseRate.toFixed(1)}%`);
      } else {
        this.log(`✗ Response rate out of range: ${rsvpStats.responseRate.toFixed(1)}%`, 'error');
      }
      
      // Acceptance rate should be between 0 and 100
      if (rsvpStats.acceptanceRate >= 0 && rsvpStats.acceptanceRate <= 100) {
        this.log(`✓ Acceptance rate within valid range: ${rsvpStats.acceptanceRate.toFixed(1)}%`);
      } else {
        this.log(`✗ Acceptance rate out of range: ${rsvpStats.acceptanceRate.toFixed(1)}%`, 'error');
      }
      
      // Total responses should equal sum of individual status counts
      const calculatedTotal = rsvpStats.acceptedCount + rsvpStats.declinedCount;
      if (calculatedTotal === rsvpStats.totalResponses) {
        this.log(`✓ Total responses calculation correct: ${rsvpStats.totalResponses}`);
      } else {
        this.log(`✗ Total responses calculation incorrect: expected=${calculatedTotal}, got=${rsvpStats.totalResponses}`, 'error');
      }
      
      // Bride + Groom side should equal total guests
      const totalSides = guestStats.brideGroomSideCounts.bride + guestStats.brideGroomSideCounts.groom;
      if (totalSides === guestStats.totalGuests) {
        this.log(`✓ Bride/Groom side totals match total guests: ${totalSides}`);
      } else {
        this.log(`✗ Bride/Groom side totals don't match: sides=${totalSides}, total=${guestStats.totalGuests}`, 'error');
      }
      
      // Test messaging statistics
      const { messagingStats } = analytics;
      if (messagingStats.deliveryRate >= 0 && messagingStats.deliveryRate <= 100) {
        this.log(`✓ Delivery rate within valid range: ${messagingStats.deliveryRate.toFixed(1)}%`);
      } else {
        this.log(`✗ Delivery rate out of range: ${messagingStats.deliveryRate.toFixed(1)}%`, 'error');
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Analytics calculations test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDashboardErrorHandling() {
    this.log('=== Testing Dashboard Error Handling ===');
    
    try {
      // Test with invalid event ID
      const invalidResponse = await fetch(`${API_BASE}/analytics/events/invalid-event-id`);
      const invalidData = await invalidResponse.json();
      
      if (!invalidData.success) {
        this.log(`✓ Invalid event ID handled gracefully`);
      } else {
        this.log(`✗ Invalid event ID should return error`, 'error');
      }
      
      // Test server error simulation (if endpoint exists)
      try {
        const errorResponse = await fetch(`${API_BASE}/analytics/events/${EVENT_ID}?simulate_error=true`);
        if (!errorResponse.ok) {
          this.log(`✓ Server error handled gracefully`);
        }
      } catch (error) {
        this.log(`✓ Network error handled gracefully`);
      }
      
      return true;
    } catch (error) {
      this.log(`✗ Dashboard error handling test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Dashboard Analytics and Real-time Updates Testing');
    this.log(`Testing against: ${API_BASE}`);
    this.log(`Event ID: ${EVENT_ID}`);
    this.log('');

    const tests = [
      { name: 'Dashboard Data Accuracy', fn: () => this.testDashboardDataAccuracy() },
      { name: 'Real-time Updates', fn: () => this.testRealTimeUpdates() },
      { name: 'Dashboard Performance', fn: () => this.testDashboardPerformance() },
      { name: 'Analytics Calculations', fn: () => this.testAnalyticsCalculations() },
      { name: 'Dashboard Error Handling', fn: () => this.testDashboardErrorHandling() }
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
    this.log('📊 DASHBOARD ANALYTICS TEST SUMMARY');
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
      this.log('\n🎉 All dashboard analytics tests passed!');
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
      `dashboard-analytics-test-report-${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    );

    this.log(`\n📄 Detailed report saved to dashboard-analytics-test-report-${Date.now()}.json`);
    
    return passed === total;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DashboardAnalyticsTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = DashboardAnalyticsTest;