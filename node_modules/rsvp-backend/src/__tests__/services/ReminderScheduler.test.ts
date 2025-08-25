import { ReminderScheduler } from '../../services/ReminderScheduler';
import { ReminderService } from '../../services/ReminderService';

// Mock the ReminderService
jest.mock('../../services/ReminderService');
jest.mock('../../services/MessagingService');
jest.mock('../../services/WhatsAppMockService');
jest.mock('../../repositories/MessageRepository');

describe('ReminderScheduler', () => {
  let scheduler: ReminderScheduler;
  let mockReminderService: jest.Mocked<ReminderService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create scheduler with short interval for testing
    scheduler = new ReminderScheduler(1000); // 1 second interval
    
    // Get the mocked reminder service
    mockReminderService = (scheduler as any).reminderService as jest.Mocked<ReminderService>;
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
  });

  describe('start and stop', () => {
    it('should start the scheduler successfully', () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();

      expect(scheduler.isSchedulerRunning()).toBe(true);
      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(1);
    });

    it('should not start if already running', () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();
      const firstCallCount = mockReminderService.executeScheduledReminders.mock.calls.length;
      
      scheduler.start(); // Try to start again
      
      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(firstCallCount);
    });

    it('should stop the scheduler successfully', () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();
      expect(scheduler.isSchedulerRunning()).toBe(true);

      scheduler.stop();
      expect(scheduler.isSchedulerRunning()).toBe(false);
    });

    it('should not stop if not running', () => {
      expect(scheduler.isSchedulerRunning()).toBe(false);
      
      // Should not throw error
      scheduler.stop();
      
      expect(scheduler.isSchedulerRunning()).toBe(false);
    });
  });

  describe('scheduled execution', () => {
    it('should execute reminders at regular intervals', async () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();

      // Initial execution
      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(1);

      // Advance time by interval
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Allow async operations to complete

      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(2);

      // Advance time again
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(3);
    });

    it('should handle execution errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockReminderService.executeScheduledReminders.mockRejectedValue(new Error('Execution failed'));

      scheduler.start();

      // Allow async operations to complete
      await Promise.resolve();

      // Should continue running despite error
      expect(scheduler.isSchedulerRunning()).toBe(true);

      // Advance time to trigger next execution
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should have attempted execution again
      expect(mockReminderService.executeScheduledReminders).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.checkIntervalMs).toBe(1000);
      expect(status.nextCheckIn).toBeUndefined();
    });

    it('should return correct status when running', () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.checkIntervalMs).toBe(1000);
      expect(status.nextCheckIn).toBe(1000);
    });
  });

  describe('updateInterval', () => {
    it('should update interval successfully', () => {
      scheduler.updateInterval(5000);

      const status = scheduler.getStatus();
      expect(status.checkIntervalMs).toBe(5000);
    });

    it('should restart scheduler with new interval if running', () => {
      mockReminderService.executeScheduledReminders.mockResolvedValue([]);

      scheduler.start();
      expect(scheduler.isSchedulerRunning()).toBe(true);

      scheduler.updateInterval(5000);

      expect(scheduler.isSchedulerRunning()).toBe(true);
      expect(scheduler.getStatus().checkIntervalMs).toBe(5000);
    });

    it('should reject intervals less than 10 seconds', () => {
      expect(() => {
        scheduler.updateInterval(5000); // Less than 10 seconds
      }).toThrow('Check interval must be at least 10 seconds');
    });

    it('should accept minimum interval of 10 seconds', () => {
      expect(() => {
        scheduler.updateInterval(10000);
      }).not.toThrow();
    });
  });

  describe('executeNow', () => {
    it('should execute reminders manually', async () => {
      const mockResults = [
        {
          reminderScheduleId: 'schedule-1',
          eventId: 'event-1',
          guestsProcessed: 5,
          remindersScheduled: 3,
          remindersSkipped: 2,
          errors: [],
          executionId: 'execution-1'
        }
      ];

      mockReminderService.executeScheduledReminders.mockResolvedValue(mockResults);

      const result = await scheduler.executeNow();

      expect(result.success).toBe(true);
      expect(result.executions).toEqual(mockResults);
      expect(result.summary.totalExecutions).toBe(1);
      expect(result.summary.totalGuestsProcessed).toBe(5);
      expect(result.summary.totalRemindersScheduled).toBe(3);
      expect(result.summary.totalRemindersSkipped).toBe(2);
      expect(result.summary.totalErrors).toBe(0);
    });

    it('should handle manual execution errors', async () => {
      const error = new Error('Manual execution failed');
      mockReminderService.executeScheduledReminders.mockRejectedValue(error);

      await expect(scheduler.executeNow()).rejects.toThrow('Manual execution failed');
    });

    it('should calculate summary correctly with multiple executions', async () => {
      const mockResults = [
        {
          reminderScheduleId: 'schedule-1',
          eventId: 'event-1',
          guestsProcessed: 5,
          remindersScheduled: 3,
          remindersSkipped: 2,
          errors: ['Error 1'],
          executionId: 'execution-1'
        },
        {
          reminderScheduleId: 'schedule-2',
          eventId: 'event-2',
          guestsProcessed: 8,
          remindersScheduled: 6,
          remindersSkipped: 2,
          errors: ['Error 2', 'Error 3'],
          executionId: 'execution-2'
        }
      ];

      mockReminderService.executeScheduledReminders.mockResolvedValue(mockResults);

      const result = await scheduler.executeNow();

      expect(result.summary.totalExecutions).toBe(2);
      expect(result.summary.totalGuestsProcessed).toBe(13); // 5 + 8
      expect(result.summary.totalRemindersScheduled).toBe(9); // 3 + 6
      expect(result.summary.totalRemindersSkipped).toBe(4); // 2 + 2
      expect(result.summary.totalErrors).toBe(3); // 1 + 2
    });
  });

  describe('singleton functions', () => {
    it('should return the same instance', () => {
      const { getReminderScheduler } = require('../../services/ReminderScheduler');
      
      const instance1 = getReminderScheduler();
      const instance2 = getReminderScheduler();
      
      expect(instance1).toBe(instance2);
    });

    it('should start and stop scheduler via singleton functions', () => {
      const { startReminderScheduler, stopReminderScheduler, getReminderScheduler } = require('../../services/ReminderScheduler');
      
      const instance = getReminderScheduler();
      const startSpy = jest.spyOn(instance, 'start');
      const stopSpy = jest.spyOn(instance, 'stop');
      
      startReminderScheduler();
      expect(startSpy).toHaveBeenCalled();
      
      stopReminderScheduler();
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});