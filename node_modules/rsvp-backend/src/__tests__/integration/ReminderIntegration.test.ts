import request from 'supertest';
import { app } from '../../server';
import { ReminderService } from '../../services/ReminderService';
import { MessagingService } from '../../services/MessagingService';
import { WhatsAppMockService } from '../../services/WhatsAppMockService';
import { MessageRepository } from '../../repositories/MessageRepository';

// Mock external dependencies
jest.mock('../../config/database');
jest.mock('../../config/redis');

describe('Reminder Integration Tests', () => {
  let reminderService: ReminderService;
  let messagingService: MessagingService;
  let whatsAppService: WhatsAppMockService;

  beforeAll(() => {
    // Initialize services for testing
    const messageRepository = new MessageRepository();
    whatsAppService = new WhatsAppMockService(messageRepository);
    messagingService = new MessagingService(whatsAppService);
    reminderService = new ReminderService(messagingService);
  });

  beforeEach(() => {
    // Reset WhatsApp service state
    whatsAppService.reset();
  });

  describe('POST /api/reminders/configure', () => {
    it('should configure reminder schedules successfully', async () => {
      const requestBody = {
        eventId: 'test-event-123',
        schedules: [
          {
            triggerDays: 14,
            messageTemplate: 'Hi {{guestName}}, reminder for {{eventTitle}} on {{eventDate}}',
            isActive: true
          },
          {
            triggerDays: 7,
            messageTemplate: 'Final reminder for {{eventTitle}}',
            isActive: true
          }
        ]
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toContain('Created 2 reminder schedules');
    });

    it('should return 400 for missing eventId', async () => {
      const requestBody = {
        schedules: [
          {
            triggerDays: 7,
            messageTemplate: 'Reminder template'
          }
        ]
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toBe('Event ID is required');
    });

    it('should return 400 for invalid trigger days', async () => {
      const requestBody = {
        eventId: 'test-event-123',
        schedules: [
          {
            triggerDays: -5,
            messageTemplate: 'Invalid reminder'
          }
        ]
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('Invalid trigger days');
    });

    it('should return 400 for missing message template', async () => {
      const requestBody = {
        eventId: 'test-event-123',
        schedules: [
          {
            triggerDays: 7
          }
        ]
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toBe('Message template is required for each schedule');
    });
  });

  describe('GET /api/reminders/event/:eventId', () => {
    it('should return reminder schedules for an event', async () => {
      const response = await request(app)
        .get('/api/reminders/event/test-event-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/reminders/schedule/:scheduleId', () => {
    it('should update a reminder schedule', async () => {
      const updateData = {
        triggerDays: 10,
        messageTemplate: 'Updated reminder template',
        isActive: false
      };

      const response = await request(app)
        .put('/api/reminders/schedule/test-schedule-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reminder schedule updated successfully');
    });
  });

  describe('DELETE /api/reminders/schedule/:scheduleId', () => {
    it('should delete a reminder schedule', async () => {
      const response = await request(app)
        .delete('/api/reminders/schedule/test-schedule-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reminder schedule deleted successfully');
    });
  });

  describe('POST /api/reminders/schedule/:scheduleId/toggle', () => {
    it('should activate a reminder schedule', async () => {
      const response = await request(app)
        .post('/api/reminders/schedule/test-schedule-123/toggle')
        .send({ isActive: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reminder schedule activated successfully');
    });

    it('should deactivate a reminder schedule', async () => {
      const response = await request(app)
        .post('/api/reminders/schedule/test-schedule-123/toggle')
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reminder schedule deactivated successfully');
    });

    it('should return 400 for invalid isActive value', async () => {
      const response = await request(app)
        .post('/api/reminders/schedule/test-schedule-123/toggle')
        .send({ isActive: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('isActive must be a boolean value');
    });
  });

  describe('POST /api/reminders/execute', () => {
    it('should execute scheduled reminders', async () => {
      const response = await request(app)
        .post('/api/reminders/execute')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('executions');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalExecutions');
      expect(response.body.data.summary).toHaveProperty('totalGuestsProcessed');
      expect(response.body.data.summary).toHaveProperty('totalRemindersScheduled');
    });
  });

  describe('GET /api/reminders/status/:eventId', () => {
    it('should return reminder status for an event', async () => {
      const response = await request(app)
        .get('/api/reminders/status/test-event-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eventId');
      expect(response.body.data).toHaveProperty('eventTitle');
      expect(response.body.data).toHaveProperty('totalGuests');
      expect(response.body.data).toHaveProperty('pendingGuests');
      expect(response.body.data).toHaveProperty('activeSchedules');
    });
  });

  describe('GET /api/reminders/executions/:eventId', () => {
    it('should return reminder execution history', async () => {
      const response = await request(app)
        .get('/api/reminders/executions/test-event-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/reminders/defaults/:eventId', () => {
    it('should create default reminder schedules', async () => {
      const response = await request(app)
        .post('/api/reminders/defaults/test-event-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // Default schedules: 14, 7, 3 days
      expect(response.body.message).toContain('Created 3 default reminder schedules');
    });
  });

  describe('GET /api/reminders/statistics/:eventId', () => {
    it('should return reminder statistics', async () => {
      const response = await request(app)
        .get('/api/reminders/statistics/test-event-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scheduleStats');
      expect(response.body.data).toHaveProperty('executionStats');
      expect(response.body.data).toHaveProperty('messageStats');
    });
  });

  describe('GET /api/reminders/template/default', () => {
    it('should return default reminder template', async () => {
      const response = await request(app)
        .get('/api/reminders/template/default')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data).toHaveProperty('availableVariables');
      expect(response.body.data.template).toContain('{{guestName}}');
      expect(response.body.data.template).toContain('{{eventTitle}}');
      expect(response.body.data.availableVariables).toContain('{{guestName}}');
      expect(response.body.data.availableVariables).toContain('{{eventTitle}}');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service method to throw an error
      const originalMethod = reminderService.getReminderSchedules;
      reminderService.getReminderSchedules = jest.fn().mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/reminders/event/test-event-123')
        .expect(500);

      expect(response.body.error).toBe('Service error');

      // Restore original method
      reminderService.getReminderSchedules = originalMethod;
    });
  });

  describe('Validation edge cases', () => {
    it('should handle empty schedules array', async () => {
      const requestBody = {
        eventId: 'test-event-123',
        schedules: []
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toBe('Schedules array is required');
    });

    it('should handle non-array schedules', async () => {
      const requestBody = {
        eventId: 'test-event-123',
        schedules: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toBe('Schedules array is required');
    });

    it('should handle missing schedules property', async () => {
      const requestBody = {
        eventId: 'test-event-123'
      };

      const response = await request(app)
        .post('/api/reminders/configure')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toBe('Schedules array is required');
    });
  });
});