import { WhatsAppMockService } from './WhatsAppMockService';
import { Message } from '../../../shared/src/types';
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
export declare class MessagingService {
    private whatsAppService;
    private rsvpService;
    private messageRepository;
    private guestRepository;
    private eventRepository;
    private invitationTemplateRepository;
    private bulkProgressTrackers;
    constructor(whatsAppService: WhatsAppMockService);
    /**
     * Send bulk invitations to multiple guests
     */
    sendBulkInvitations(request: BulkInvitationRequest): Promise<string>;
    /**
     * Get progress of bulk invitation sending
     */
    getBulkInvitationProgress(trackingId: string): BulkInvitationProgress | null;
    /**
     * Send individual invitation
     */
    sendInvitation(guestId: string, eventId: string, templateId?: string): Promise<Message>;
    /**
     * Send reminder message
     */
    sendReminder(guestId: string, eventId: string, reminderContent: string): Promise<Message>;
    /**
     * Schedule messages for later delivery
     */
    scheduleMessages(request: MessageScheduleRequest): Promise<Message[]>;
    /**
     * Process scheduled messages that are due
     */
    processScheduledMessages(): Promise<void>;
    /**
     * Get message delivery statistics for an event
     */
    getMessageStatistics(eventId: string): Promise<{
        totalMessages: number;
        sentMessages: number;
        deliveredMessages: number;
        failedMessages: number;
        pendingMessages: number;
        deliveryRate: number;
        messageTypeBreakdown: Record<string, number>;
    }>;
    /**
     * Retry failed messages
     */
    retryFailedMessages(eventId: string): Promise<number>;
    /**
     * Private method to process bulk invitations
     */
    private processBulkInvitations;
    /**
     * Private method to send personalized message
     */
    private sendPersonalizedMessage;
    /**
     * Private method to personalize message content
     */
    private personalizeContent;
    /**
     * Utility method for delays
     */
    private delay;
    /**
     * Send bulk reminders to multiple guests
     */
    sendBulkReminders(eventId: string, reminders: Array<{
        guestId: string;
        phone: string;
        content: string;
        messageId: string;
    }>): Promise<{
        successfulSends: number;
        failedSends: number;
        results: any[];
    }>;
    /**
     * Clean up completed bulk operation trackers
     */
    cleanupCompletedTrackers(): void;
}
//# sourceMappingURL=MessagingService.d.ts.map