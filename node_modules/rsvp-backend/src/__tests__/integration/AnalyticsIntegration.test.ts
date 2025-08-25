import request from 'supertest';
import { app } from '../../server';
import { DemoDataService } from '../../services/DemoDataService';

describe('Analytics Integration Tests', () => {
  let demoDataService: DemoDataService;
  const testEventId = 'demo-event-1';

  beforeAll(async () => {
    // Initialize demo data
    demoDataService = DemoDataService.getInstance();
    await demoDataService.loadDemoData();
  });

  afterAll(async () => {
    // Clean up if needed
  });

  describe('GET /api/analytics/events/:eventId', () => {
    it('should return comprehensive analytics for an event', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const analytics = response.body.data;
      expect(analytics.eventId).toBe(testEventId);
      expect(analytics.eventTitle).toBeDefined();
      expect(analytics.eventDate).toBeDefined();
      expect(analytics.rsvpDeadline).toBeDefined();

      // Check guest stats
      expect(analytics.guestStats).toBeDefined();
      expect(analytics.guestStats.totalGuests).toBeGreaterThan(0);
      expect(analytics.guestStats.rsvpStatusCounts).toBeDefined();
      expect(analytics.guestStats.dietaryRestrictionsSummary).toBeDefined();
      expect(analytics.guestStats.brideGroomSideCounts).toBeDefined();
      expect(analytics.guestStats.relationshipTypeCounts).toBeDefined();

      // Check RSVP stats
      expect(analytics.rsvpStats).toBeDefined();
      expect(analytics.rsvpStats.totalResponses).toBeGreaterThanOrEqual(0);
      expect(analytics.rsvpStats.responseRate).toBeGreaterThanOrEqual(0);
      expect(analytics.rsvpStats.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(analytics.rsvpStats.responseTrend).toBeInstanceOf(Array);

      // Check messaging stats
      expect(analytics.messagingStats).toBeDefined();
      expect(analytics.messagingStats.totalMessages).toBeGreaterThanOrEqual(0);
      expect(analytics.messagingStats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(analytics.messagingStats.messageTypeBreakdown).toBeDefined();

      // Check dietary stats
      expect(analytics.dietaryStats).toBeDefined();
      expect(analytics.dietaryStats.totalWithRestrictions).toBeGreaterThanOrEqual(0);
      expect(analytics.dietaryStats.restrictionBreakdown).toBeDefined();
      expect(analytics.dietaryStats.percentageWithRestrictions).toBeGreaterThanOrEqual(0);

      // Check feedback stats
      expect(analytics.feedbackStats).toBeDefined();
      expect(analytics.feedbackStats.totalWithSpecialRequests).toBeGreaterThanOrEqual(0);
      expect(analytics.feedbackStats.specialRequestsBreakdown).toBeInstanceOf(Array);

      // Check attendance trends
      expect(analytics.attendanceTrends).toBeDefined();
      expect(analytics.attendanceTrends.brideVsGroomSide).toBeDefined();
      expect(analytics.attendanceTrends.relationshipBreakdown).toBeDefined();

      // Check real-time metrics
      expect(analytics.realTimeMetrics).toBeDefined();
      expect(analytics.realTimeMetrics.lastUpdated).toBeDefined();
      expect(analytics.realTimeMetrics.recentResponses).toBeInstanceOf(Array);
      expect(analytics.realTimeMetrics.upcomingDeadline).toBeDefined();
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/')
        .expect(404); // Route not found

      // Alternative test with empty event ID
      const response2 = await request(app)
        .get('/api/analytics/events/ ')
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error).toContain('Event ID is required');
    });

    it('should return 500 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/analytics/events/nonexistent-event')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard summary', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const summary = response.body.data;
      expect(summary.totalEvents).toBeGreaterThanOrEqual(0);
      expect(summary.activeEvents).toBeGreaterThanOrEqual(0);
      expect(summary.totalGuests).toBeGreaterThanOrEqual(0);
      expect(summary.totalResponses).toBeGreaterThanOrEqual(0);
      expect(summary.overallResponseRate).toBeGreaterThanOrEqual(0);
      expect(summary.recentActivity).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/analytics/events/:eventId/rsvp-trends', () => {
    it('should return RSVP trends for an event', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/rsvp-trends`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      expect(data.trends).toBeInstanceOf(Array);
      expect(data.summary).toBeDefined();
      expect(data.summary.totalResponses).toBeGreaterThanOrEqual(0);
      expect(data.summary.responseRate).toBeGreaterThanOrEqual(0);
      expect(data.summary.acceptanceRate).toBeGreaterThanOrEqual(0);
    });

    it('should filter trends by days parameter', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/rsvp-trends?days=7`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toBeInstanceOf(Array);
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/ /rsvp-trends')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Event ID is required');
    });
  });

  describe('GET /api/analytics/events/:eventId/dietary-summary', () => {
    it('should return dietary requirements summary', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/dietary-summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      expect(data.dietaryStats).toBeDefined();
      expect(data.dietaryStats.totalWithRestrictions).toBeGreaterThanOrEqual(0);
      expect(data.dietaryStats.restrictionBreakdown).toBeDefined();
      expect(data.dietaryStats.percentageWithRestrictions).toBeGreaterThanOrEqual(0);
      expect(data.totalAcceptedGuests).toBeGreaterThanOrEqual(0);
      expect(data.totalExpectedAttendees).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/ /dietary-summary')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Event ID is required');
    });
  });

  describe('GET /api/analytics/events/:eventId/special-requests', () => {
    it('should return special requests and feedback', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/special-requests`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      expect(data.totalWithSpecialRequests).toBeGreaterThanOrEqual(0);
      expect(data.specialRequestsBreakdown).toBeInstanceOf(Array);
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/ /special-requests')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Event ID is required');
    });
  });

  describe('GET /api/analytics/events/:eventId/attendance-breakdown', () => {
    it('should return attendance breakdown by relationship and side', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/attendance-breakdown`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      expect(data.attendanceTrends).toBeDefined();
      expect(data.attendanceTrends.brideVsGroomSide).toBeDefined();
      expect(data.attendanceTrends.relationshipBreakdown).toBeDefined();
      expect(data.guestStats).toBeDefined();
      expect(data.guestStats.totalGuests).toBeGreaterThanOrEqual(0);
      expect(data.guestStats.brideGroomSideCounts).toBeDefined();
      expect(data.guestStats.relationshipTypeCounts).toBeDefined();
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/ /attendance-breakdown')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Event ID is required');
    });
  });

  describe('GET /api/analytics/events/:eventId/real-time', () => {
    it('should return real-time metrics and recent activity', async () => {
      const response = await request(app)
        .get(`/api/analytics/events/${testEventId}/real-time`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      expect(data.realTimeMetrics).toBeDefined();
      expect(data.realTimeMetrics.lastUpdated).toBeDefined();
      expect(data.realTimeMetrics.recentResponses).toBeInstanceOf(Array);
      expect(data.realTimeMetrics.upcomingDeadline).toBeDefined();
      expect(data.messagingStats).toBeDefined();
      expect(data.currentStats).toBeDefined();
      expect(data.currentStats.totalGuests).toBeGreaterThanOrEqual(0);
      expect(data.currentStats.totalResponses).toBeGreaterThanOrEqual(0);
      expect(data.currentStats.responseRate).toBeGreaterThanOrEqual(0);
      expect(data.currentStats.expectedAttendees).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for missing event ID', async () => {
      const response = await request(app)
        .get('/api/analytics/events/ /real-time')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Event ID is required');
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with a malformed event ID that might cause database errors
      const response = await request(app)
        .get('/api/analytics/events/malformed-id-that-causes-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Data validation', () => {
    it('should return consistent data structure across all endpoints', async () => {
      // Test main analytics endpoint
      const analyticsResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}`)
        .expect(200);

      const analytics = analyticsResponse.body.data;

      // Test that all sub-endpoints return data consistent with main analytics
      const trendsResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}/rsvp-trends`)
        .expect(200);

      const dietaryResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}/dietary-summary`)
        .expect(200);

      const requestsResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}/special-requests`)
        .expect(200);

      const attendanceResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}/attendance-breakdown`)
        .expect(200);

      const realTimeResponse = await request(app)
        .get(`/api/analytics/events/${testEventId}/real-time`)
        .expect(200);

      // Verify data consistency
      expect(trendsResponse.body.data.summary.totalResponses)
        .toBe(analytics.rsvpStats.totalResponses);
      
      expect(dietaryResponse.body.data.dietaryStats.totalWithRestrictions)
        .toBe(analytics.dietaryStats.totalWithRestrictions);
      
      expect(requestsResponse.body.data.totalWithSpecialRequests)
        .toBe(analytics.feedbackStats.totalWithSpecialRequests);
      
      expect(attendanceResponse.body.data.guestStats.totalGuests)
        .toBe(analytics.guestStats.totalGuests);
      
      expect(realTimeResponse.body.data.currentStats.totalGuests)
        .toBe(analytics.guestStats.totalGuests);
    });
  });
});