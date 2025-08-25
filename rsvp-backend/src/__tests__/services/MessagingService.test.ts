import { MessagingService, BulkInvitationRequest, MessageScheduleRequest } from '../../services/MessagingService';
import { WhatsAppMockService } from '../../services/WhatsAppMockService';
import { MessageRepository } from '../../repositories/MessageRepository';
import { GuestRepository } from '../../repositories/GuestRepository';
import { EventRepository } from '../../repositories/EventRepository';
import { InvitationTemplateRepository } from '../../repositories/InvitationTemplateRepository';
import { Guest, Event, InvitationTemplate, Message, RelationshipType } from '../../../../shared/src/types';

// Mock all dependencies
jest.mock('../../repositories/MessageRepository');
jest.mock('../../repositories/GuestRepository');
jest.mock('../../repositories/EventRepository');
jest.mock('../../repositories/InvitationTemplateRepository');
jest.mock('../../services/WhatsAppMockService');
jest.mock('../../services/RSVPService');

describe('MessagingService', () => {
  let messagingService: MessagingService;
  let mockWhatsAppService: jest.Mocked<WhatsAppMockService>;
  let mockMessageRepository: jest.Mocked<MessageRepository>;
  let mockGuestRepository: jest.Mocked<GuestRepository>;
  let mockEventRepository: jest.Mocked<EventRepository>;
  let mockInvitationTemplateRepository: jest.Mocked<InvitationTemplateRepository>;

  const mockGuest: Guest = {
    id: 'guest-1',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    dietaryRestrictions: [],
    additionalGuestCount: 0,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    rsvpStatus: 'pending',
    specialRequests: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Wedding Celebration',
    description: 'A beautiful wedding',
    date: new Date('2024-06-15T18:00:00Z'),
    location: 'Grand Ballroom',
    rsvpDeadline: new Date('2024-06-01T23:59:59Z'),
    organizerId: 'organizer-1',
    publicRSVPEnabled: true,
    publicRSVPLink: 'public-link',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTemplate: InvitationTemplate = {
    id: 'template-1',
    eventId: 'event-1',
    name: 'Default Template',
    subject: 'You\'re Invited!',
    content: 'Dear {{guestName}}, you are invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. RSVP: {{rsvpLink}}',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontFamily: 'Arial',
    fontSize: 16,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMessage: Message = {
    id: 'message-1',
    recipientId: 'guest-1',
    content: 'Personalized invitation content',
    messageType: 'invitation',
    deliveryStatus: 'pending',
    eventId: 'event-1',
    createdAt: new Date()
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mocked instances
    mockMessageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEventId: jest.fn(),
      findByRecipientId: jest.fn(),
      findScheduledMessages: jest.fn(),
      getMessageStats: jest.fn(),
      getDeliveryStatusSummary: jest.fn(),
      findWithFilters: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      markAsSent: jest.fn(),
      markAsDelivered: jest.fn(),
      markAsFailed: jest.fn(),
      findPendingMessages: jest.fn(),
      findLatestMessageByRecipient: jest.fn(),
      bulkCreate: jest.fn()
    } as unknown as jest.Mocked<MessageRepository>;

    mockWhatsAppService = {
      sendMessage: jest.fn(),
      sendBulkMessages: jest.fn(),
      getSentMessages: jest.fn(),
      getDeliveryStatuses: jest.fn(),
      getMessageById: jest.fn(),
      updateDeliveryStatus: jest.fn(),
      getFailedMessages: jest.fn(),
      retryMessage: jest.fn(),
      getMessageStatistics: jest.fn(),
      getRateLimitStatus: jest.fn(),
      clearRateLimits: jest.fn()
    } as unknown as jest.Mocked<WhatsAppMockService>;

    mockGuestRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEventId: jest.fn(),
      findWithFilters: jest.fn(),
      findByTableId: jest.fn(),
      getGuestCountByStatus: jest.fn(),
      getDietaryRestrictionsSummary: jest.fn(),
      assignToTable: jest.fn(),
      unassignFromTable: jest.fn()
    } as unknown as jest.Mocked<GuestRepository>;

    mockEventRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByOrganizerId: jest.fn(),
      findUpcomingEvents: jest.fn(),
      findPastEvents: jest.fn(),
      findEventsWithExpiredRSVP: jest.fn(),
      updateRSVPDeadline: jest.fn(),
      enablePublicRSVP: jest.fn(),
      disablePublicRSVP: jest.fn()
    } as unknown as jest.Mocked<EventRepository>;

    mockInvitationTemplateRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEventId: jest.fn(),
      findDefaultByEventId: jest.fn(),
      setAsDefault: jest.fn()
    } as unknown as jest.Mocked<InvitationTemplateRepository>;

    // Create service instance with injected dependencies
    messagingService = new MessagingService(mockWhatsAppService);
    
    // Inject the mocked repositories
    (messagingService as any).messageRepository = mockMessageRepository;
    (messagingService as any).guestRepository = mockGuestRepository;
    (messagingService as any).eventRepository = mockEventRepository;
    (messagingService as any).invitationTemplateRepository = mockInvitationTemplateRepository;

    // Mock RSVPService methods
    const mockRSVPService = require('../../services/RSVPService').RSVPService;
    mockRSVPService.prototype.getDefaultInvitationTemplate = jest.fn().mockResolvedValue(mockTemplate);
    mockRSVPService.prototype.getRSVPLink = jest.fn().mockResolvedValue('http://localhost:3000/rsvp/token123');
  });

  describe('sendBulkInvitations', () => {
    it('should start bulk invitation sending and return tracking ID', async () => {
      const request: BulkInvitationRequest = {
        eventId: 'event-1',
        guestIds: ['guest-1', 'guest-2'],
        templateId: 'template-1'
      };

      // Mock repository responses
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findById.mockResolvedValueOnce(mockGuest);
      mockGuestRepository.findById.mockResolvedValueOnce({ ...mockGuest, id: 'guest-2', name: 'Jane Doe' });
      mockInvitationTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockMessageRepository.create.mockResolvedValue(mockMessage);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      const trackingId = await messagingService.sendBulkInvitations(request);

      expect(trackingId).toBeDefined();
      expect(typeof trackingId).toBe('string');
      expect(trackingId).toMatch(/^bulk_/);
      expect(mockEventRepository.findById).toHaveBeenCalledWith('event-1');
      expect(mockGuestRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw error if event not found', async () => {
      const request: BulkInvitationRequest = {
        eventId: 'invalid-event',
        guestIds: ['guest-1']
      };

      mockEventRepository.findById.mockResolvedValue(null);

      await expect(messagingService.sendBulkInvitations(request)).rejects.toThrow('Event not found');
    });

    it('should throw error if no valid guests found', async () => {
      const request: BulkInvitationRequest = {
        eventId: 'event-1',
        guestIds: ['invalid-guest']
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findById.mockResolvedValue(null);
      mockInvitationTemplateRepository.findById.mockResolvedValue(mockTemplate);

      await expect(messagingService.sendBulkInvitations(request)).rejects.toThrow('No valid guests found');
    });

    it('should handle scheduled invitations', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const request: BulkInvitationRequest = {
        eventId: 'event-1',
        guestIds: ['guest-1'],
        scheduledAt
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockMessageRepository.create.mockResolvedValue({ ...mockMessage, scheduledAt });

      const trackingId = await messagingService.sendBulkInvitations(request);

      expect(trackingId).toBeDefined();
      
      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt,
          messageType: 'invitation'
        })
      );
    });
  });

  describe('getBulkInvitationProgress', () => {
    it('should return progress for valid tracking ID', async () => {
      const request: BulkInvitationRequest = {
        eventId: 'event-1',
        guestIds: ['guest-1']
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockInvitationTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockMessageRepository.create.mockResolvedValue(mockMessage);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      const trackingId = await messagingService.sendBulkInvitations(request);
      const progress = messagingService.getBulkInvitationProgress(trackingId);

      expect(progress).toBeDefined();
      expect(progress?.totalGuests).toBe(1);
      expect(progress?.processedGuests).toBe(0);
      expect(progress?.isComplete).toBe(false);
    });

    it('should return null for invalid tracking ID', () => {
      const progress = messagingService.getBulkInvitationProgress('invalid-id');
      expect(progress).toBeNull();
    });
  });

  describe('sendInvitation', () => {
    it('should send individual invitation successfully', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockInvitationTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockMessageRepository.create.mockResolvedValue(mockMessage);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      const result = await messagingService.sendInvitation('guest-1', 'event-1', 'template-1');

      expect(result).toEqual(mockMessage);
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        mockGuest.phoneNumber,
        expect.stringContaining('John Doe'),
        mockMessage.id
      );
    });

    it('should throw error if guest not found', async () => {
      mockGuestRepository.findById.mockResolvedValue(null);

      await expect(messagingService.sendInvitation('invalid-guest', 'event-1')).rejects.toThrow('Guest not found');
    });

    it('should throw error if event not found', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(messagingService.sendInvitation('guest-1', 'invalid-event')).rejects.toThrow('Event not found');
    });
  });

  describe('sendReminder', () => {
    it('should send reminder successfully', async () => {
      const reminderContent = 'Don\'t forget to RSVP for {{eventTitle}}!';
      
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockMessageRepository.create.mockResolvedValue({ ...mockMessage, messageType: 'reminder' });
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      const result = await messagingService.sendReminder('guest-1', 'event-1', reminderContent);

      expect(result.messageType).toBe('reminder');
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        mockGuest.phoneNumber,
        expect.stringContaining('Wedding Celebration'),
        expect.any(String)
      );
    });
  });

  describe('scheduleMessages', () => {
    it('should schedule messages successfully', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const request: MessageScheduleRequest = {
        eventId: 'event-1',
        guestIds: ['guest-1', 'guest-2'],
        messageType: 'reminder',
        content: 'Reminder: {{eventTitle}} is coming up!',
        scheduledAt
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findById.mockResolvedValueOnce(mockGuest);
      mockGuestRepository.findById.mockResolvedValueOnce({ ...mockGuest, id: 'guest-2' });
      mockMessageRepository.create.mockResolvedValue({ ...mockMessage, scheduledAt, messageType: 'reminder' });

      const result = await messagingService.scheduleMessages(request);

      expect(result).toHaveLength(2);
      expect(mockMessageRepository.create).toHaveBeenCalledTimes(2);
      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'reminder',
          scheduledAt
        })
      );
    });

    it('should throw error if scheduled time is in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const request: MessageScheduleRequest = {
        eventId: 'event-1',
        guestIds: ['guest-1'],
        messageType: 'reminder',
        content: 'Test content',
        scheduledAt: pastDate
      };

      await expect(messagingService.scheduleMessages(request)).rejects.toThrow('Scheduled time must be in the future');
    });
  });

  describe('processScheduledMessages', () => {
    it('should process due scheduled messages', async () => {
      const dueMessages = [
        { ...mockMessage, id: 'msg-1', scheduledAt: new Date() },
        { ...mockMessage, id: 'msg-2', scheduledAt: new Date() }
      ];

      mockMessageRepository.findScheduledMessages.mockResolvedValue(dueMessages);
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      await messagingService.processScheduledMessages();

      expect(mockMessageRepository.findScheduledMessages).toHaveBeenCalledWith(expect.any(Date));
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle failed message sending', async () => {
      const dueMessages = [{ ...mockMessage, scheduledAt: new Date() }];

      mockMessageRepository.findScheduledMessages.mockResolvedValue(dueMessages);
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: false, error: 'Send failed' });

      await messagingService.processScheduledMessages();

      expect(mockWhatsAppService.sendMessage).toHaveBeenCalled();
      // Should not throw error, just log it
    });
  });

  describe('getMessageStatistics', () => {
    it('should return message statistics for event', async () => {
      const messages = [
        { ...mockMessage, messageType: 'invitation' as const },
        { ...mockMessage, id: 'msg-2', messageType: 'reminder' as const }
      ];

      mockMessageRepository.findByEventId.mockResolvedValue(messages);
      mockMessageRepository.getMessageStats.mockResolvedValue({
        invitation_pending: 1,
        reminder_sent: 1
      });
      mockMessageRepository.getDeliveryStatusSummary.mockResolvedValue({
        pending: 1,
        sent: 1,
        delivered: 0,
        failed: 0
      });

      const stats = await messagingService.getMessageStatistics('event-1');

      expect(stats.totalMessages).toBe(2);
      expect(stats.messageTypeBreakdown.invitation).toBe(1);
      expect(stats.messageTypeBreakdown.reminder).toBe(1);
      expect(stats.sentMessages).toBe(1);
      expect(stats.pendingMessages).toBe(1);
    });
  });

  describe('retryFailedMessages', () => {
    it('should retry failed messages', async () => {
      const failedMessages = [
        { ...mockMessage, deliveryStatus: 'failed' as const }
      ];

      mockMessageRepository.findWithFilters.mockResolvedValue(failedMessages);
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockMessageRepository.update.mockResolvedValue({ ...mockMessage, deliveryStatus: 'pending' });
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      const retriedCount = await messagingService.retryFailedMessages('event-1');

      expect(retriedCount).toBe(1);
      expect(mockMessageRepository.update).toHaveBeenCalledWith(
        mockMessage.id,
        { deliveryStatus: 'pending' }
      );
      expect(mockWhatsAppService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('message personalization', () => {
    it('should personalize message content correctly', async () => {
      const templateWithPlaceholders = {
        ...mockTemplate,
        content: 'Dear {{guestName}}, you are invited to {{eventTitle}} on {{eventDate}} at {{eventTime}} in {{eventLocation}}. Please RSVP by {{rsvpDeadline}}: {{rsvpLink}}'
      };

      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockInvitationTemplateRepository.findById.mockResolvedValue(templateWithPlaceholders);
      mockMessageRepository.create.mockResolvedValue(mockMessage);
      mockWhatsAppService.sendMessage.mockResolvedValue({ success: true });

      await messagingService.sendInvitation('guest-1', 'event-1', 'template-1');

      expect(mockWhatsAppService.sendMessage).toHaveBeenCalledWith(
        mockGuest.phoneNumber,
        expect.stringContaining('John Doe'),
        expect.any(String)
      );

      const sentContent = mockWhatsAppService.sendMessage.mock.calls[0][1];
      expect(sentContent).toContain('John Doe');
      expect(sentContent).toContain('Wedding Celebration');
      expect(sentContent).toContain('Grand Ballroom');
      expect(sentContent).toContain('http://localhost:3000/rsvp/token123');
    });
  });
});