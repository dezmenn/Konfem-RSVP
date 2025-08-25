"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const RSVPService_1 = require("./RSVPService");
const MessageRepository_1 = require("../repositories/MessageRepository");
const GuestRepository_1 = require("../repositories/GuestRepository");
const EventRepository_1 = require("../repositories/EventRepository");
const InvitationTemplateRepository_1 = require("../repositories/InvitationTemplateRepository");
const logger_1 = require("../utils/logger");
class MessagingService {
    constructor(whatsAppService) {
        this.bulkProgressTrackers = new Map();
        this.whatsAppService = whatsAppService;
        this.rsvpService = new RSVPService_1.RSVPService();
        this.messageRepository = new MessageRepository_1.MessageRepository();
        this.guestRepository = new GuestRepository_1.GuestRepository();
        this.eventRepository = new EventRepository_1.EventRepository();
        this.invitationTemplateRepository = new InvitationTemplateRepository_1.InvitationTemplateRepository();
    }
    /**
     * Send bulk invitations to multiple guests
     */
    async sendBulkInvitations(request) {
        const { eventId, guestIds, templateId, scheduledAt } = request;
        // Validate event exists
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        // Get guests
        const guests = await Promise.all(guestIds.map(id => this.guestRepository.findById(id)));
        const validGuests = guests.filter((guest) => guest !== null);
        if (validGuests.length === 0) {
            throw new Error('No valid guests found');
        }
        // Get invitation template
        let template;
        if (templateId) {
            const foundTemplate = await this.invitationTemplateRepository.findById(templateId);
            if (!foundTemplate) {
                throw new Error('Invitation template not found');
            }
            template = foundTemplate;
        }
        else {
            template = await this.rsvpService.getDefaultInvitationTemplate(eventId);
        }
        // Generate unique tracking ID for this bulk operation
        const trackingId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Initialize progress tracker
        const progress = {
            totalGuests: validGuests.length,
            processedGuests: 0,
            successfulSends: 0,
            failedSends: 0,
            isComplete: false,
            errors: []
        };
        this.bulkProgressTrackers.set(trackingId, progress);
        // Process invitations asynchronously
        this.processBulkInvitations(trackingId, validGuests, event, template, scheduledAt)
            .catch(error => {
            logger_1.logger.error('Error in bulk invitation processing:', error);
            progress.isComplete = true;
        });
        logger_1.logger.info(`Started bulk invitation sending for ${validGuests.length} guests, tracking ID: ${trackingId}`);
        return trackingId;
    }
    /**
     * Get progress of bulk invitation sending
     */
    getBulkInvitationProgress(trackingId) {
        return this.bulkProgressTrackers.get(trackingId) || null;
    }
    /**
     * Send individual invitation
     */
    async sendInvitation(guestId, eventId, templateId) {
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        let template;
        if (templateId) {
            const foundTemplate = await this.invitationTemplateRepository.findById(templateId);
            if (!foundTemplate) {
                throw new Error('Invitation template not found');
            }
            template = foundTemplate;
        }
        else {
            template = await this.rsvpService.getDefaultInvitationTemplate(eventId);
        }
        return await this.sendPersonalizedMessage(guest, event, template, 'invitation');
    }
    /**
     * Send reminder message
     */
    async sendReminder(guestId, eventId, reminderContent) {
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        // For reminders, we'll use the content directly instead of a template
        // since reminders are simple text messages
        const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, eventId);
        const personalizedContent = this.personalizeContent(reminderContent, guest, event, rsvpLink);
        // Create message record
        const messageData = {
            eventId: event.id,
            recipientId: guest.id,
            content: personalizedContent,
            messageType: 'reminder'
        };
        const message = await this.messageRepository.create(messageData);
        // Send via WhatsApp
        const result = await this.whatsAppService.sendMessage(guest.phoneNumber, personalizedContent, message.id);
        if (!result.success) {
            logger_1.logger.warn(`Failed to send reminder to ${guest.name}: ${result.error}`);
        }
        return message;
    }
    /**
     * Schedule messages for later delivery
     */
    async scheduleMessages(request) {
        const { eventId, guestIds, messageType, content, scheduledAt } = request;
        if (scheduledAt <= new Date()) {
            throw new Error('Scheduled time must be in the future');
        }
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        const guests = await Promise.all(guestIds.map(id => this.guestRepository.findById(id)));
        const validGuests = guests.filter((guest) => guest !== null);
        if (validGuests.length === 0) {
            throw new Error('No valid guests found');
        }
        const scheduledMessages = [];
        for (const guest of validGuests) {
            const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, eventId);
            const personalizedContent = this.personalizeContent(content, guest, event, rsvpLink);
            const messageData = {
                eventId,
                recipientId: guest.id,
                content: personalizedContent,
                messageType,
                scheduledAt
            };
            const message = await this.messageRepository.create(messageData);
            scheduledMessages.push(message);
        }
        logger_1.logger.info(`Scheduled ${scheduledMessages.length} messages for ${scheduledAt.toISOString()}`);
        return scheduledMessages;
    }
    /**
     * Process scheduled messages that are due
     */
    async processScheduledMessages() {
        const dueMessages = await this.messageRepository.findScheduledMessages(new Date());
        if (dueMessages.length === 0) {
            return;
        }
        logger_1.logger.info(`Processing ${dueMessages.length} scheduled messages`);
        for (const message of dueMessages) {
            try {
                const guest = await this.guestRepository.findById(message.recipientId);
                if (!guest) {
                    await this.messageRepository.markAsFailed(message.id);
                    continue;
                }
                const result = await this.whatsAppService.sendMessage(guest.phoneNumber, message.content, message.id);
                if (!result.success) {
                    logger_1.logger.warn(`Failed to send scheduled message ${message.id}: ${result.error}`);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error processing scheduled message ${message.id}:`, error);
                await this.messageRepository.markAsFailed(message.id);
            }
        }
    }
    /**
     * Get message delivery statistics for an event
     */
    async getMessageStatistics(eventId) {
        const messages = await this.messageRepository.findByEventId(eventId);
        const stats = await this.messageRepository.getMessageStats(eventId);
        const deliveryStats = await this.messageRepository.getDeliveryStatusSummary(eventId);
        const totalMessages = messages.length;
        const sentMessages = deliveryStats.sent || 0;
        const deliveredMessages = deliveryStats.delivered || 0;
        const failedMessages = deliveryStats.failed || 0;
        const pendingMessages = deliveryStats.pending || 0;
        const deliveryRate = sentMessages + deliveredMessages > 0
            ? (deliveredMessages / (sentMessages + deliveredMessages)) * 100
            : 0;
        const messageTypeBreakdown = {};
        messages.forEach(message => {
            messageTypeBreakdown[message.messageType] = (messageTypeBreakdown[message.messageType] || 0) + 1;
        });
        return {
            totalMessages,
            sentMessages,
            deliveredMessages,
            failedMessages,
            pendingMessages,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            messageTypeBreakdown
        };
    }
    /**
     * Retry failed messages
     */
    async retryFailedMessages(eventId) {
        const failedMessages = await this.messageRepository.findWithFilters({
            eventId,
            deliveryStatus: 'failed'
        });
        let retriedCount = 0;
        for (const message of failedMessages) {
            try {
                const guest = await this.guestRepository.findById(message.recipientId);
                if (!guest) {
                    continue;
                }
                // Reset message status to pending
                await this.messageRepository.update(message.id, {
                    deliveryStatus: 'pending'
                });
                const result = await this.whatsAppService.sendMessage(guest.phoneNumber, message.content, message.id);
                if (result.success) {
                    retriedCount++;
                }
            }
            catch (error) {
                logger_1.logger.error(`Error retrying message ${message.id}:`, error);
            }
        }
        logger_1.logger.info(`Retried ${retriedCount} failed messages for event ${eventId}`);
        return retriedCount;
    }
    /**
     * Private method to process bulk invitations
     */
    async processBulkInvitations(trackingId, guests, event, template, scheduledAt) {
        const progress = this.bulkProgressTrackers.get(trackingId);
        for (const guest of guests) {
            progress.currentGuestName = guest.name;
            try {
                if (scheduledAt) {
                    // Schedule the message
                    const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, event.id);
                    // For now, use a simple template content since the InvitationTemplate structure has changed
                    const templateContent = `Hi {{guestName}}, you're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP: {{rsvpLink}}`;
                    const personalizedContent = this.personalizeContent(templateContent, guest, event, rsvpLink);
                    const messageData = {
                        eventId: event.id,
                        recipientId: guest.id,
                        content: personalizedContent,
                        messageType: 'invitation',
                        scheduledAt
                    };
                    await this.messageRepository.create(messageData);
                    progress.successfulSends++;
                }
                else {
                    // Send immediately
                    await this.sendPersonalizedMessage(guest, event, template, 'invitation');
                    progress.successfulSends++;
                }
            }
            catch (error) {
                progress.failedSends++;
                progress.errors.push({
                    guestId: guest.id,
                    guestName: guest.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                logger_1.logger.error(`Failed to send invitation to ${guest.name}:`, error);
            }
            progress.processedGuests++;
            // Add small delay between messages to avoid overwhelming the system
            await this.delay(100);
        }
        progress.isComplete = true;
        progress.currentGuestName = undefined;
        logger_1.logger.info(`Bulk invitation processing completed. Success: ${progress.successfulSends}, Failed: ${progress.failedSends}`);
    }
    /**
     * Private method to send personalized message
     */
    async sendPersonalizedMessage(guest, event, template, messageType) {
        const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, event.id);
        // For now, use a simple template content since the InvitationTemplate structure has changed
        const templateContent = `Hi {{guestName}}, you're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP: {{rsvpLink}}`;
        const personalizedContent = this.personalizeContent(templateContent, guest, event, rsvpLink);
        // Create message record
        const messageData = {
            eventId: event.id,
            recipientId: guest.id,
            content: personalizedContent,
            messageType
        };
        const message = await this.messageRepository.create(messageData);
        // Send via WhatsApp
        const result = await this.whatsAppService.sendMessage(guest.phoneNumber, personalizedContent, message.id);
        if (!result.success) {
            logger_1.logger.warn(`Failed to send ${messageType} to ${guest.name}: ${result.error}`);
        }
        return message;
    }
    /**
     * Private method to personalize message content
     */
    personalizeContent(content, guest, event, rsvpLink) {
        const personalizationData = {
            guestName: guest.name,
            eventTitle: event.title,
            eventDate: event.date.toLocaleDateString(),
            eventTime: event.date.toLocaleTimeString(),
            eventLocation: event.location,
            rsvpDeadline: event.rsvpDeadline.toLocaleDateString(),
            rsvpLink,
            organizerName: 'Event Organizer' // TODO: Add organizer name to event model
        };
        return content
            .replace(/\{\{guestName\}\}/g, personalizationData.guestName)
            .replace(/\{\{eventTitle\}\}/g, personalizationData.eventTitle)
            .replace(/\{\{eventDate\}\}/g, personalizationData.eventDate)
            .replace(/\{\{eventTime\}\}/g, personalizationData.eventTime)
            .replace(/\{\{eventLocation\}\}/g, personalizationData.eventLocation)
            .replace(/\{\{rsvpDeadline\}\}/g, personalizationData.rsvpDeadline)
            .replace(/\{\{rsvpLink\}\}/g, personalizationData.rsvpLink)
            .replace(/\{\{organizerName\}\}/g, personalizationData.organizerName);
    }
    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Send bulk reminders to multiple guests
     */
    async sendBulkReminders(eventId, reminders) {
        const messages = reminders.map(reminder => ({
            to: reminder.phone,
            content: reminder.content,
            messageId: reminder.messageId
        }));
        // Send bulk messages via WhatsApp service
        const bulkResult = await this.whatsAppService.sendBulkMessages(messages);
        // Store message records in the database
        for (const reminder of reminders) {
            try {
                const messageData = {
                    eventId,
                    recipientId: reminder.guestId,
                    content: reminder.content,
                    messageType: 'reminder'
                };
                await this.messageRepository.create(messageData);
            }
            catch (error) {
                logger_1.logger.error(`Failed to store reminder message record for guest ${reminder.guestId}:`, error);
            }
        }
        logger_1.logger.info(`Bulk reminders sent: ${bulkResult.successfulSends} successful, ${bulkResult.failedSends} failed`);
        return {
            successfulSends: bulkResult.successfulSends,
            failedSends: bulkResult.failedSends,
            results: bulkResult.results
        };
    }
    /**
     * Clean up completed bulk operation trackers
     */
    cleanupCompletedTrackers() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        for (const [trackingId, progress] of this.bulkProgressTrackers.entries()) {
            if (progress.isComplete) {
                // Remove trackers that have been complete for more than 24 hours
                // This is a simple cleanup - in production you might want more sophisticated logic
                this.bulkProgressTrackers.delete(trackingId);
            }
        }
    }
}
exports.MessagingService = MessagingService;
//# sourceMappingURL=MessagingService.js.map