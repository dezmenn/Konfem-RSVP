import { InvitationScheduleRepository } from '../repositories/InvitationScheduleRepository';
import { InvitationExecutionRepository } from '../repositories/InvitationExecutionRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { EventRepository } from '../repositories/EventRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { RSVPService } from './RSVPService';
import { MessagingService } from './MessagingService';
import { MockInvitationScheduleRepository } from './MockInvitationScheduleRepository';
import { MockInvitationExecutionRepository } from './MockInvitationExecutionRepository';
import { MockMessageRepository } from './MockMessageRepository';
import { InvitationSchedule, InvitationExecution, Guest, Event } from '../../../shared/src/types';
import { InvitationScheduleInput, InvitationScheduleUpdate, InvitationScheduleModel } from '../models/InvitationSchedule';
import { logger } from '../utils/logger';

export interface InvitationConfiguration {
  eventId: string;
  schedules: Array<{
    triggerDays: number;
    messageTemplate: string;
    isActive?: boolean;
  }>;
}

export interface InvitationExecutionResult {
  invitationScheduleId: string;
  eventId: string;
  guestsProcessed: number;
  invitationsScheduled: number;
  invitationsSkipped: number;
  errors: string[];
  executionId: string;
}

export interface InvitationStatus {
  eventId: string;
  eventTitle: string;
  rsvpDeadline: Date;
  totalGuests: number;
  notInvitedGuests: number;
  pendingGuests: number;
  activeSchedules: number;
  nextInvitationDate?: Date;
  lastExecutionDate?: Date;
  totalInvitationsScheduled: number;
  totalInvitationsSent: number;
}

export interface BulkInvitationResult {
  guestsInvited: number;
  invitationsSent: number;
  invitationsSkipped: number;
  errors: string[];
}

export class InvitationService {
  private invitationScheduleRepository: InvitationScheduleRepository;
  private invitationExecutionRepository: InvitationExecutionRepository;
  private guestRepository: GuestRepository;
  private eventRepository: EventRepository;
  private messageRepository: MessageRepository;
  private rsvpService: RSVPService;
  private messagingService: MessagingService;

  constructor(messagingService: MessagingService, mockEventService?: any, mockGuestService?: any) {
    // Use mock repositories in demo mode
    const isDemo = process.env.SKIP_DB_SETUP === 'true';
    
    if (isDemo) {
      this.invitationScheduleRepository = new MockInvitationScheduleRepository() as unknown as InvitationScheduleRepository;
      this.invitationExecutionRepository = new MockInvitationExecutionRepository() as unknown as InvitationExecutionRepository;
      this.messageRepository = new MockMessageRepository() as unknown as MessageRepository;
    } else {
      this.invitationScheduleRepository = new InvitationScheduleRepository();
      this.invitationExecutionRepository = new InvitationExecutionRepository();
      this.messageRepository = new MessageRepository();
    }
    
    this.guestRepository = mockGuestService || new GuestRepository();
    this.eventRepository = mockEventService || new EventRepository();
    this.rsvpService = new RSVPService();
    this.messagingService = messagingService;
  }

  /**
   * Send bulk invitations to all uninvited guests
   */
  async sendBulkInvitations(eventId: string): Promise<BulkInvitationResult> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all guests who haven't been invited yet
    const allGuests = await this.guestRepository.findByEventId(eventId);
    const uninvitedGuests = allGuests.filter(guest => guest.rsvpStatus === 'not_invited');

    if (uninvitedGuests.length === 0) {
      return {
        guestsInvited: 0,
        invitationsSent: 0,
        invitationsSkipped: 0,
        errors: []
      };
    }

    const errors: string[] = [];
    let invitationsSent = 0;
    let invitationsSkipped = 0;

    // Use default invitation template
    const defaultTemplate = InvitationScheduleModel.getDefaultTemplate();

    // Prepare messages for bulk sending
    const messages: Array<{ to: string; content: string; messageId: string }> = [];

    for (const guest of uninvitedGuests) {
      try {
        if (!guest.phoneNumber) {
          errors.push(`Guest ${guest.name} has no phone number`);
          invitationsSkipped++;
          continue;
        }

        // Replace template variables in the message
        const messageContent = InvitationScheduleModel.replaceVariables(defaultTemplate, {
          guestName: guest.name,
          eventTitle: event.title,
          eventDate: event.date.toLocaleDateString(),
          eventTime: 'TBD',
          eventLocation: event.location || 'TBD',
          rsvpDeadline: event.rsvpDeadline.toLocaleDateString(),
          rsvpLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/rsvp/public/${event.id}`,
          organizerName: 'Event Organizer'
        });

        messages.push({
          to: guest.phoneNumber,
          content: messageContent,
          messageId: `bulk-invite-${Date.now()}-${guest.id}`
        });

        invitationsSent++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to prepare invitation for ${guest.name}: ${errorMessage}`);
        invitationsSkipped++;
      }
    }

    // Send bulk messages via WhatsApp
    if (messages.length > 0) {
      try {
        const bulkResult = await this.messagingService.sendBulkInvitations(
          eventId,
          messages.map(msg => ({
            guestId: uninvitedGuests.find(g => g.phoneNumber === msg.to)?.id || '',
            phone: msg.to,
            content: msg.content,
            messageId: msg.messageId
          }))
        );

        // Update guest RSVP status to 'pending' for successfully invited guests
        for (const guest of uninvitedGuests) {
          if (messages.some(msg => msg.to === guest.phoneNumber)) {
            try {
              await this.guestRepository.update(guest.id, { rsvpStatus: 'pending' });
            } catch (updateError) {
              logger.error(`Failed to update guest ${guest.id} status:`, updateError);
            }
          }
        }

        logger.info(`Bulk invitation execution completed`, {
          eventId,
          totalMessages: messages.length,
          successful: bulkResult.successfulSends,
          failed: bulkResult.failedSends
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to send bulk invitations: ${errorMessage}`);
        logger.error('Bulk invitation sending failed:', error);
      }
    }

    return {
      guestsInvited: uninvitedGuests.length,
      invitationsSent,
      invitationsSkipped,
      errors
    };
  }

  /**
   * Execute invitations for a specific schedule
   */
  async executeInvitations(scheduleId: string): Promise<InvitationExecutionResult> {
    const schedule = await this.invitationScheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new Error('Invitation schedule not found');
    }

    if (!schedule.isActive) {
      throw new Error('Invitation schedule is not active');
    }

    const event = await this.eventRepository.findById(schedule.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get all guests who haven't been invited yet or need reminders
    const allGuests = await this.guestRepository.findByEventId(schedule.eventId);
    const targetGuests = schedule.triggerDays === 0 
      ? allGuests.filter(guest => guest.rsvpStatus === 'not_invited')
      : allGuests.filter(guest => guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response');

    const executionId = `exec-${Date.now()}`;
    const errors: string[] = [];
    let invitationsScheduled = 0;
    let invitationsSkipped = 0;

    // Prepare messages for bulk sending
    const messages: Array<{ to: string; content: string; messageId: string }> = [];

    for (const guest of targetGuests) {
      try {
        if (!guest.phoneNumber) {
          errors.push(`Guest ${guest.name} has no phone number`);
          invitationsSkipped++;
          continue;
        }

        // Replace template variables in the message
        const messageContent = InvitationScheduleModel.replaceVariables(schedule.messageTemplate, {
          guestName: guest.name,
          eventTitle: event.title,
          eventDate: event.date.toLocaleDateString(),
          eventTime: 'TBD',
          eventLocation: event.location || 'TBD',
          rsvpDeadline: event.rsvpDeadline.toLocaleDateString(),
          rsvpLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/rsvp/public/${event.id}`,
          organizerName: 'Event Organizer'
        });

        messages.push({
          to: guest.phoneNumber,
          content: messageContent,
          messageId: `invitation-${executionId}-${guest.id}`
        });

        invitationsScheduled++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to prepare invitation for ${guest.name}: ${errorMessage}`);
        invitationsSkipped++;
      }
    }

    // Send bulk messages via WhatsApp
    if (messages.length > 0) {
      try {
        const messageType = schedule.triggerDays === 0 ? 'invitation' : 'reminder';
        const bulkResult = await this.messagingService.sendBulkMessages(
          schedule.eventId,
          messages.map(msg => ({
            guestId: targetGuests.find(g => g.phoneNumber === msg.to)?.id || '',
            phone: msg.to,
            content: msg.content,
            messageId: msg.messageId,
            messageType
          }))
        );

        // Update guest RSVP status for new invitations
        if (schedule.triggerDays === 0) {
          for (const guest of targetGuests) {
            if (guest.rsvpStatus === 'not_invited' && messages.some(msg => msg.to === guest.phoneNumber)) {
              try {
                await this.guestRepository.update(guest.id, { rsvpStatus: 'pending' });
              } catch (updateError) {
                logger.error(`Failed to update guest ${guest.id} status:`, updateError);
              }
            }
          }
        }

        logger.info(`Invitation execution completed`, {
          scheduleId,
          eventId: schedule.eventId,
          totalMessages: messages.length,
          successful: bulkResult.successfulSends,
          failed: bulkResult.failedSends
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to send bulk invitations: ${errorMessage}`);
        logger.error('Bulk invitation sending failed:', error);
      }
    }

    const result: InvitationExecutionResult = {
      invitationScheduleId: scheduleId,
      eventId: schedule.eventId,
      guestsProcessed: targetGuests.length,
      invitationsScheduled,
      invitationsSkipped,
      errors,
      executionId
    };

    logger.info(`Invitation execution completed for schedule ${scheduleId}`, result);
    return result;
  }

  /**
   * Execute all active invitations for an event
   */
  async executeAllInvitations(eventId: string): Promise<InvitationExecutionResult[]> {
    const activeSchedules = await this.invitationScheduleRepository.findActiveByEventId(eventId);
    const results: InvitationExecutionResult[] = [];

    for (const schedule of activeSchedules) {
      try {
        const result = await this.executeInvitations(schedule.id);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to execute invitation schedule ${schedule.id}:`, error);
        
        results.push({
          invitationScheduleId: schedule.id,
          eventId,
          guestsProcessed: 0,
          invitationsScheduled: 0,
          invitationsSkipped: 0,
          errors: [errorMessage],
          executionId: `failed-${Date.now()}`
        });
      }
    }

    return results;
  }

  /**
   * Configure invitation schedules for an event
   */
  async configureInvitations(config: InvitationConfiguration): Promise<InvitationSchedule[]> {
    const { eventId, schedules } = config;

    // Validate event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const createdSchedules: InvitationSchedule[] = [];
    const errors: string[] = [];

    for (const scheduleConfig of schedules) {
      try {
        // Check if schedule already exists for these trigger days
        const exists = await this.invitationScheduleRepository.existsForEventAndTriggerDays(
          eventId, 
          scheduleConfig.triggerDays
        );

        if (exists) {
          errors.push(`Invitation schedule for ${scheduleConfig.triggerDays} days already exists`);
          continue;
        }

        // Validate the schedule configuration
        const scheduleInput: InvitationScheduleInput = {
          eventId,
          triggerDays: scheduleConfig.triggerDays,
          messageTemplate: scheduleConfig.messageTemplate,
          isActive: scheduleConfig.isActive !== undefined ? scheduleConfig.isActive : true
        };

        const validation = InvitationScheduleModel.validate(scheduleInput);
        if (!validation.isValid) {
          errors.push(`Invalid schedule for ${scheduleConfig.triggerDays} days: ${validation.errors.join(', ')}`);
          continue;
        }

        // Create the invitation schedule
        const sanitizedInput = InvitationScheduleModel.sanitize(scheduleInput);
        const schedule = await this.invitationScheduleRepository.create(sanitizedInput);
        createdSchedules.push(schedule);

        logger.info(`Created invitation schedule for event ${eventId}, trigger days: ${scheduleConfig.triggerDays}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create schedule for ${scheduleConfig.triggerDays} days: ${errorMessage}`);
        logger.error(`Error creating invitation schedule:`, error);
      }
    }

    if (errors.length > 0) {
      logger.warn(`Invitation configuration completed with errors:`, errors);
    }

    return createdSchedules;
  }

  /**
   * Get invitation schedules for an event
   */
  async getInvitationSchedules(eventId: string): Promise<InvitationSchedule[]> {
    return await this.invitationScheduleRepository.findByEventId(eventId);
  }

  /**
   * Update an invitation schedule
   */
  async updateInvitationSchedule(scheduleId: string, update: InvitationScheduleUpdate): Promise<InvitationSchedule | null> {
    const validation = InvitationScheduleModel.validateUpdate(update);
    if (!validation.isValid) {
      throw new Error(`Invalid update: ${validation.errors.join(', ')}`);
    }

    return await this.invitationScheduleRepository.update(scheduleId, update);
  }

  /**
   * Delete an invitation schedule
   */
  async deleteInvitationSchedule(scheduleId: string): Promise<boolean> {
    // Also delete associated executions
    await this.invitationExecutionRepository.deleteByInvitationScheduleId(scheduleId);
    return await this.invitationScheduleRepository.delete(scheduleId);
  }

  /**
   * Execute all due invitation schedules
   */
  async executeScheduledInvitations(): Promise<InvitationExecutionResult[]> {
    const schedulesToExecute = await this.invitationScheduleRepository.findSchedulesToExecute();
    
    if (schedulesToExecute.length === 0) {
      logger.info('No invitation schedules due for execution');
      return [];
    }

    logger.info(`Found ${schedulesToExecute.length} invitation schedules to execute`);
    
    const results: InvitationExecutionResult[] = [];

    for (const schedule of schedulesToExecute) {
      try {
        const result = await this.executeInvitationSchedule(schedule);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to execute invitation schedule ${schedule.id}:`, error);
        
        // Record the failed execution
        const errorResult: InvitationExecutionResult = {
          invitationScheduleId: schedule.id,
          eventId: schedule.eventId,
          guestsProcessed: 0,
          invitationsScheduled: 0,
          invitationsSkipped: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          executionId: ''
        };

        try {
          const execution = await this.invitationExecutionRepository.create({
            invitationScheduleId: schedule.id,
            eventId: schedule.eventId,
            guestsProcessed: 0,
            invitationsScheduled: 0,
            invitationsSkipped: 0,
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
   * Execute a specific invitation schedule
   */
  async executeInvitationSchedule(schedule: InvitationSchedule): Promise<InvitationExecutionResult> {
    logger.info(`Executing invitation schedule ${schedule.id} for event ${schedule.eventId}`);

    // Get event details
    const event = await this.eventRepository.findById(schedule.eventId);
    if (!event) {
      throw new Error(`Event ${schedule.eventId} not found`);
    }

    // Get guests based on schedule type
    const allGuests = await this.guestRepository.findByEventId(schedule.eventId);
    const targetGuests = schedule.triggerDays === 0 
      ? allGuests.filter(guest => guest.rsvpStatus === 'not_invited')
      : allGuests.filter(guest => guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response');

    let guestsProcessed = 0;
    let invitationsScheduled = 0;
    let invitationsSkipped = 0;
    const errors: string[] = [];

    // Process each target guest
    for (const guest of targetGuests) {
      guestsProcessed++;

      try {
        // Check if guest already received an invitation today (for reminders)
        if (schedule.triggerDays > 0) {
          const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
          const allMessages = await this.messageRepository.findWithFilters({
            eventId: schedule.eventId,
            recipientId: guest.id,
            messageType: 'invitation'
          });
          
          const todayMessages = allMessages.filter(msg => 
            msg.createdAt >= todayStart
          );

          if (todayMessages.length > 0) {
            invitationsSkipped++;
            logger.debug(`Skipping invitation for guest ${guest.name} - already sent today`);
            continue;
          }
        }

        // Send invitation
        const messageType = schedule.triggerDays === 0 ? 'invitation' : 'reminder';
        await this.messagingService.sendInvitation(guest.id, schedule.eventId, schedule.messageTemplate, messageType);
        
        // Update guest status for new invitations
        if (schedule.triggerDays === 0 && guest.rsvpStatus === 'not_invited') {
          await this.guestRepository.update(guest.id, { rsvpStatus: 'pending' });
        }
        
        invitationsScheduled++;
        
        logger.debug(`Scheduled invitation for guest ${guest.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to send invitation to ${guest.name}: ${errorMessage}`);
        logger.error(`Error sending invitation to guest ${guest.id}:`, error);
      }

      // Add small delay to avoid overwhelming the system
      await this.delay(100);
    }

    // Record the execution
    const execution = await this.invitationExecutionRepository.create({
      invitationScheduleId: schedule.id,
      eventId: schedule.eventId,
      guestsProcessed,
      invitationsScheduled,
      invitationsSkipped,
      errors
    });

    const result: InvitationExecutionResult = {
      invitationScheduleId: schedule.id,
      eventId: schedule.eventId,
      guestsProcessed,
      invitationsScheduled,
      invitationsSkipped,
      errors,
      executionId: execution.id
    };

    logger.info(`Completed invitation execution ${execution.id}: ${invitationsScheduled} scheduled, ${invitationsSkipped} skipped, ${errors.length} errors`);
    
    return result;
  }

  /**
   * Get invitation status for an event
   */
  async getInvitationStatus(eventId: string): Promise<InvitationStatus> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const allGuests = await this.guestRepository.findByEventId(eventId);
    const notInvitedGuests = allGuests.filter(guest => guest.rsvpStatus === 'not_invited');
    const pendingGuests = allGuests.filter(guest => 
      guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response'
    );

    const activeSchedules = await this.invitationScheduleRepository.findActiveByEventId(eventId);
    const executionStats = await this.invitationExecutionRepository.getExecutionStatistics(eventId);

    // Calculate next invitation date
    let nextInvitationDate: Date | undefined;
    if (activeSchedules.length > 0 && event.rsvpDeadline > new Date()) {
      const now = new Date();
      const deadlineTime = event.rsvpDeadline.getTime();
      
      for (const schedule of activeSchedules) {
        const triggerTime = deadlineTime - (schedule.triggerDays * 24 * 60 * 60 * 1000);
        const triggerDate = new Date(triggerTime);
        
        if (triggerDate > now) {
          if (!nextInvitationDate || triggerDate < nextInvitationDate) {
            nextInvitationDate = triggerDate;
          }
        }
      }
    }

    // Get total invitations sent from message repository
    const invitationMessages = await this.messageRepository.findWithFilters({
      eventId,
      messageType: 'invitation'
    });

    const sentInvitations = invitationMessages.filter(msg => 
      msg.deliveryStatus === 'sent' || msg.deliveryStatus === 'delivered'
    );

    return {
      eventId,
      eventTitle: event.title,
      rsvpDeadline: event.rsvpDeadline,
      totalGuests: allGuests.length,
      notInvitedGuests: notInvitedGuests.length,
      pendingGuests: pendingGuests.length,
      activeSchedules: activeSchedules.length,
      nextInvitationDate,
      lastExecutionDate: executionStats.lastExecutionDate,
      totalInvitationsScheduled: executionStats.totalInvitationsScheduled,
      totalInvitationsSent: sentInvitations.length
    };
  }

  /**
   * Get invitation execution history for an event
   */
  async getInvitationExecutions(eventId: string): Promise<InvitationExecution[]> {
    return await this.invitationExecutionRepository.findByEventId(eventId);
  }

  /**
   * Create default invitation schedules for an event
   */
  async createDefaultInvitations(eventId: string): Promise<InvitationSchedule[]> {
    const defaultTemplate = InvitationScheduleModel.getDefaultTemplate();
    
    const defaultSchedules = [
      { triggerDays: 0, messageTemplate: defaultTemplate }, // Send immediately
      { triggerDays: 7, messageTemplate: defaultTemplate }, // Reminder 7 days before
      { triggerDays: 3, messageTemplate: defaultTemplate }  // Final reminder 3 days before
    ];

    return await this.configureInvitations({
      eventId,
      schedules: defaultSchedules
    });
  }

  /**
   * Activate or deactivate an invitation schedule
   */
  async setInvitationScheduleActive(scheduleId: string, isActive: boolean): Promise<InvitationSchedule | null> {
    return await this.invitationScheduleRepository.setActive(scheduleId, isActive);
  }

  /**
   * Get invitation statistics for an event
   */
  async getInvitationStatistics(eventId: string): Promise<{
    scheduleStats: any;
    executionStats: any;
    messageStats: any;
  }> {
    const [scheduleStats, executionStats] = await Promise.all([
      this.invitationScheduleRepository.getStatistics(eventId),
      this.invitationExecutionRepository.getExecutionStatistics(eventId)
    ]);

    // Get message statistics for invitations
    const invitationMessages = await this.messageRepository.findWithFilters({
      eventId,
      messageType: 'invitation'
    });

    const messageStats = {
      totalInvitationMessages: invitationMessages.length,
      sentInvitations: invitationMessages.filter(m => m.deliveryStatus === 'sent').length,
      deliveredInvitations: invitationMessages.filter(m => m.deliveryStatus === 'delivered').length,
      failedInvitations: invitationMessages.filter(m => m.deliveryStatus === 'failed').length,
      pendingInvitations: invitationMessages.filter(m => m.deliveryStatus === 'pending').length
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

// Export for backward compatibility
export const ReminderService = InvitationService;