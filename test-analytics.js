// Simple test script to verify analytics functionality
const fetch = require('node-fetch');

async function testAnalytics() {
  try {
    console.log('Testing analytics endpoints...');
    
    // Test dashboard endpoint
    console.log('\n1. Testing dashboard endpoint...');
    const dashboardResponse = await fetch('http://localhost:5000/api/analytics/dashboard');
    const dashboardData = await dashboardResponse.json();
    
    if (dashboardData.success) {
      console.log('✅ Dashboard endpoint working');
      console.log('   Total Events:', dashboardData.data.totalEvents);
      console.log('   Active Events:', dashboardData.data.activeEvents);
      console.log('   Total Guests:', dashboardData.data.totalGuests);
      console.log('   Overall Response Rate:', dashboardData.data.overallResponseRate + '%');
    } else {
      console.log('❌ Dashboard endpoint failed:', dashboardData.error);
    }
    
    // Test event analytics endpoint
    console.log('\n2. Testing event analytics endpoint...');
    const eventResponse = await fetch('http://localhost:5000/api/analytics/events/demo-event-1');
    const eventData = await eventResponse.json();
    
    if (eventData.success) {
      console.log('✅ Event analytics endpoint working');
      console.log('   Event Title:', eventData.data.eventTitle);
      console.log('   Total Guests:', eventData.data.guestStats.totalGuests);
      console.log('   Total Responses:', eventData.data.rsvpStats.totalResponses);
      console.log('   Response Rate:', eventData.data.rsvpStats.responseRate + '%');
      console.log('   Expected Attendees:', eventData.data.rsvpStats.totalExpectedAttendees);
      console.log('   Dietary Restrictions:', eventData.data.dietaryStats.totalWithRestrictions);
      console.log('   Special Requests:', eventData.data.feedbackStats.totalWithSpecialRequests);
    } else {
      console.log('❌ Event analytics endpoint failed:', eventData.error);
    }
    
    // Test dietary summary endpoint
    console.log('\n3. Testing dietary summary endpoint...');
    const dietaryResponse = await fetch('http://localhost:5000/api/analytics/events/demo-event-1/dietary-summary');
    const dietaryData = await dietaryResponse.json();
    
    if (dietaryData.success) {
      console.log('✅ Dietary summary endpoint working');
      console.log('   Guests with restrictions:', dietaryData.data.dietaryStats.totalWithRestrictions);
      console.log('   Percentage with restrictions:', dietaryData.data.dietaryStats.percentageWithRestrictions + '%');
      console.log('   Restriction breakdown:', Object.keys(dietaryData.data.dietaryStats.restrictionBreakdown));
    } else {
      console.log('❌ Dietary summary endpoint failed:', dietaryData.error);
    }
    
    // Test real-time metrics endpoint
    console.log('\n4. Testing real-time metrics endpoint...');
    const realTimeResponse = await fetch('http://localhost:5000/api/analytics/events/demo-event-1/real-time');
    const realTimeData = await realTimeResponse.json();
    
    if (realTimeData.success) {
      console.log('✅ Real-time metrics endpoint working');
      console.log('   Last updated:', realTimeData.data.realTimeMetrics.lastUpdated);
      console.log('   Recent responses:', realTimeData.data.realTimeMetrics.recentResponses.length);
      console.log('   Days remaining:', realTimeData.data.realTimeMetrics.upcomingDeadline.daysRemaining);
      console.log('   Is overdue:', realTimeData.data.realTimeMetrics.upcomingDeadline.isOverdue);
    } else {
      console.log('❌ Real-time metrics endpoint failed:', realTimeData.error);
    }
    
    console.log('\n🎉 Analytics testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error.message);
    console.log('\nMake sure the backend server is running on http://localhost:5000');
  }
}

testAnalytics();