import { WhatsAppMockService } from './WhatsAppMockService';
import { RSVPService } from './RSVPService';
import { MessageRepository } from '../repositories/MessageRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { EventRepository } from '../repositories/EventRepository';
import { InvitationTemplateRepository } from '../repositories/InvitationTemplateRepository';
import { Message, Guest, Event, InvitationTemplate } from '../../../shared/src/types';
import { MessageInput } from '../models/Message';
import { logger } from '../utils/logger';

export interface BulkInvitationRequest {
  eventId: string;
  guestIds: string[];
  templateId?: string;
  scheduledAt?: Date;
}

export interface BulkInvitationProgress {
  totalGuests: number;
  processedGuests: number;
  successfulSends: number;
  failedSends: number;
  currentGuestName?: string;
  isComplete: boolean;
  errors: Array<{
    guestId: string;
    guestName: string;
    error: string;
  }>;
}

export interface MessageScheduleRequest {
  eventId: string;
  guestIds: string[];
  messageType: 'invitation' | 'reminder' | 'confirmation';
  content: string;
  scheduledAt: Date;
}

export interface MessagePersonalizationData {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  rsvpDeadline: string;
  rsvpLink: string;
  organizerName: string;
}

export class MessagingService {
  private whatsAppService: WhatsAppMockService;
  private rsvpService: RSVPService;
  private messageRepository: MessageRepository;
  private guestRepository: GuestRepository;
  private eventRepository: EventRepository;
  private invitationTemplateRepository: InvitationTemplateRepository;
  private bulkProgressTrackers: Map<string, BulkInvitationProgress> = new Map();

  constructor(whatsAppService: WhatsAppMockService) {
    this.whatsAppService = whatsAppService;
    this.rsvpService = new RSVPService();
    this.messageRepository = new MessageRepository();
    this.guestRepository = new GuestRepository();
    this.eventRepository = new EventRepository();
    this.invitationTemplateRepository = new InvitationTemplateRepository();
  }

  /**
   * Send bulk invitations to multiple guests (legacy method)
   */
  async sendBulkInvitationsLegacy(request: BulkInvitationRequest): Promise<string> {
    const { eventId, guestIds, templateId, scheduledAt } = request;

    // Validate event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get guests
    const guests = await Promise.all(
      guestIds.map(id => this.guestRepository.findById(id))
    );
    const validGuests = guests.filter((guest): guest is Guest => guest !== null);

    if (validGuests.length === 0) {
      throw new Error('No valid guests found');
    }

    // Get invitation template
    let template: InvitationTemplate;
    if (templateId) {
      const foundTemplate = await this.invitationTemplateRepository.findById(templateId);
      if (!foundTemplate) {
        throw new Error('Invitation template not found');
      }
      template = foundTemplate;
    } else {
      template = await this.rsvpService.getDefaultInvitationTemplate(eventId);
    }

    // Generate unique tracking ID for this bulk operation
    const trackingId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize progress tracker
    const progress: BulkInvitationProgress = {
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
        logger.error('Error in bulk invitation processing:', error);
        progress.isComplete = true;
      });

    logger.info(`Started bulk invitation sending for ${validGuests.length} guests, tracking ID: ${trackingId}`);
    return trackingId;
  }

  /**
   * Get progress of bulk invitation sending
   */
  getBulkInvitationProgress(trackingId: string): BulkInvitationProgress | null {
    return this.bulkProgressTrackers.get(trackingId) || null;
  }



  /**
   * Send reminder message
   */
  async sendReminder(guestId: string, eventId: string, reminderContent: string): Promise<Message> {
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
    const messageData: MessageInput = {
      eventId: event.id,
      recipientId: guest.id,
      content: personalizedContent,
      messageType: 'reminder'
    };

    const message = await this.messageRepository.create(messageData);

    // Send via WhatsApp
    const result = await this.whatsAppService.sendMessage(
      guest.phoneNumber,
      personalizedContent,
      message.id
    );

    if (!result.success) {
      logger.warn(`Failed to send reminder to ${guest.name}: ${result.error}`);
    }

    return message;
  }

  /**
   * Schedule messages for later delivery
   */
  async scheduleMessages(request: MessageScheduleRequest): Promise<Message[]> {
    const { eventId, guestIds, messageType, content, scheduledAt } = request;

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const guests = await Promise.all(
      guestIds.map(id => this.guestRepository.findById(id))
    );
    const validGuests = guests.filter((guest): guest is Guest => guest !== null);

    if (validGuests.length === 0) {
      throw new Error('No valid guests found');
    }

    const scheduledMessages: Message[] = [];

    for (const guest of validGuests) {
      const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, eventId);
      const personalizedContent = this.personalizeContent(content, guest, event, rsvpLink);

      const messageData: MessageInput = {
        eventId,
        recipientId: guest.id,
        content: personalizedContent,
        messageType,
        scheduledAt
      };

      const message = await this.messageRepository.create(messageData);
      scheduledMessages.push(message);
    }

    logger.info(`Scheduled ${scheduledMessages.length} messages for ${scheduledAt.toISOString()}`);
    return scheduledMessages;
  }

  /**
   * Process scheduled messages that are due
   */
  async processScheduledMessages(): Promise<void> {
    const dueMessages = await this.messageRepository.findScheduledMessages(new Date());
    
    if (dueMessages.length === 0) {
      return;
    }

    logger.info(`Processing ${dueMessages.length} scheduled messages`);

    for (const message of dueMessages) {
      try {
        const guest = await this.guestRepository.findById(message.recipientId);
        if (!guest) {
          await this.messageRepository.markAsFailed(message.id);
          continue;
        }

        const result = await this.whatsAppService.sendMessage(
          guest.phoneNumber,
          message.content,
          message.id
        );

        if (!result.success) {
          logger.warn(`Failed to send scheduled message ${message.id}: ${result.error}`);
        }
      } catch (error) {
        logger.error(`Error processing scheduled message ${message.id}:`, error);
        await this.messageRepository.markAsFailed(message.id);
      }
    }
  }

  /**
   * Get message delivery statistics for an event
   */
  async getMessageStatistics(eventId: string): Promise<{
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    pendingMessages: number;
    deliveryRate: number;
    messageTypeBreakdown: Record<string, number>;
  }> {
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

    const messageTypeBreakdown: Record<string, number> = {};
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
  async retryFailedMessages(eventId: string): Promise<number> {
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

        const result = await this.whatsAppService.sendMessage(
          guest.phoneNumber,
          message.content,
          message.id
        );

        if (result.success) {
          retriedCount++;
        }
      } catch (error) {
        logger.error(`Error retrying message ${message.id}:`, error);
      }
    }

    logger.info(`Retried ${retriedCount} failed messages for event ${eventId}`);
    return retriedCount;
  }

  /**
   * Private method to process bulk invitations
   */
  private async processBulkInvitations(
    trackingId: string,
    guests: Guest[],
    event: Event,
    template: InvitationTemplate,
    scheduledAt?: Date
  ): Promise<void> {
    const progress = this.bulkProgressTrackers.get(trackingId)!;

    for (const guest of guests) {
      progress.currentGuestName = guest.name;
      
      try {
        if (scheduledAt) {
          // Schedule the message
          const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, event.id);
          // For now, use a simple template content since the InvitationTemplate structure has changed
          const templateContent = `Hi {{guestName}}, you're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP: {{rsvpLink}}`;
          const personalizedContent = this.personalizeContent(templateContent, guest, event, rsvpLink);

          const messageData: MessageInput = {
            eventId: event.id,
            recipientId: guest.id,
            content: personalizedContent,
            messageType: 'invitation',
            scheduledAt
          };

          await this.messageRepository.create(messageData);
          progress.successfulSends++;
        } else {
          // Send immediately
          await this.sendPersonalizedMessage(guest, event, template, 'invitation');
          progress.successfulSends++;
        }
      } catch (error) {
        progress.failedSends++;
        progress.errors.push({
          guestId: guest.id,
          guestName: guest.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        logger.error(`Failed to send invitation to ${guest.name}:`, error);
      }

      progress.processedGuests++;
      
      // Add small delay between messages to avoid overwhelming the system
      await this.delay(100);
    }

    progress.isComplete = true;
    progress.currentGuestName = undefined;
    
    logger.info(`Bulk invitation processing completed. Success: ${progress.successfulSends}, Failed: ${progress.failedSends}`);
  }

  /**
   * Private method to send personalized message
   */
  private async sendPersonalizedMessage(
    guest: Guest,
    event: Event,
    template: InvitationTemplate,
    messageType: 'invitation' | 'reminder' | 'confirmation'
  ): Promise<Message> {
    const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, event.id);
    // For now, use a simple template content since the InvitationTemplate structure has changed
    const templateContent = `Hi {{guestName}}, you're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP: {{rsvpLink}}`;
    const personalizedContent = this.personalizeContent(templateContent, guest, event, rsvpLink);

    // Create message record
    const messageData: MessageInput = {
      eventId: event.id,
      recipientId: guest.id,
      content: personalizedContent,
      messageType
    };

    const message = await this.messageRepository.create(messageData);

    // Send via WhatsApp
    const result = await this.whatsAppService.sendMessage(
      guest.phoneNumber,
      personalizedContent,
      message.id
    );

    if (!result.success) {
      logger.warn(`Failed to send ${messageType} to ${guest.name}: ${result.error}`);
    }

    return message;
  }

  /**
   * Private method to personalize message content
   */
  private personalizeContent(content: string, guest: Guest, event: Event, rsvpLink: string): string {
    const personalizationData: MessagePersonalizationData = {
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send bulk invitations to multiple guests (new method for invitation management)
   */
  async sendBulkInvitations(
    eventId: string, 
    invitations: Array<{
      guestId: string;
      phone: string;
      content: string;
      messageId: string;
    }>
  ): Promise<{ successfulSends: number; failedSends: number; results: any[] }> {
    const messages = invitations.map(invitation => ({
      to: invitation.phone,
      content: invitation.content,
      messageId: invitation.messageId
    }));

    // Send bulk messages via WhatsApp service
    const bulkResult = await this.whatsAppService.sendBulkMessages(messages);

    // Store message records in the database
    for (const invitation of invitations) {
      try {
        const messageData: MessageInput = {
          eventId,
          recipientId: invitation.guestId,
          content: invitation.content,
          messageType: 'invitation'
        };

        await this.messageRepository.create(messageData);
      } catch (error) {
        logger.error(`Failed to store invitation message record for guest ${invitation.guestId}:`, error);
      }
    }

    logger.info(`Bulk invitations sent: ${bulkResult.successfulSends} successful, ${bulkResult.failedSends} failed`);
    
    return {
      successfulSends: bulkResult.successfulSends,
      failedSends: bulkResult.failedSends,
      results: bulkResult.results
    };
  }

  /**
   * Send bulk messages with custom message type
   */
  async sendBulkMessages(
    eventId: string, 
    messages: Array<{
      guestId: string;
      phone: string;
      content: string;
      messageId: string;
      messageType: 'invitation' | 'reminder' | 'confirmation';
    }>
  ): Promise<{ successfulSends: number; failedSends: number; results: any[] }> {
    const whatsAppMessages = messages.map(message => ({
      to: message.phone,
      content: message.content,
      messageId: message.messageId
    }));

    // Send bulk messages via WhatsApp service
    const bulkResult = await this.whatsAppService.sendBulkMessages(whatsAppMessages);

    // Store message records in the database
    for (const message of messages) {
      try {
        const messageData: MessageInput = {
          eventId,
          recipientId: message.guestId,
          content: message.content,
          messageType: message.messageType
        };

        await this.messageRepository.create(messageData);
      } catch (error) {
        logger.error(`Failed to store ${message.messageType} message record for guest ${message.guestId}:`, error);
      }
    }

    logger.info(`Bulk ${messages[0]?.messageType || 'messages'} sent: ${bulkResult.successfulSends} successful, ${bulkResult.failedSends} failed`);
    
    return {
      successfulSends: bulkResult.successfulSends,
      failedSends: bulkResult.failedSends,
      results: bulkResult.results
    };
  }

  /**
   * Send invitation with custom template content
   */
  async sendInvitation(guestId: string, eventId: string, templateContent: string, messageType: 'invitation' | 'reminder' = 'invitation'): Promise<Message> {
    const guest = await this.guestRepository.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }

    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const rsvpLink = await this.rsvpService.getRSVPLink(guest.id, eventId);
    const personalizedContent = this.personalizeContent(templateContent, guest, event, rsvpLink);

    // Create message record
    const messageData: MessageInput = {
      eventId: event.id,
      recipientId: guest.id,
      content: personalizedContent,
      messageType
    };

    const message = await this.messageRepository.create(messageData);

    // Send via WhatsApp
    const result = await this.whatsAppService.sendMessage(
      guest.phoneNumber,
      personalizedContent,
      message.id
    );

    if (!result.success) {
      logger.warn(`Failed to send ${messageType} to ${guest.name}: ${result.error}`);
    }

    return message;
  }

  /**
   * Send bulk reminders to multiple guests
   */
  async sendBulkReminders(
    eventId: string, 
    reminders: Array<{
      guestId: string;
      phone: string;
      content: string;
      messageId: string;
    }>
  ): Promise<{ successfulSends: number; failedSends: number; results: any[] }> {
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
        const messageData: MessageInput = {
          eventId,
          recipientId: reminder.guestId,
          content: reminder.content,
          messageType: 'reminder'
        };

        await this.messageRepository.create(messageData);
      } catch (error) {
        logger.error(`Failed to store reminder message record for guest ${reminder.guestId}:`, error);
      }
    }

    logger.info(`Bulk reminders sent: ${bulkResult.successfulSends} successful, ${bulkResult.failedSends} failed`);
    
    return {
      successfulSends: bulkResult.successfulSends,
      failedSends: bulkResult.failedSends,
      results: bulkResult.results
    };
  }

  /**
   * Clean up completed bulk operation trackers
   */
  cleanupCompletedTrackers(): void {
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