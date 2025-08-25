import { ReminderService } from './ReminderService';
import { MessagingService } from './MessagingService';
import { WhatsAppMockService } from './WhatsAppMockService';
import { MessageRepository } from '../repositories/MessageRepository';
import { logger } from '../utils/logger';

export class ReminderScheduler {
  private reminderService: ReminderService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs: number;

  constructor(checkIntervalMs: number = 60000) { // Default: check every minute
    // Initialize services
    const messageRepository = new MessageRepository();
    const whatsAppService = new WhatsAppMockService(messageRepository);
    const messagingService = new MessagingService(whatsAppService);
    this.reminderService = new ReminderService(messagingService);
    this.checkIntervalMs = checkIntervalMs;
  }

  /**
   * Start the reminder scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Reminder scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting reminder scheduler with ${this.checkIntervalMs}ms interval`);

    // Execute immediately on start
    this.executeScheduledReminders();

    // Set up recurring execution
    this.intervalId = setInterval(() => {
      this.executeScheduledReminders();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Reminder scheduler is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Reminder scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    checkIntervalMs: number;
    nextCheckIn?: number;
  } {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      nextCheckIn: this.isRunning ? this.checkIntervalMs : undefined
    };
  }

  /**
   * Execute scheduled reminders
   */
  private async executeScheduledReminders(): Promise<void> {
    try {
      logger.debug('Checking for scheduled reminders to execute');
      
      const results = await this.reminderService.executeScheduledReminders();
      
      if (results.length > 0) {
        const summary = {
          totalExecutions: results.length,
          totalGuestsProcessed: results.reduce((sum, r) => sum + r.guestsProcessed, 0),
          totalRemindersScheduled: results.reduce((sum, r) => sum + r.remindersScheduled, 0),
          totalRemindersSkipped: results.reduce((sum, r) => sum + r.remindersSkipped, 0),
          totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
        };

        logger.info('Scheduled reminder execution completed:', summary);
      } else {
        logger.debug('No scheduled reminders due for execution');
      }
    } catch (error) {
      logger.error('Error executing scheduled reminders:', error);
    }
  }

  /**
   * Update check interval
   */
  updateInterval(newIntervalMs: number): void {
    if (newIntervalMs < 10000) { // Minimum 10 seconds
      throw new Error('Check interval must be at least 10 seconds');
    }

    this.checkIntervalMs = newIntervalMs;
    
    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
      logger.info(`Reminder scheduler interval updated to ${newIntervalMs}ms`);
    }
  }

  /**
   * Execute reminders manually (for testing/admin purposes)
   */
  async executeNow(): Promise<any> {
    logger.info('Manual reminder execution triggered');
    
    try {
      const results = await this.reminderService.executeScheduledReminders();
      
      const summary = {
        totalExecutions: results.length,
        totalGuestsProcessed: results.reduce((sum, r) => sum + r.guestsProcessed, 0),
        totalRemindersScheduled: results.reduce((sum, r) => sum + r.remindersScheduled, 0),
        totalRemindersSkipped: results.reduce((sum, r) => sum + r.remindersSkipped, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
      };

      logger.info('Manual reminder execution completed:', summary);
      
      return {
        success: true,
        executions: results,
        summary
      };
    } catch (error) {
      logger.error('Error in manual reminder execution:', error);
      throw error;
    }
  }
}

// Singleton instance for global use
let schedulerInstance: ReminderScheduler | null = null;

export const getReminderScheduler = (): ReminderScheduler => {
  if (!schedulerInstance) {
    schedulerInstance = new ReminderScheduler();
  }
  return schedulerInstance;
};

export const startReminderScheduler = (): void => {
  const scheduler = getReminderScheduler();
  scheduler.start();
};

export const stopReminderScheduler = (): void => {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
};