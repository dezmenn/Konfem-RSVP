import { ReminderScheduleRepository } from '../repositories/ReminderScheduleRepository';
import { ReminderExecutionRepository } from '../repositories/ReminderExecutionRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { EventRepository } from '../repositories/EventRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { RSVPService } from './RSVPService';
import { MessagingService } from './MessagingService';
import { MockReminderScheduleRepository } from './MockReminderScheduleRepository';
import { MockReminderExecutionRepository } from './MockReminderExecutionRepository';
import { MockMessageRepository } from './MockMessageRepository';
import { ReminderSchedule, ReminderExecution, Guest, Event } from '../../../shared/src/types';
import { ReminderScheduleInput, ReminderScheduleUpdate, ReminderScheduleModel } from '../models/ReminderSchedule';
import { logger } from '../utils/logger';

export interface ReminderConfiguration {
  eventId: string;
  schedules: Array<{
    triggerDays: number;
    messageTemplate: string;
    isActive?: boolean;
  }>;
}

export interface ReminderExecutionResult {
  reminderScheduleId: string;
  eventId: string;
  guestsProcessed: number;
  remindersScheduled: number;
  remindersSkipped: number;
  errors: string[];
  executionId: string;
}

export interface ReminderStatus {
  eventId: string;
  eventTitle: string;
  rsvpDeadline: Date;
  totalGuests: number;
  pendingGuests: number;
  activeSchedules: number;
  nextReminderDate?: Date;
  lastExecutionDate?: Date;
  totalRemindersScheduled: number;
  totalRemindersSent: number;
}

export class ReminderService {
  private reminderScheduleRepository: ReminderScheduleRepository;
  private reminderExecutionRepository: ReminderExecutionRepository;
  private guestRepository: GuestRepository;
  private eventRepository: EventRepository;
  private messageRepository: MessageRepository;
  private rsvpService: RSVPService;
  private messagingService: MessagingService;

  constructor(messagingService: MessagingService, mockEventService?: any, mockGuestService?: any) {
    // Use mock repositories in demo mode
    const isDemo = process.env.SKIP_DB_SETUP === 'true';
    
    if (isDemo) {
      this.reminderScheduleRepository = new MockReminderScheduleRepository() as unknown as ReminderScheduleRepository;
      this.reminderExecutionRepository = new MockReminderExecutionRepository() as unknown as ReminderExecutionRepository;
      this.messageRepository = new MockMessageRepository() as unknown as MessageRepository;
    } else {
      this.reminderScheduleRepository = new ReminderScheduleRepository();
      this.reminderExecutionRepository = new ReminderExecutionRepository();
      this.messageRepository = new MessageRepository();
    }
    
    this.guestRepository = mockGuestService || new GuestRepository();
    this.eventRepository = mockEventService || new EventRepository();
    this.rsvpService = new RSVPService();
    this.messagingService = messagingService;
  }

  /**
   * Execute reminders for a specific schedule
   */
  async executeReminders(scheduleId: string): Promise<ReminderExecutionResult> {
    const schedule = await this.reminderScheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new Error('Reminder schedule not found');
    }

    if (!schedule.isActive) {
      throw new Error('Reminder schedule is not active');
    }

    const event = await this.eventRepository.findById(schedule.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all guests who haven't responded yet
    const allGuests = await this.guestRepository.findByEventId(schedule.eventId);
    const pendingGuests = allGuests.filter(guest => 
      guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response'
    );

    const executionId = `exec-${Date.now()}`;
    const errors: string[] = [];
    let remindersScheduled = 0;
    let remindersSkipped = 0;

    // Prepare messages for bulk sending
    const messages: Array<{ to: string; content: string; messageId: string }> = [];

    for (const guest of pendingGuests) {
      try {
        if (!guest.phoneNumber) {
          errors.push(`Guest ${guest.name} has no phone number`);
          remindersSkipped++;
          continue;
        }

        // Replace template variables in the message
        let messageContent = schedule.messageTemplate
          .replace(/\{\{guestName\}\}/g, guest.name)
          .replace(/\{\{eventTitle\}\}/g, event.title)
          .replace(/\{\{eventDate\}\}/g, event.date.toLocaleDateString())
          .replace(/\{\{eventTime\}\}/g, 'TBD') // Event type doesn't have time property
          .replace(/\{\{eventLocation\}\}/g, event.location || 'TBD')
          .replace(/\{\{rsvpDeadline\}\}/g, event.rsvpDeadline.toLocaleDateString())
          .replace(/\{\{organizerName\}\}/g, 'Event Organizer'); // Event type doesn't have organizerName

        // Add RSVP link - for now use a generic link since Guest doesn't have rsvpToken
        const rsvpLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/rsvp/public/${event.id}`;
        messageContent = messageContent.replace(/\{\{rsvpLink\}\}/g, rsvpLink);

        messages.push({
          to: guest.phoneNumber,
          content: messageContent,
          messageId: `reminder-${executionId}-${guest.id}`
        });

        remindersScheduled++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to prepare reminder for ${guest.name}: ${errorMessage}`);
        remindersSkipped++;
      }
    }

    // Send bulk messages via WhatsApp
    if (messages.length > 0) {
      try {
        const bulkResult = await this.messagingService.sendBulkReminders(
          schedule.eventId,
          messages.map(msg => ({
            guestId: pendingGuests.find(g => g.phoneNumber === msg.to)?.id || '',
            phone: msg.to,
            content: msg.content,
            messageId: msg.messageId
          }))
        );

        logger.info(`Bulk reminder execution completed`, {
          scheduleId,
          eventId: schedule.eventId,
          totalMessages: messages.length,
          successful: bulkResult.successfulSends,
          failed: bulkResult.failedSends
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to send bulk reminders: ${errorMessage}`);
        logger.error('Bulk reminder sending failed:', error);
      }
    }

    const result: ReminderExecutionResult = {
      reminderScheduleId: scheduleId,
      eventId: schedule.eventId,
      guestsProcessed: pendingGuests.length,
      remindersScheduled,
      remindersSkipped,
      errors,
      executionId
    };

    logger.info(`Reminder execution completed for schedule ${scheduleId}`, result);
    return result;
  }

  /**
   * Execute all active reminders for an event
   */
  async executeAllReminders(eventId: string): Promise<ReminderExecutionResult[]> {
    const activeSchedules = await this.reminderScheduleRepository.findActiveByEventId(eventId);
    const results: ReminderExecutionResult[] = [];

    for (const schedule of activeSchedules) {
      try {
        const result = await this.executeReminders(schedule.id);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to execute reminder schedule ${schedule.id}:`, error);
        
        results.push({
          reminderScheduleId: schedule.id,
          eventId,
          guestsProcessed: 0,
          remindersScheduled: 0,
          remindersSkipped: 0,
          errors: [errorMessage],
          executionId: `failed-${Date.now()}`
        });
      }
    }

    return results;
  }

  /**
   * Configure reminder schedules for an event
   */
  async configureReminders(config: ReminderConfiguration): Promise<ReminderSchedule[]> {
    const { eventId, schedules } = config;

    // Validate event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Validate that RSVP deadline is in the future
    if (event.rsvpDeadline <= new Date()) {
      throw new Error('Cannot configure reminders for events with past RSVP deadlines');
    }

    const createdSchedules: ReminderSchedule[] = [];
    const errors: string[] = [];

    for (const scheduleConfig of schedules) {
      try {
        // Check if schedule already exists for these trigger days
        const exists = await this.reminderScheduleRepository.existsForEventAndTriggerDays(
          eventId, 
          scheduleConfig.triggerDays
        );

        if (exists) {
          errors.push(`Reminder schedule for ${scheduleConfig.triggerDays} days already exists`);
          continue;
        }

        // Validate the schedule configuration
        const scheduleInput: ReminderScheduleInput = {
          eventId,
          triggerDays: scheduleConfig.triggerDays,
          messageTemplate: scheduleConfig.messageTemplate,
          isActive: scheduleConfig.isActive !== undefined ? scheduleConfig.isActive : true
        };

        const validation = ReminderScheduleModel.validate(scheduleInput);
        if (!validation.isValid) {
          errors.push(`Invalid schedule for ${scheduleConfig.triggerDays} days: ${validation.errors.join(', ')}`);
          continue;
        }

        // Create the reminder schedule
        const sanitizedInput = ReminderScheduleModel.sanitize(scheduleInput);
        const schedule = await this.reminderScheduleRepository.create(sanitizedInput);
        createdSchedules.push(schedule);

        logger.info(`Created reminder schedule for event ${eventId}, trigger days: ${scheduleConfig.triggerDays}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create schedule for ${scheduleConfig.triggerDays} days: ${errorMessage}`);
        logger.error(`Error creating reminder schedule:`, error);
      }
    }

    if (errors.length > 0) {
      logger.warn(`Reminder configuration completed with errors:`, errors);
    }

    return createdSchedules;
  }

  /**
   * Get reminder schedules for an event
   */
  async getReminderSchedules(eventId: string): Promise<ReminderSchedule[]> {
    return await this.reminderScheduleRepository.findByEventId(eventId);
  }

  /**
   * Update a reminder schedule
   */
  async updateReminderSchedule(scheduleId: string, update: ReminderScheduleUpdate): Promise<ReminderSchedule | null> {
    const validation = ReminderScheduleModel.validateUpdate(update);
    if (!validation.isValid) {
      throw new Error(`Invalid update: ${validation.errors.join(', ')}`);
    }

    return await this.reminderScheduleRepository.update(scheduleId, update);
  }

  /**
   * Delete a reminder schedule
   */
  async deleteReminderSchedule(scheduleId: string): Promise<boolean> {
    // Also delete associated executions
    await this.reminderExecutionRepository.deleteByReminderScheduleId(scheduleId);
    return await this.reminderScheduleRepository.delete(scheduleId);
  }

  /**
   * Execute all due reminder schedules
   */
  async executeScheduledReminders(): Promise<ReminderExecutionResult[]> {
    const schedulesToExecute = await this.reminderScheduleRepository.findSchedulesToExecute();
    
    if (schedulesToExecute.length === 0) {
      logger.info('No reminder schedules due for execution');
      return [];
    }

    logger.info(`Found ${schedulesToExecute.length} reminder schedules to execute`);
    
    const results: ReminderExecutionResult[] = [];

    for (const schedule of schedulesToExecute) {
      try {
        const result = await this.executeReminderSchedule(schedule);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to execute reminder schedule ${schedule.id}:`, error);
        
        // Record the failed execution
        const errorResult: ReminderExecutionResult = {
          reminderScheduleId: schedule.id,
          eventId: schedule.eventId,
          guestsProcessed: 0,
          remindersScheduled: 0,
          remindersSkipped: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          executionId: ''
        };

        try {
          const execution = await this.reminderExecutionRepository.create({
            reminderScheduleId: schedule.id,
            eventId: schedule.eventId,
            guestsProcessed: 0,
            remindersScheduled: 0,
            remindersSkipped: 0,
            errors: errorResult.errors
          });
          errorResult.executionId = execution.id;
        } catch (recordError) {
          logger.error('Failed to record failed execution:', recordError);
        }

        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Execute a specific reminder schedule
   */
  async executeReminderSchedule(schedule: ReminderSchedule): Promise<ReminderExecutionResult> {
    logger.info(`Executing reminder schedule ${schedule.id} for event ${schedule.eventId}`);

    // Get event details
    const event = await this.eventRepository.findById(schedule.eventId);
    if (!event) {
      throw new Error(`Event ${schedule.eventId} not found`);
    }

    // Get guests who haven't responded yet
    const allGuests = await this.guestRepository.findByEventId(schedule.eventId);
    const pendingGuests = allGuests.filter(guest => 
      guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response'
    );

    let guestsProcessed = 0;
    let remindersScheduled = 0;
    let remindersSkipped = 0;
    const errors: string[] = [];

    // Process each pending guest
    for (const guest of pendingGuests) {
      guestsProcessed++;

      try {
        // Check if guest already received a reminder today
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const allReminders = await this.messageRepository.findWithFilters({
          eventId: schedule.eventId,
          recipientId: guest.id,
          messageType: 'reminder'
        });
        
        const todayReminders = allReminders.filter(msg => 
          msg.createdAt >= todayStart
        );

        if (todayReminders.length > 0) {
          remindersSkipped++;
          logger.debug(`Skipping reminder for guest ${guest.name} - already sent today`);
          continue;
        }

        // Send reminder
        await this.messagingService.sendReminder(guest.id, schedule.eventId, schedule.messageTemplate);
        remindersScheduled++;
        
        logger.debug(`Scheduled reminder for guest ${guest.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to send reminder to ${guest.name}: ${errorMessage}`);
        logger.error(`Error sending reminder to guest ${guest.id}:`, error);
      }

      // Add small delay to avoid overwhelming the system
      await this.delay(100);
    }

    // Record the execution
    const execution = await this.reminderExecutionRepository.create({
      reminderScheduleId: schedule.id,
      eventId: schedule.eventId,
      guestsProcessed,
      remindersScheduled,
      remindersSkipped,
      errors
    });

    const result: ReminderExecutionResult = {
      reminderScheduleId: schedule.id,
      eventId: schedule.eventId,
      guestsProcessed,
      remindersScheduled,
      remindersSkipped,
      errors,
      executionId: execution.id
    };

    logger.info(`Completed reminder execution ${execution.id}: ${remindersScheduled} scheduled, ${remindersSkipped} skipped, ${errors.length} errors`);
    
    return result;
  }

  /**
   * Stop reminders for a guest who has responded
   */
  async stopRemindersForGuest(guestId: string, eventId: string): Promise<void> {
    // This is handled automatically by the executeReminderSchedule method
    // which only sends reminders to guests with pending/no_response status
    logger.info(`Reminders will be automatically stopped for guest ${guestId} due to RSVP response`);
  }

  /**
   * Get reminder status for an event
   */
  async getReminderStatus(eventId: string): Promise<ReminderStatus> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const allGuests = await this.guestRepository.findByEventId(eventId);
    const pendingGuests = allGuests.filter(guest => 
      guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response'
    );

    const activeSchedules = await this.reminderScheduleRepository.findActiveByEventId(eventId);
    const executionStats = await this.reminderExecutionRepository.getExecutionStatistics(eventId);

    // Calculate next reminder date
    let nextReminderDate: Date | undefined;
    if (activeSchedules.length > 0 && event.rsvpDeadline > new Date()) {
      const now = new Date();
      const deadlineTime = event.rsvpDeadline.getTime();
      
      for (const schedule of activeSchedules) {
        const triggerTime = deadlineTime - (schedule.triggerDays * 24 * 60 * 60 * 1000);
        const triggerDate = new Date(triggerTime);
        
        if (triggerDate > now) {
          if (!nextReminderDate || triggerDate < nextReminderDate) {
            nextReminderDate = triggerDate;
          }
        }
      }
    }

    // Get total reminders sent from message repository
    const reminderMessages = await this.messageRepository.findWithFilters({
      eventId,
      messageType: 'reminder'
    });

    const sentReminders = reminderMessages.filter(msg => 
      msg.deliveryStatus === 'sent' || msg.deliveryStatus === 'delivered'
    );

    return {
      eventId,
      eventTitle: event.title,
      rsvpDeadline: event.rsvpDeadline,
      totalGuests: allGuests.length,
      pendingGuests: pendingGuests.length,
      activeSchedules: activeSchedules.length,
      nextReminderDate,
      lastExecutionDate: executionStats.lastExecutionDate,
      totalRemindersScheduled: executionStats.totalRemindersScheduled,
      totalRemindersSent: sentReminders.length
    };
  }

  /**
   * Get reminder execution history for an event
   */
  async getReminderExecutions(eventId: string): Promise<ReminderExecution[]> {
    return await this.reminderExecutionRepository.findByEventId(eventId);
  }

  /**
   * Create default reminder schedules for an event
   */
  async createDefaultReminders(eventId: string): Promise<ReminderSchedule[]> {
    const defaultTemplate = ReminderScheduleModel.getDefaultTemplate();
    
    const defaultSchedules = [
      { triggerDays: 14, messageTemplate: defaultTemplate },
      { triggerDays: 7, messageTemplate: defaultTemplate },
      { triggerDays: 3, messageTemplate: defaultTemplate }
    ];

    return await this.configureReminders({
      eventId,
      schedules: defaultSchedules
    });
  }

  /**
   * Activate or deactivate a reminder schedule
   */
  async setReminderScheduleActive(scheduleId: string, isActive: boolean): Promise<ReminderSchedule | null> {
    return await this.reminderScheduleRepository.setActive(scheduleId, isActive);
  }

  /**
   * Get reminder statistics for an event
   */
  async getReminderStatistics(eventId: string): Promise<{
    scheduleStats: any;
    executionStats: any;
    messageStats: any;
  }> {
    const [scheduleStats, executionStats] = await Promise.all([
      this.reminderScheduleRepository.getStatistics(eventId),
      this.reminderExecutionRepository.getExecutionStatistics(eventId)
    ]);

    // Get message statistics for reminders
    const reminderMessages = await this.messageRepository.findWithFilters({
      eventId,
      messageType: 'reminder'
    });

    const messageStats = {
      totalReminderMessages: reminderMessages.length,
      sentReminders: reminderMessages.filter(m => m.deliveryStatus === 'sent').length,
      deliveredReminders: reminderMessages.filter(m => m.deliveryStatus === 'delivered').length,
      failedReminders: reminderMessages.filter(m => m.deliveryStatus === 'failed').length,
      pendingReminders: reminderMessages.filter(m => m.deliveryStatus === 'pending').length
    };

    return {
      scheduleStats,
      executionStats,
      messageStats
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}