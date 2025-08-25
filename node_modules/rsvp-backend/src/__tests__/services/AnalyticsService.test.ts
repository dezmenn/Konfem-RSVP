import { AnalyticsService } from '../../services/AnalyticsService';
import { GuestService } from '../../services/GuestService';
import { MessagingService } from '../../services/MessagingService';
import { RSVPService } from '../../services/RSVPService';
import { ReminderService } from '../../services/ReminderService';
import { GuestRepository } from '../../repositories/GuestRepository';
import { MessageRepository } from '../../repositories/MessageRepository';
import { RSVPResponseRepository } from '../../repositories/RSVPResponseRepository';
import { EventRepository } from '../../repositories/EventRepository';
import { Guest, Event, RSVPResponse, Message } from '../../../../shared/src/types';

// Mock all dependencies
jest.mock('../../services/GuestService');
jest.mock('../../services/MessagingService');
jest.mock('../../services/RSVPService');
jest.mock('../../services/ReminderService');
jest.mock('../../repositories/GuestRepository');
jest.mock('../../repositories/MessageRepository');
jest.mock('../../repositories/RSVPResponseRepository');
jest.mock('../../repositories/EventRepository');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockGuestService: jest.Mocked<GuestService>;
  let mockMessagingService: jest.Mocked<MessagingService>;
  let mockRSVPService: jest.Mocked<RSVPService>;
  let mockReminderService: jest.Mocked<ReminderService>;
  let mockGuestRepository: jest.Mocked<GuestRepository>;
  let mockMessageRepository: jest.Mocked<MessageRepository>;
  let mockRSVPResponseRepository: jest.Mocked<RSVPResponseRepository>;
  let mockEventRepository: jest.Mocked<EventRepository>;

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Wedding',
    description: 'A beautiful wedding',
    date: new Date('2024-06-15T15:00:00Z'),
    location: 'Test Venue',
    rsvpDeadline: new Date('2024-05-15T23:59:59Z'),
    organizerId: 'organizer-1',
    publicRSVPEnabled: true,
    publicRSVPLink: 'http://localhost:3000/rsvp/public/event-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockGuests: Guest[] = [
    {
      id: 'guest-1',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      dietaryRestrictions: ['Vegetarian'],
      additionalGuestCount: 1,
      relationshipType: 'Friend',
      brideOrGroomSide: 'bride',
      rsvpStatus: 'accepted',
      specialRequests: 'Need wheelchair access',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'guest-2',
      name: 'Jane Smith',
      phoneNumber: '+1234567891',
      dietaryRestrictions: ['Gluten-free'],
      additionalGuestCount: 0,
      relationshipType: 'Cousin',
      brideOrGroomSide: 'groom',
      rsvpStatus: 'declined',
      specialRequests: '',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'guest-3',
      name: 'Bob Wilson',
      phoneNumber: '+1234567892',
      dietaryRestrictions: [],
      additionalGuestCount: 2,
      relationshipType: 'Uncle',
      brideOrGroomSide: 'bride',
      rsvpStatus: 'pending',
      specialRequests: '',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ];

  const mockRSVPResponses: RSVPResponse[] = [
    {
      id: 'rsvp-1',
      guestId: 'guest-1',
      eventId: 'event-1',
      rsvpTokenId: 'token-1',
      attendanceStatus: 'accepted',
      mealPreferences: ['Vegetarian'],
      specialRequests: 'Need wheelchair access',
      additionalGuestDetails: [{ name: 'John Plus One', mealPreferences: ['Regular'] }],
      submittedAt: new Date('2024-02-01T10:00:00Z'),
      createdAt: new Date('2024-02-01T10:00:00Z')
    },
    {
      id: 'rsvp-2',
      guestId: 'guest-2',
      eventId: 'event-1',
      rsvpTokenId: 'token-2',
      attendanceStatus: 'declined',
      mealPreferences: [],
      specialRequests: '',
      additionalGuestDetails: [],
      submittedAt: new Date('2024-02-02T14:00:00Z'),
      createdAt: new Date('2024-02-02T14:00:00Z')
    }
  ];

  const mockMessages: Message[] = [
    {
      id: 'message-1',
      recipientId: 'guest-1',
      content: 'Test invitation',
      messageType: 'invitation',
      deliveryStatus: 'delivered',
      eventId: 'event-1',
      createdAt: new Date('2024-01-15T10:00:00Z')
    },
    {
      id: 'message-2',
      recipientId: 'guest-2',
      content: 'Test reminder',
      messageType: 'reminder',
      deliveryStatus: 'sent',
      eventId: 'event-1',
      createdAt: new Date('2024-01-20T10:00:00Z')
    }
  ];

  beforeEach(() => {
    // Create mocked instances
    mockGuestService = new GuestService({} as any) as jest.Mocked<GuestService>;
    mockMessagingService = new MessagingService({} as any) as jest.Mocked<MessagingService>;
    mockRSVPService = new RSVPService() as jest.Mocked<RSVPService>;
    mockReminderService = new ReminderService() as jest.Mocked<ReminderService>;
    mockGuestRepository = new GuestRepository() as jest.Mocked<GuestRepository>;
    mockMessageRepository = new MessageRepository() as jest.Mocked<MessageRepository>;
    mockRSVPResponseRepository = new RSVPResponseRepository() as jest.Mocked<RSVPResponseRepository>;
    mockEventRepository = new EventRepository() as jest.Mocked<EventRepository>;

    // Create analytics service with mocked dependencies
    analyticsService = new AnalyticsService(
      mockGuestService,
      mockMessagingService,
      mockRSVPService,
      mockReminderService
    );

    // Override the private repositories with mocks
    (analyticsService as any).guestRepository = mockGuestRepository;
    (analyticsService as any).messageRepository = mockMessageRepository;
    (analyticsService as any).rsvpResponseRepository = mockRSVPResponseRepository;
    (analyticsService as any).eventRepository = mockEventRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventAnalytics', () => {
    beforeEach(() => {
      // Setup default mock responses
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestService.getGuestAnalytics.mockResolvedValue({
        totalGuests: 3,
        rsvpStatusCounts: { accepted: 1, declined: 1, pending: 1 },
        dietaryRestrictionsSummary: { Vegetarian: 1, 'Gluten-free': 1 },
        brideGroomSideCounts: { bride: 2, groom: 1 },
        relationshipTypeCounts: { Friend: 1, Cousin: 1, Uncle: 1 }
      });
      mockMessagingService.getMessageStatistics.mockResolvedValue({
        totalMessages: 2,
        sentMessages: 1,
        deliveredMessages: 1,
        failedMessages: 0,
        pendingMessages: 0,
        deliveryRate: 100,
        messageTypeBreakdown: { invitation: 1, reminder: 1 },
        invitationsSent: 1,
        remindersSent: 1,
        confirmationsSent: 0
      });
      mockRSVPResponseRepository.findByEventId.mockResolvedValue(mockRSVPResponses);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
    });

    it('should generate comprehensive analytics for an event', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics).toBeDefined();
      expect(analytics.eventId).toBe('event-1');
      expect(analytics.eventTitle).toBe('Test Wedding');
      expect(analytics.guestStats.totalGuests).toBe(3);
      expect(analytics.rsvpStats.totalResponses).toBe(2);
      expect(analytics.rsvpStats.acceptedCount).toBe(1);
      expect(analytics.rsvpStats.declinedCount).toBe(1);
      expect(analytics.rsvpStats.pendingCount).toBe(1);
    });

    it('should calculate RSVP statistics correctly', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics.rsvpStats.responseRate).toBeCloseTo(66.67, 2); // 2 responses out of 3 guests
      expect(analytics.rsvpStats.acceptanceRate).toBe(50); // 1 accepted out of 2 responses
      expect(analytics.rsvpStats.totalExpectedAttendees).toBe(2); // 1 guest + 1 additional guest
    });

    it('should calculate dietary statistics correctly', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics.dietaryStats.totalWithRestrictions).toBe(2);
      expect(analytics.dietaryStats.percentageWithRestrictions).toBeCloseTo(66.67, 2);
      expect(analytics.dietaryStats.restrictionBreakdown).toEqual({
        Vegetarian: 1,
        'Gluten-free': 1
      });
    });

    it('should calculate feedback statistics correctly', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics.feedbackStats.totalWithSpecialRequests).toBe(1);
      expect(analytics.feedbackStats.specialRequestsBreakdown).toHaveLength(1);
      expect(analytics.feedbackStats.specialRequestsBreakdown[0]).toEqual({
        guestName: 'John Doe',
        request: 'Need wheelchair access',
        rsvpStatus: 'accepted'
      });
    });

    it('should calculate attendance trends correctly', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics.attendanceTrends.brideVsGroomSide.bride.accepted).toBe(1);
      expect(analytics.attendanceTrends.brideVsGroomSide.bride.declined).toBe(0);
      expect(analytics.attendanceTrends.brideVsGroomSide.bride.pending).toBe(1);
      expect(analytics.attendanceTrends.brideVsGroomSide.groom.accepted).toBe(0);
      expect(analytics.attendanceTrends.brideVsGroomSide.groom.declined).toBe(1);
      expect(analytics.attendanceTrends.brideVsGroomSide.groom.pending).toBe(0);
    });

    it('should calculate real-time metrics correctly', async () => {
      const analytics = await analyticsService.getEventAnalytics('event-1');

      expect(analytics.realTimeMetrics.lastUpdated).toBeDefined();
      expect(analytics.realTimeMetrics.recentResponses).toHaveLength(2);
      expect(analytics.realTimeMetrics.upcomingDeadline.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing event gracefully', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(analyticsService.getEventAnalytics('nonexistent-event'))
        .rejects.toThrow('Event not found');
    });

    it('should handle errors gracefully', async () => {
      mockEventRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getEventAnalytics('event-1'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getDashboardSummary', () => {
    beforeEach(() => {
      mockEventRepository.findAll.mockResolvedValue([mockEvent]);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockRSVPResponseRepository.findRecent.mockResolvedValue(mockRSVPResponses.slice(0, 1));
      mockMessageRepository.findRecent.mockResolvedValue(mockMessages.slice(0, 1));
      mockGuestRepository.findRecent.mockResolvedValue(mockGuests.slice(0, 1));
    });

    it('should generate dashboard summary correctly', async () => {
      const summary = await analyticsService.getDashboardSummary();

      expect(summary).toBeDefined();
      expect(summary.totalEvents).toBe(1);
      expect(summary.activeEvents).toBe(1); // Event is in the future
      expect(summary.totalGuests).toBe(3);
      expect(summary.totalResponses).toBe(2); // 1 accepted + 1 declined
      expect(summary.overallResponseRate).toBeCloseTo(66.67, 2);
      expect(summary.recentActivity).toBeDefined();
    });

    it('should calculate active events correctly', async () => {
      const pastEvent = { ...mockEvent, date: new Date('2020-01-01T00:00:00Z') };
      mockEventRepository.findAll.mockResolvedValue([mockEvent, pastEvent]);

      const summary = await analyticsService.getDashboardSummary();

      expect(summary.totalEvents).toBe(2);
      expect(summary.activeEvents).toBe(1); // Only the future event
    });

    it('should handle empty data gracefully', async () => {
      mockEventRepository.findAll.mockResolvedValue([]);
      mockRSVPResponseRepository.findRecent.mockResolvedValue([]);
      mockMessageRepository.findRecent.mockResolvedValue([]);
      mockGuestRepository.findRecent.mockResolvedValue([]);

      const summary = await analyticsService.getDashboardSummary();

      expect(summary.totalEvents).toBe(0);
      expect(summary.activeEvents).toBe(0);
      expect(summary.totalGuests).toBe(0);
      expect(summary.totalResponses).toBe(0);
      expect(summary.overallResponseRate).toBe(0);
      expect(summary.recentActivity).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockEventRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getDashboardSummary())
        .rejects.toThrow('Database error');
    });
  });

  describe('private methods', () => {
    it('should calculate average response time correctly', () => {
      const calculateAverageResponseTime = (analyticsService as any).calculateAverageResponseTime;
      
      const responses = [
        { createdAt: new Date('2024-02-01T10:00:00Z') },
        { createdAt: new Date('2024-02-02T10:00:00Z') }
      ];

      const averageTime = calculateAverageResponseTime(responses);
      expect(averageTime).toBe(24); // 24 hours (assuming 1 day before invitation)
    });

    it('should generate response trend correctly', () => {
      const generateResponseTrend = (analyticsService as any).generateResponseTrend;
      
      const responses = [
        { 
          attendanceStatus: 'accepted', 
          createdAt: new Date('2024-02-01T10:00:00Z') 
        },
        { 
          attendanceStatus: 'declined', 
          createdAt: new Date('2024-02-01T14:00:00Z') 
        },
        { 
          attendanceStatus: 'accepted', 
          createdAt: new Date('2024-02-02T10:00:00Z') 
        }
      ];

      const trend = generateResponseTrend(responses);
      expect(trend).toHaveLength(2); // 2 different dates
      expect(trend[0].acceptedCount).toBe(1);
      expect(trend[0].declinedCount).toBe(1);
      expect(trend[0].cumulativeTotal).toBe(2);
      expect(trend[1].acceptedCount).toBe(1);
      expect(trend[1].declinedCount).toBe(0);
      expect(trend[1].cumulativeTotal).toBe(3);
    });
  });
});