"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const ReminderScheduleRepository_1 = require("../repositories/ReminderScheduleRepository");
const ReminderExecutionRepository_1 = require("../repositories/ReminderExecutionRepository");
const GuestRepository_1 = require("../repositories/GuestRepository");
const EventRepository_1 = require("../repositories/EventRepository");
const MessageRepository_1 = require("../repositories/MessageRepository");
const RSVPService_1 = require("./RSVPService");
const MockReminderScheduleRepository_1 = require("./MockReminderScheduleRepository");
const MockReminderExecutionRepository_1 = require("./MockReminderExecutionRepository");
const MockMessageRepository_1 = require("./MockMessageRepository");
const ReminderSchedule_1 = require("../models/ReminderSchedule");
const logger_1 = require("../utils/logger");
class ReminderService {
    constructor(messagingService, mockEventService, mockGuestService) {
        // Use mock repositories in demo mode
        const isDemo = process.env.SKIP_DB_SETUP === 'true';
        if (isDemo) {
            this.reminderScheduleRepository = new MockReminderScheduleRepository_1.MockReminderScheduleRepository();
            this.reminderExecutionRepository = new MockReminderExecutionRepository_1.MockReminderExecutionRepository();
            this.messageRepository = new MockMessageRepository_1.MockMessageRepository();
        }
        else {
            this.reminderScheduleRepository = new ReminderScheduleRepository_1.ReminderScheduleRepository();
            this.reminderExecutionRepository = new ReminderExecutionRepository_1.ReminderExecutionRepository();
            this.messageRepository = new MessageRepository_1.MessageRepository();
        }
        this.guestRepository = mockGuestService || new GuestRepository_1.GuestRepository();
        this.eventRepository = mockEventService || new EventRepository_1.EventRepository();
        this.rsvpService = new RSVPService_1.RSVPService();
        this.messagingService = messagingService;
    }
    /**
     * Execute reminders for a specific schedule
     */
    async executeReminders(scheduleId) {
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
        const pendingGuests = allGuests.filter(guest => guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response');
        const executionId = `exec-${Date.now()}`;
        const errors = [];
        let remindersScheduled = 0;
        let remindersSkipped = 0;
        // Prepare messages for bulk sending
        const messages = [];
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to prepare reminder for ${guest.name}: ${errorMessage}`);
                remindersSkipped++;
            }
        }
        // Send bulk messages via WhatsApp
        if (messages.length > 0) {
            try {
                const bulkResult = await this.messagingService.sendBulkReminders(schedule.eventId, messages.map(msg => ({
                    guestId: pendingGuests.find(g => g.phoneNumber === msg.to)?.id || '',
                    phone: msg.to,
                    content: msg.content,
                    messageId: msg.messageId
                })));
                logger_1.logger.info(`Bulk reminder execution completed`, {
                    scheduleId,
                    eventId: schedule.eventId,
                    totalMessages: messages.length,
                    successful: bulkResult.successfulSends,
                    failed: bulkResult.failedSends
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to send bulk reminders: ${errorMessage}`);
                logger_1.logger.error('Bulk reminder sending failed:', error);
            }
        }
        const result = {
            reminderScheduleId: scheduleId,
            eventId: schedule.eventId,
            guestsProcessed: pendingGuests.length,
            remindersScheduled,
            remindersSkipped,
            errors,
            executionId
        };
        logger_1.logger.info(`Reminder execution completed for schedule ${scheduleId}`, result);
        return result;
    }
    /**
     * Execute all active reminders for an event
     */
    async executeAllReminders(eventId) {
        const activeSchedules = await this.reminderScheduleRepository.findActiveByEventId(eventId);
        const results = [];
        for (const schedule of activeSchedules) {
            try {
                const result = await this.executeReminders(schedule.id);
                results.push(result);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.error(`Failed to execute reminder schedule ${schedule.id}:`, error);
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
    async configureReminders(config) {
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
        const createdSchedules = [];
        const errors = [];
        for (const scheduleConfig of schedules) {
            try {
                // Check if schedule already exists for these trigger days
                const exists = await this.reminderScheduleRepository.existsForEventAndTriggerDays(eventId, scheduleConfig.triggerDays);
                if (exists) {
                    errors.push(`Reminder schedule for ${scheduleConfig.triggerDays} days already exists`);
                    continue;
                }
                // Validate the schedule configuration
                const scheduleInput = {
                    eventId,
                    triggerDays: scheduleConfig.triggerDays,
                    messageTemplate: scheduleConfig.messageTemplate,
                    isActive: scheduleConfig.isActive !== undefined ? scheduleConfig.isActive : true
                };
                const validation = ReminderSchedule_1.ReminderScheduleModel.validate(scheduleInput);
                if (!validation.isValid) {
                    errors.push(`Invalid schedule for ${scheduleConfig.triggerDays} days: ${validation.errors.join(', ')}`);
                    continue;
                }
                // Create the reminder schedule
                const sanitizedInput = ReminderSchedule_1.ReminderScheduleModel.sanitize(scheduleInput);
                const schedule = await this.reminderScheduleRepository.create(sanitizedInput);
                createdSchedules.push(schedule);
                logger_1.logger.info(`Created reminder schedule for event ${eventId}, trigger days: ${scheduleConfig.triggerDays}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to create schedule for ${scheduleConfig.triggerDays} days: ${errorMessage}`);
                logger_1.logger.error(`Error creating reminder schedule:`, error);
            }
        }
        if (errors.length > 0) {
            logger_1.logger.warn(`Reminder configuration completed with errors:`, errors);
        }
        return createdSchedules;
    }
    /**
     * Get reminder schedules for an event
     */
    async getReminderSchedules(eventId) {
        return await this.reminderScheduleRepository.findByEventId(eventId);
    }
    /**
     * Update a reminder schedule
     */
    async updateReminderSchedule(scheduleId, update) {
        const validation = ReminderSchedule_1.ReminderScheduleModel.validateUpdate(update);
        if (!validation.isValid) {
            throw new Error(`Invalid update: ${validation.errors.join(', ')}`);
        }
        return await this.reminderScheduleRepository.update(scheduleId, update);
    }
    /**
     * Delete a reminder schedule
     */
    async deleteReminderSchedule(scheduleId) {
        // Also delete associated executions
        await this.reminderExecutionRepository.deleteByReminderScheduleId(scheduleId);
        return await this.reminderScheduleRepository.delete(scheduleId);
    }
    /**
     * Execute all due reminder schedules
     */
    async executeScheduledReminders() {
        const schedulesToExecute = await this.reminderScheduleRepository.findSchedulesToExecute();
        if (schedulesToExecute.length === 0) {
            logger_1.logger.info('No reminder schedules due for execution');
            return [];
        }
        logger_1.logger.info(`Found ${schedulesToExecute.length} reminder schedules to execute`);
        const results = [];
        for (const schedule of schedulesToExecute) {
            try {
                const result = await this.executeReminderSchedule(schedule);
                results.push(result);
            }
            catch (error) {
                logger_1.logger.error(`Failed to execute reminder schedule ${schedule.id}:`, error);
                // Record the failed execution
                const errorResult = {
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
                }
                catch (recordError) {
                    logger_1.logger.error('Failed to record failed execution:', recordError);
                }
                results.push(errorResult);
            }
        }
        return results;
    }
    /**
     * Execute a specific reminder schedule
     */
    async executeReminderSchedule(schedule) {
        logger_1.logger.info(`Executing reminder schedule ${schedule.id} for event ${schedule.eventId}`);
        // Get event details
        const event = await this.eventRepository.findById(schedule.eventId);
        if (!event) {
            throw new Error(`Event ${schedule.eventId} not found`);
        }
        // Get guests who haven't responded yet
        const allGuests = await this.guestRepository.findByEventId(schedule.eventId);
        const pendingGuests = allGuests.filter(guest => guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response');
        let guestsProcessed = 0;
        let remindersScheduled = 0;
        let remindersSkipped = 0;
        const errors = [];
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
                const todayReminders = allReminders.filter(msg => msg.createdAt >= todayStart);
                if (todayReminders.length > 0) {
                    remindersSkipped++;
                    logger_1.logger.debug(`Skipping reminder for guest ${guest.name} - already sent today`);
                    continue;
                }
                // Send reminder
                await this.messagingService.sendReminder(guest.id, schedule.eventId, schedule.messageTemplate);
                remindersScheduled++;
                logger_1.logger.debug(`Scheduled reminder for guest ${guest.name}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to send reminder to ${guest.name}: ${errorMessage}`);
                logger_1.logger.error(`Error sending reminder to guest ${guest.id}:`, error);
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
        const result = {
            reminderScheduleId: schedule.id,
            eventId: schedule.eventId,
            guestsProcessed,
            remindersScheduled,
            remindersSkipped,
            errors,
            executionId: execution.id
        };
        logger_1.logger.info(`Completed reminder execution ${execution.id}: ${remindersScheduled} scheduled, ${remindersSkipped} skipped, ${errors.length} errors`);
        return result;
    }
    /**
     * Stop reminders for a guest who has responded
     */
    async stopRemindersForGuest(guestId, eventId) {
        // This is handled automatically by the executeReminderSchedule method
        // which only sends reminders to guests with pending/no_response status
        logger_1.logger.info(`Reminders will be automatically stopped for guest ${guestId} due to RSVP response`);
    }
    /**
     * Get reminder status for an event
     */
    async getReminderStatus(eventId) {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        const allGuests = await this.guestRepository.findByEventId(eventId);
        const pendingGuests = allGuests.filter(guest => guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response');
        const activeSchedules = await this.reminderScheduleRepository.findActiveByEventId(eventId);
        const executionStats = await this.reminderExecutionRepository.getExecutionStatistics(eventId);
        // Calculate next reminder date
        let nextReminderDate;
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
        const sentReminders = reminderMessages.filter(msg => msg.deliveryStatus === 'sent' || msg.deliveryStatus === 'delivered');
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
    async getReminderExecutions(eventId) {
        return await this.reminderExecutionRepository.findByEventId(eventId);
    }
    /**
     * Create default reminder schedules for an event
     */
    async createDefaultReminders(eventId) {
        const defaultTemplate = ReminderSchedule_1.ReminderScheduleModel.getDefaultTemplate();
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
    async setReminderScheduleActive(scheduleId, isActive) {
        return await this.reminderScheduleRepository.setActive(scheduleId, isActive);
    }
    /**
     * Get reminder statistics for an event
     */
    async getReminderStatistics(eventId) {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=ReminderService.js.map