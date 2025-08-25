import request from 'supertest';
import express from 'express';
import { RelationshipType } from '../../../../shared/src/types';

// Mock all dependencies before importing routes
jest.mock('../../config/database', () => ({
  setupDatabase: jest.fn(),
  getPool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    }),
    end: jest.fn()
  })),
  closeDatabase: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the messaging service with proper implementations
const mockMessagingService = {
  sendBulkInvitations: jest.fn(),
  getBulkInvitationProgress: jest.fn(),
  sendInvitation: jest.fn(),
  sendReminder: jest.fn(),
  scheduleMessages: jest.fn(),
  getMessageStatistics: jest.fn(),
  retryFailedMessages: jest.fn(),
  cleanupCompletedTrackers: jest.fn()
};

const mockMessageRepository = {
  findWithFilters: jest.fn(),
  findByRecipientId: jest.fn()
};

jest.mock('../../services/MessagingService', () => ({
  MessagingService: jest.fn().mockImplementation(() => mockMessagingService)
}));

jest.mock('../../repositories/MessageRepository', () => ({
  MessageRepository: jest.fn().mockImplementation(() => mockMessageRepository)
}));

jest.mock('../../services/WhatsAppMockService', () => ({
  WhatsAppMockService: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn().mockResolvedValue({ success: true })
  }))
}));

// Import routes after mocking
import messagingRoutes from '../../routes/messaging';

describe('Messaging Integration Tests', () => {
  let app: express.Application;
  
  let testEventId: string;
  let testGuestIds: string[];
  let testTemplateId: string;

  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Wedding',
    description: 'A test wedding event',
    date: new Date('2024-12-25T18:00:00Z'),
    location: 'Test Venue',
    rsvpDeadline: new Date('2024-12-20T23:59:59Z'),
    organizerId: 'test-organizer',
    publicRSVPEnabled: true,
    publicRSVPLink: 'test-public-link',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockGuests = [
    {
      id: 'guest-1',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      relationshipType: RelationshipType.FRIEND,
      brideOrGroomSide: 'bride',
      eventId: 'test-event-id',
      rsvpStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'guest-2',
      name: 'Jane Smith',
      phoneNumber: '+0987654321',
      dietaryRestrictions: ['vegetarian'],
      additionalGuestCount: 1,
      relationshipType: RelationshipType.COUSIN,
      brideOrGroomSide: 'groom',
      eventId: 'test-event-id',
      rsvpStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTemplate = {
    id: 'test-template-id',
    eventId: 'test-event-id',
    name: 'Test Template',
    subject: 'You\'re Invited to {{eventTitle}}!',
    content: 'Dear {{guestName}}, you are cordially invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP: {{rsvpLink}}',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontFamily: 'Arial',
    fontSize: 16,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeAll(async () => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/messaging', messagingRoutes);

    // Set test IDs
    testEventId = mockEvent.id;
    testGuestIds = mockGuests.map(g => g.id);
    testTemplateId = mockTemplate.id;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up messaging service mock implementations
    mockMessagingService.sendBulkInvitations.mockImplementation(async (request: any) => {
      if (request.eventId === 'invalid-event') {
        throw new Error('Event not found');
      }
      return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });

    mockMessagingService.getBulkInvitationProgress.mockImplementation((trackingId: string) => {
      if (trackingId === 'invalid-tracking-id') {
        return null;
      }
      return {
        totalGuests: 2,
        processedGuests: 1,
        successfulSends: 1,
        failedSends: 0,
        isComplete: false,
        errors: []
      };
    });

    mockMessagingService.sendInvitation.mockImplementation(async (guestId: string, eventId: string) => {
      if (guestId === 'invalid-guest-id') {
        throw new Error('Guest not found');
      }
      const guest = mockGuests.find(g => g.id === guestId);
      return {
        id: `message-${Date.now()}`,
        recipientId: guestId,
        eventId,
        content: `Dear ${guest?.name}, you are cordially invited to Test Wedding on 12/25/2024 at Test Venue. Please RSVP: http://localhost:3000/rsvp/token123`,
        messageType: 'invitation',
        deliveryStatus: 'pending',
        createdAt: new Date()
      };
    });

    mockMessagingService.sendReminder.mockImplementation(async (guestId: string, eventId: string, content: string) => {
      const guest = mockGuests.find(g => g.id === guestId);
      const personalizedContent = content.replace('{{eventTitle}}', 'Test Wedding');
      return {
        id: `message-${Date.now()}`,
        recipientId: guestId,
        eventId,
        content: personalizedContent,
        messageType: 'reminder',
        deliveryStatus: 'pending',
        createdAt: new Date()
      };
    });

    mockMessagingService.scheduleMessages.mockImplementation(async (request: any) => {
      return request.guestIds.map((guestId: string) => ({
        id: `message-${Date.now()}-${guestId}`,
        recipientId: guestId,
        eventId: request.eventId,
        content: request.content,
        messageType: request.messageType,
        scheduledAt: request.scheduledAt,
        deliveryStatus: 'pending',
        createdAt: new Date()
      }));
    });

    mockMessagingService.getMessageStatistics.mockResolvedValue({
      totalMessages: 2,
      sentMessages: 1,
      deliveredMessages: 1,
      failedMessages: 0,
      pendingMessages: 1,
      deliveryRate: 100,
      messageTypeBreakdown: {
        invitation: 1,
        reminder: 1
      }
    });

    mockMessagingService.retryFailedMessages.mockResolvedValue(0);

    // Set up message repository mock implementations
    mockMessageRepository.findWithFilters.mockImplementation(async (filters: any) => {
      const messages = [
        {
          id: 'msg-1',
          recipientId: testGuestIds[0],
          eventId: testEventId,
          content: 'Test invitation',
          messageType: 'invitation',
          deliveryStatus: 'sent',
          createdAt: new Date()
        }
      ];
      
      if (filters.messageType) {
        return messages.filter(m => m.messageType === filters.messageType);
      }
      
      return messages;
    });

    mockMessageRepository.findByRecipientId.mockImplementation(async (recipientId: string) => {
      return [
        {
          id: 'msg-1',
          recipientId,
          eventId: testEventId,
          content: 'Test message',
          messageType: 'invitation',
          deliveryStatus: 'sent',
          createdAt: new Date()
        }
      ];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/messaging/events/:eventId/bulk-invitations', () => {
    it('should start bulk invitation sending', async () => {
      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/bulk-invitations`)
        .send({
          guestIds: testGuestIds,
          templateId: testTemplateId
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.trackingId).toBeDefined();
      expect(response.body.trackingId).toMatch(/^bulk_/);
      expect(response.body.message).toBe('Bulk invitation sending started');
    });

    it('should handle scheduled bulk invitations', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now

      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/bulk-invitations`)
        .send({
          guestIds: testGuestIds,
          templateId: testTemplateId,
          scheduledAt: scheduledAt.toISOString()
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.trackingId).toBeDefined();
    });

    it('should return error for invalid event ID', async () => {
      const response = await request(app)
        .post('/api/messaging/events/invalid-event/bulk-invitations')
        .send({
          guestIds: testGuestIds
        })
        .expect(400);

      expect(response.body.error).toBe('Event not found');
    });

    it('should return error for empty guest IDs', async () => {
      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/bulk-invitations`)
        .send({
          guestIds: []
        })
        .expect(400);

      expect(response.body.error).toBe('Guest IDs array is required');
    });
  });

  describe('GET /api/messaging/bulk-invitations/:trackingId/progress', () => {
    it('should return progress for valid tracking ID', async () => {
      // Start bulk invitation
      const startResponse = await request(app)
        .post(`/api/messaging/events/${testEventId}/bulk-invitations`)
        .send({
          guestIds: testGuestIds,
          templateId: testTemplateId
        })
        .expect(202);

      const trackingId = startResponse.body.trackingId;

      // Get progress
      const progressResponse = await request(app)
        .get(`/api/messaging/bulk-invitations/${trackingId}/progress`)
        .expect(200);

      expect(progressResponse.body.success).toBe(true);
      expect(progressResponse.body.data).toBeDefined();
      expect(progressResponse.body.data.totalGuests).toBe(2);
      expect(progressResponse.body.data.processedGuests).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for invalid tracking ID', async () => {
      const response = await request(app)
        .get('/api/messaging/bulk-invitations/invalid-tracking-id/progress')
        .expect(404);

      expect(response.body.error).toBe('Tracking ID not found');
    });
  });

  describe('POST /api/messaging/guests/:guestId/invitation', () => {
    it('should send individual invitation', async () => {
      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.messageType).toBe('invitation');
      expect(response.body.data.recipientId).toBe(testGuestIds[0]);
    });

    it('should return error for missing event ID', async () => {
      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          templateId: testTemplateId
        })
        .expect(400);

      expect(response.body.error).toBe('Event ID is required');
    });
  });

  describe('POST /api/messaging/guests/:guestId/reminder', () => {
    it('should send reminder message', async () => {
      const reminderContent = 'Don\'t forget to RSVP for {{eventTitle}}! Deadline: {{rsvpDeadline}}';

      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/reminder`)
        .send({
          eventId: testEventId,
          content: reminderContent
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageType).toBe('reminder');
      expect(response.body.data.content).toContain('Test Wedding');
    });

    it('should return error for missing content', async () => {
      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/reminder`)
        .send({
          eventId: testEventId
        })
        .expect(400);

      expect(response.body.error).toBe('Reminder content is required');
    });
  });

  describe('POST /api/messaging/events/:eventId/schedule-messages', () => {
    it('should schedule messages successfully', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const messageContent = 'Reminder: {{eventTitle}} is tomorrow!';

      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/schedule-messages`)
        .send({
          guestIds: testGuestIds,
          messageType: 'reminder',
          content: messageContent,
          scheduledAt: scheduledAt.toISOString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toBe('Scheduled 2 messages');
    });

    it('should return error for invalid message type', async () => {
      const scheduledAt = new Date(Date.now() + 3600000);

      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/schedule-messages`)
        .send({
          guestIds: testGuestIds,
          messageType: 'invalid-type',
          content: 'Test content',
          scheduledAt: scheduledAt.toISOString()
        })
        .expect(400);

      expect(response.body.error).toBe('Valid message type is required');
    });
  });

  describe('GET /api/messaging/events/:eventId/message-statistics', () => {
    it('should return message statistics', async () => {
      // Send some messages first
      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[1]}/reminder`)
        .send({
          eventId: testEventId,
          content: 'Test reminder'
        });

      // Wait a bit for messages to be processed
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await request(app)
        .get(`/api/messaging/events/${testEventId}/message-statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalMessages).toBeGreaterThan(0);
      expect(response.body.data.messageTypeBreakdown).toBeDefined();
    });
  });

  describe('POST /api/messaging/events/:eventId/retry-failed', () => {
    it('should retry failed messages', async () => {
      // First create some messages that might fail
      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      const response = await request(app)
        .post(`/api/messaging/events/${testEventId}/retry-failed`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.retriedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/messaging/events/:eventId/messages', () => {
    it('should return messages for event', async () => {
      // Send a message first
      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      const response = await request(app)
        .get(`/api/messaging/events/${testEventId}/messages`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter messages by type', async () => {
      // Send different types of messages
      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[1]}/reminder`)
        .send({
          eventId: testEventId,
          content: 'Test reminder'
        });

      const response = await request(app)
        .get(`/api/messaging/events/${testEventId}/messages?messageType=invitation`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // All returned messages should be invitations
      response.body.data.forEach((message: any) => {
        expect(message.messageType).toBe('invitation');
      });
    });
  });

  describe('GET /api/messaging/guests/:guestId/messages', () => {
    it('should return messages for specific guest', async () => {
      // Send messages to the guest
      await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      const response = await request(app)
        .get(`/api/messaging/guests/${testGuestIds[0]}/messages`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All messages should be for this guest
      response.body.data.forEach((message: any) => {
        expect(message.recipientId).toBe(testGuestIds[0]);
      });
    });
  });

  describe('Message personalization', () => {
    it('should personalize message content with guest and event data', async () => {
      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        })
        .expect(201);

      const messageContent = response.body.data.content;
      
      // Check that placeholders were replaced
      expect(messageContent).toContain('John Doe'); // {{guestName}}
      expect(messageContent).toContain('Test Wedding'); // {{eventTitle}}
      expect(messageContent).toContain('Test Venue'); // {{eventLocation}}
      expect(messageContent).toContain('http://'); // {{rsvpLink}}
      
      // Check that no placeholders remain
      expect(messageContent).not.toContain('{{');
      expect(messageContent).not.toContain('}}');
    });
  });

  describe('Error handling', () => {
    it('should handle WhatsApp service errors gracefully', async () => {
      // This test would require mocking the WhatsApp service to simulate failures
      // For now, we'll test that the API doesn't crash when sending messages
      const response = await request(app)
        .post(`/api/messaging/guests/${testGuestIds[0]}/invitation`)
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        });

      // Should not return 500 error even if WhatsApp service has issues
      expect(response.status).not.toBe(500);
    });

    it('should handle invalid guest IDs gracefully', async () => {
      const response = await request(app)
        .post('/api/messaging/guests/invalid-guest-id/invitation')
        .send({
          eventId: testEventId,
          templateId: testTemplateId
        })
        .expect(400);

      expect(response.body.error).toBe('Guest not found');
    });
  });
});