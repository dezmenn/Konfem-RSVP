import { ReminderService } from '../../services/ReminderService';
import { MessagingService } from '../../services/MessagingService';
import { ReminderScheduleRepository } from '../../repositories/ReminderScheduleRepository';
import { ReminderExecutionRepository } from '../../repositories/ReminderExecutionRepository';
import { GuestRepository } from '../../repositories/GuestRepository';
import { EventRepository } from '../../repositories/EventRepository';
import { MessageRepository } from '../../repositories/MessageRepository';
import { RSVPService } from '../../services/RSVPService';
import { ReminderSchedule, Guest, Event } from '../../../../shared/src/types';

// Mock all dependencies
jest.mock('../../services/MessagingService');
jest.mock('../../repositories/ReminderScheduleRepository');
jest.mock('../../repositories/ReminderExecutionRepository');
jest.mock('../../repositories/GuestRepository');
jest.mock('../../repositories/EventRepository');
jest.mock('../../repositories/MessageRepository');
jest.mock('../../services/RSVPService');

describe('ReminderService', () => {
  let reminderService: ReminderService;
  let mockMessagingService: jest.Mocked<MessagingService>;
  let mockReminderScheduleRepository: jest.Mocked<ReminderScheduleRepository>;
  let mockReminderExecutionRepository: jest.Mocked<ReminderExecutionRepository>;
  let mockGuestRepository: jest.Mocked<GuestRepository>;
  let mockEventRepository: jest.Mocked<EventRepository>;
  let mockMessageRepository: jest.Mocked<MessageRepository>;
  let mockRSVPService: jest.Mocked<RSVPService>;

  const mockEvent: Event = {
    id: 'event-123',
    title: 'Test Wedding',
    description: 'A beautiful wedding',
    date: new Date('2024-06-15T15:00:00Z'),
    location: 'Test Venue',
    rsvpDeadline: new Date('2024-06-01T23:59:59Z'),
    organizerId: 'organizer-123',
    publicRSVPEnabled: false,
    publicRSVPLink: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockGuests: Guest[] = [
    {
      id: 'guest-1',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      relationshipType: 'Friend' as any,
      brideOrGroomSide: 'bride',
      rsvpStatus: 'pending',
      specialRequests: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'guest-2',
      name: 'Jane Smith',
      phoneNumber: '+1234567891',
      dietaryRestrictions: [],
      additionalGuestCount: 1,
      relationshipType: 'Cousin' as any,
      brideOrGroomSide: 'groom',
      rsvpStatus: 'no_response',
      specialRequests: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'guest-3',
      name: 'Bob Johnson',
      phoneNumber: '+1234567892',
      dietaryRestrictions: [],
      additionalGuestCount: 0,
      relationshipType: 'Uncle' as any,
      brideOrGroomSide: 'bride',
      rsvpStatus: 'accepted',
      specialRequests: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockMessagingService = new MessagingService({} as any) as jest.Mocked<MessagingService>;
    mockReminderScheduleRepository = new ReminderScheduleRepository() as jest.Mocked<ReminderScheduleRepository>;
    mockReminderExecutionRepository = new ReminderExecutionRepository() as jest.Mocked<ReminderExecutionRepository>;
    mockGuestRepository = new GuestRepository() as jest.Mocked<GuestRepository>;
    mockEventRepository = new EventRepository() as jest.Mocked<EventRepository>;
    mockMessageRepository = new MessageRepository() as jest.Mocked<MessageRepository>;
    mockRSVPService = new RSVPService() as jest.Mocked<RSVPService>;

    // Create service instance
    reminderService = new ReminderService(mockMessagingService);

    // Replace repositories with mocks
    (reminderService as any).reminderScheduleRepository = mockReminderScheduleRepository;
    (reminderService as any).reminderExecutionRepository = mockReminderExecutionRepository;
    (reminderService as any).guestRepository = mockGuestRepository;
    (reminderService as any).eventRepository = mockEventRepository;
    (reminderService as any).messageRepository = mockMessageRepository;
    (reminderService as any).rsvpService = mockRSVPService;
  });

  describe('configureReminders', () => {
    it('should create reminder schedules successfully', async () => {
      const mockSchedule: ReminderSchedule = {
        id: 'schedule-1',
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: 'Reminder for {{eventTitle}}',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockReminderScheduleRepository.existsForEventAndTriggerDays.mockResolvedValue(false);
      mockReminderScheduleRepository.create.mockResolvedValue(mockSchedule);

      const config = {
        eventId: 'event-123',
        schedules: [
          {
            triggerDays: 7,
            messageTemplate: 'Reminder for {{eventTitle}}',
            isActive: true
          }
        ]
      };

      const result = await reminderService.configureReminders(config);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockSchedule);
      expect(mockReminderScheduleRepository.create).toHaveBeenCalledWith({
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: 'Reminder for {{eventTitle}}',
        isActive: true
      });
    });

    it('should throw error if event not found', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      const config = {
        eventId: 'nonexistent-event',
        schedules: [
          {
            triggerDays: 7,
            messageTemplate: 'Reminder for {{eventTitle}}'
          }
        ]
      };

      await expect(reminderService.configureReminders(config)).rejects.toThrow('Event not found');
    });

    it('should throw error if RSVP deadline is in the past', async () => {
      const pastEvent = {
        ...mockEvent,
        rsvpDeadline: new Date('2020-01-01T00:00:00Z')
      };

      mockEventRepository.findById.mockResolvedValue(pastEvent);

      const config = {
        eventId: 'event-123',
        schedules: [
          {
            triggerDays: 7,
            messageTemplate: 'Reminder for {{eventTitle}}'
          }
        ]
      };

      await expect(reminderService.configureReminders(config)).rejects.toThrow(
        'Cannot configure reminders for events with past RSVP deadlines'
      );
    });

    it('should skip duplicate schedules', async () => {
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockReminderScheduleRepository.existsForEventAndTriggerDays.mockResolvedValue(true);

      const config = {
        eventId: 'event-123',
        schedules: [
          {
            triggerDays: 7,
            messageTemplate: 'Reminder for {{eventTitle}}'
          }
        ]
      };

      const result = await reminderService.configureReminders(config);

      expect(result).toHaveLength(0);
      expect(mockReminderScheduleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('executeReminderSchedule', () => {
    const mockSchedule: ReminderSchedule = {
      id: 'schedule-1',
      eventId: 'event-123',
      triggerDays: 7,
      messageTemplate: 'Hi {{guestName}}, reminder for {{eventTitle}}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should execute reminder schedule successfully', async () => {
      const mockExecution = {
        id: 'execution-1',
        reminderScheduleId: 'schedule-1',
        eventId: 'event-123',
        executedAt: new Date(),
        guestsProcessed: 2,
        remindersScheduled: 2,
        remindersSkipped: 0,
        errors: []
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockMessageRepository.findWithFilters.mockResolvedValue([]);
      mockMessagingService.sendReminder.mockResolvedValue({} as any);
      mockReminderExecutionRepository.create.mockResolvedValue(mockExecution);

      const result = await reminderService.executeReminderSchedule(mockSchedule);

      expect(result.reminderScheduleId).toBe('schedule-1');
      expect(result.eventId).toBe('event-123');
      expect(result.guestsProcessed).toBe(3); // All guests processed
      expect(result.remindersScheduled).toBe(2); // Only pending/no_response guests
      expect(result.remindersSkipped).toBe(1); // Accepted guest skipped
      expect(result.errors).toHaveLength(0);
    });

    it('should skip guests who already received reminders today', async () => {
      const todayMessage = {
        id: 'msg-1',
        recipientId: 'guest-1',
        content: 'Previous reminder',
        messageType: 'reminder' as const,
        deliveryStatus: 'sent' as const,
        eventId: 'event-123',
        createdAt: new Date()
      };

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockMessageRepository.findWithFilters
        .mockResolvedValueOnce([todayMessage]) // guest-1 already got reminder
        .mockResolvedValueOnce([]); // guest-2 no reminder today
      mockMessagingService.sendReminder.mockResolvedValue({} as any);
      mockReminderExecutionRepository.create.mockResolvedValue({
        id: 'execution-1',
        reminderScheduleId: 'schedule-1',
        eventId: 'event-123',
        executedAt: new Date(),
        guestsProcessed: 2,
        remindersScheduled: 1,
        remindersSkipped: 1,
        errors: []
      });

      const result = await reminderService.executeReminderSchedule(mockSchedule);

      expect(result.guestsProcessed).toBe(3);
      expect(result.remindersScheduled).toBe(1); // Only guest-2
      expect(result.remindersSkipped).toBe(2); // guest-1 (already reminded) + guest-3 (accepted)
    });

    it('should handle messaging errors gracefully', async () => {
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findByEventId.mockResolvedValue([mockGuests[0]]); // Only pending guest
      mockMessageRepository.findWithFilters.mockResolvedValue([]);
      mockMessagingService.sendReminder.mockRejectedValue(new Error('WhatsApp API error'));
      mockReminderExecutionRepository.create.mockResolvedValue({
        id: 'execution-1',
        reminderScheduleId: 'schedule-1',
        eventId: 'event-123',
        executedAt: new Date(),
        guestsProcessed: 1,
        remindersScheduled: 0,
        remindersSkipped: 0,
        errors: ['Failed to send reminder to John Doe: WhatsApp API error']
      });

      const result = await reminderService.executeReminderSchedule(mockSchedule);

      expect(result.guestsProcessed).toBe(1);
      expect(result.remindersScheduled).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('WhatsApp API error');
    });

    it('should throw error if event not found', async () => {
      mockEventRepository.findById.mockResolvedValue(null);

      await expect(reminderService.executeReminderSchedule(mockSchedule)).rejects.toThrow(
        'Event event-123 not found'
      );
    });
  });

  describe('getReminderStatus', () => {
    it('should return reminder status for an event', async () => {
      const activeSchedules = [
        {
          id: 'schedule-1',
          eventId: 'event-123',
          triggerDays: 14,
          messageTemplate: 'Template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'schedule-2',
          eventId: 'event-123',
          triggerDays: 7,
          messageTemplate: 'Template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const executionStats = {
        totalExecutions: 2,
        totalGuestsProcessed: 10,
        totalRemindersScheduled: 8,
        totalRemindersSkipped: 2,
        totalErrors: 0,
        lastExecutionDate: new Date('2024-05-20T10:00:00Z'),
        executionsByDate: []
      };

      const reminderMessages = [
        {
          id: 'msg-1',
          recipientId: 'guest-1',
          content: 'Reminder',
          messageType: 'reminder' as const,
          deliveryStatus: 'delivered' as const,
          eventId: 'event-123',
          createdAt: new Date()
        }
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockReminderScheduleRepository.findActiveByEventId.mockResolvedValue(activeSchedules);
      mockReminderExecutionRepository.getExecutionStatistics.mockResolvedValue(executionStats);
      mockMessageRepository.findWithFilters.mockResolvedValue(reminderMessages);

      const result = await reminderService.getReminderStatus('event-123');

      expect(result.eventId).toBe('event-123');
      expect(result.eventTitle).toBe('Test Wedding');
      expect(result.totalGuests).toBe(3);
      expect(result.pendingGuests).toBe(2); // pending + no_response
      expect(result.activeSchedules).toBe(2);
      expect(result.totalRemindersScheduled).toBe(8);
      expect(result.totalRemindersSent).toBe(1);
      expect(result.lastExecutionDate).toEqual(executionStats.lastExecutionDate);
    });

    it('should calculate next reminder date correctly', async () => {
      const futureEvent = {
        ...mockEvent,
        rsvpDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const activeSchedules = [
        {
          id: 'schedule-1',
          eventId: 'event-123',
          triggerDays: 14, // 14 days before deadline
          messageTemplate: 'Template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockEventRepository.findById.mockResolvedValue(futureEvent);
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockReminderScheduleRepository.findActiveByEventId.mockResolvedValue(activeSchedules);
      mockReminderExecutionRepository.getExecutionStatistics.mockResolvedValue({
        totalExecutions: 0,
        totalGuestsProcessed: 0,
        totalRemindersScheduled: 0,
        totalRemindersSkipped: 0,
        totalErrors: 0,
        executionsByDate: []
      });
      mockMessageRepository.findWithFilters.mockResolvedValue([]);

      const result = await reminderService.getReminderStatus('event-123');

      expect(result.nextReminderDate).toBeDefined();
      // Should be 14 days before the RSVP deadline
      const expectedDate = new Date(futureEvent.rsvpDeadline.getTime() - 14 * 24 * 60 * 60 * 1000);
      expect(result.nextReminderDate?.getTime()).toBeCloseTo(expectedDate.getTime(), -1000);
    });
  });

  describe('createDefaultReminders', () => {
    it('should create default reminder schedules', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          eventId: 'event-123',
          triggerDays: 14,
          messageTemplate: 'Default template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'schedule-2',
          eventId: 'event-123',
          triggerDays: 7,
          messageTemplate: 'Default template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'schedule-3',
          eventId: 'event-123',
          triggerDays: 3,
          messageTemplate: 'Default template',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockReminderScheduleRepository.existsForEventAndTriggerDays.mockResolvedValue(false);
      mockReminderScheduleRepository.create
        .mockResolvedValueOnce(mockSchedules[0])
        .mockResolvedValueOnce(mockSchedules[1])
        .mockResolvedValueOnce(mockSchedules[2]);

      const result = await reminderService.createDefaultReminders('event-123');

      expect(result).toHaveLength(3);
      expect(mockReminderScheduleRepository.create).toHaveBeenCalledTimes(3);
      
      // Check that default schedules were created with correct trigger days
      const createCalls = mockReminderScheduleRepository.create.mock.calls;
      expect(createCalls[0][0].triggerDays).toBe(14);
      expect(createCalls[1][0].triggerDays).toBe(7);
      expect(createCalls[2][0].triggerDays).toBe(3);
    });
  });
});