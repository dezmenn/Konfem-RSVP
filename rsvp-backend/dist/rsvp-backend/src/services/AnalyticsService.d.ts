import { GuestService, GuestAnalytics } from './GuestService';
import { MessagingService } from './MessagingService';
import { RSVPService } from './RSVPService';
import { ReminderService } from './ReminderService';
export interface EventAnalytics {
    eventId: string;
    eventTitle: string;
    eventDate: Date;
    rsvpDeadline: Date;
    guestStats: GuestAnalytics;
    rsvpStats: {
        totalResponses: number;
        acceptedCount: number;
        declinedCount: number;
        pendingCount: number;
        noResponseCount: number;
        responseRate: number;
        acceptanceRate: number;
        totalExpectedAttendees: number;
        averageResponseTime: number;
        responseTrend: Array<{
            date: string;
            acceptedCount: number;
            declinedCount: number;
            cumulativeTotal: number;
        }>;
    };
    messagingStats: {
        totalMessages: number;
        sentMessages: number;
        deliveredMessages: number;
        failedMessages: number;
        pendingMessages: number;
        deliveryRate: number;
        messageTypeBreakdown: Record<string, number>;
        invitationsSent: number;
        remindersSent: number;
        confirmationsSent: number;
    };
    dietaryStats: {
        totalWithRestrictions: number;
        restrictionBreakdown: Record<string, number>;
        percentageWithRestrictions: number;
    };
    feedbackStats: {
        totalWithSpecialRequests: number;
        specialRequestsBreakdown: Array<{
            guestName: string;
            request: string;
            rsvpStatus: string;
        }>;
    };
    attendanceTrends: {
        brideVsGroomSide: {
            bride: {
                accepted: number;
                declined: number;
                pending: number;
            };
            groom: {
                accepted: number;
                declined: number;
                pending: number;
            };
        };
        relationshipBreakdown: Record<string, {
            accepted: number;
            declined: number;
            pending: number;
        }>;
    };
    realTimeMetrics: {
        lastUpdated: Date;
        recentResponses: Array<{
            guestName: string;
            responseType: string;
            timestamp: Date;
        }>;
        upcomingDeadline: {
            daysRemaining: number;
            hoursRemaining: number;
            isOverdue: boolean;
        };
    };
}
export interface DashboardSummary {
    totalEvents: number;
    activeEvents: number;
    totalGuests: number;
    totalResponses: number;
    overallResponseRate: number;
    recentActivity: Array<{
        type: 'rsvp_response' | 'message_sent' | 'guest_added';
        description: string;
        timestamp: Date;
        eventId: string;
    }>;
}
export declare class AnalyticsService {
    private guestService;
    private messagingService;
    private rsvpService;
    private reminderService;
    private guestRepository;
    private messageRepository;
    private rsvpResponseRepository;
    private eventRepository;
    private eventService;
    constructor(guestService: GuestService, messagingService: MessagingService, rsvpService: RSVPService, reminderService: ReminderService);
    /**
     * Get comprehensive analytics for a specific event
     */
    getEventAnalytics(eventId: string): Promise<EventAnalytics>;
    /**
     * Get dashboard summary across all events
     */
    getDashboardSummary(): Promise<DashboardSummary>;
    /**
     * Calculate RSVP statistics
     */
    private calculateRSVPStats;
    /**
     * Calculate dietary statistics
     */
    private calculateDietaryStats;
    /**
     * Calculate feedback statistics
     */
    private calculateFeedbackStats;
    /**
     * Calculate attendance trends
     */
    private calculateAttendanceTrends;
    /**
     * Calculate real-time metrics
     */
    private calculateRealTimeMetrics;
    /**
     * Calculate average response time in hours
     */
    private calculateAverageResponseTime;
    /**
     * Generate response trend data
     */
    private generateResponseTrend;
    /**
     * Get recent activity across all events
     */
    private getRecentActivity;
}
//# sourceMappingURL=AnalyticsService.d.ts.map