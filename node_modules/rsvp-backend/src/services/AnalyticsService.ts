import { GuestService, GuestAnalytics } from './GuestService';
import { MessagingService } from './MessagingService';
import { RSVPService } from './RSVPService';
import { ReminderService } from './ReminderService';
import { GuestRepository } from '../repositories/GuestRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { RSVPResponseRepository } from '../repositories/RSVPResponseRepository';
import { EventRepository } from '../repositories/EventRepository';
import { Guest, RSVPResponse, Event } from '../../../shared/src/types';
import { logger } from '../utils/logger';

export interface EventAnalytics {
  // Basic event info
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  rsvpDeadline: Date;
  
  // Guest statistics
  guestStats: GuestAnalytics;
  
  // RSVP statistics
  rsvpStats: {
    totalResponses: number;
    acceptedCount: number;
    declinedCount: number;
    pendingCount: number;
    noResponseCount: number;
    responseRate: number;
    acceptanceRate: number;
    totalExpectedAttendees: number; // Including additional guests
    averageResponseTime: number; // In hours
    responseTrend: Array<{
      date: string;
      acceptedCount: number;
      declinedCount: number;
      cumulativeTotal: number;
    }>;
  };
  
  // Messaging statistics
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
  
  // Dietary requirements
  dietaryStats: {
    totalWithRestrictions: number;
    restrictionBreakdown: Record<string, number>;
    percentageWithRestrictions: number;
  };
  
  // Special requests and feedback
  feedbackStats: {
    totalWithSpecialRequests: number;
    specialRequestsBreakdown: Array<{
      guestName: string;
      request: string;
      rsvpStatus: string;
    }>;
  };
  
  // Attendance trends
  attendanceTrends: {
    brideVsGroomSide: {
      bride: { accepted: number; declined: number; pending: number };
      groom: { accepted: number; declined: number; pending: number };
    };
    relationshipBreakdown: Record<string, {
      accepted: number;
      declined: number;
      pending: number;
    }>;
  };
  
  // Real-time metrics
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

export class AnalyticsService {
  private guestService: GuestService;
  private messagingService: MessagingService;
  private rsvpService: RSVPService;
  private reminderService: ReminderService;
  private guestRepository: GuestRepository;
  private messageRepository: MessageRepository;
  private rsvpResponseRepository: RSVPResponseRepository;
  private eventRepository: EventRepository;
  private eventService: any; // MockEventService in demo mode

  constructor(
    guestService: GuestService,
    messagingService: MessagingService,
    rsvpService: RSVPService,
    reminderService: ReminderService
  ) {
    this.guestService = guestService;
    this.messagingService = messagingService;
    this.rsvpService = rsvpService;
    this.reminderService = reminderService;
    
    // Use mock repositories in demo mode
    const isDemo = process.env.SKIP_DB_SETUP === 'true';
    if (isDemo) {
      const { MockEventService } = require('./MockEventService');
      const { MockGuestRepository } = require('./MockGuestRepository');
      const { MockMessageRepository } = require('./MockMessageRepository');
      
      this.eventService = new MockEventService();
      this.eventRepository = this.eventService as any;
      this.guestRepository = new MockGuestRepository() as any;
      this.messageRepository = new MockMessageRepository() as any;
      
      // Create a simple mock for RSVPResponseRepository
      this.rsvpResponseRepository = {
        findByEventId: async (eventId: string) => [],
        findRecent: async (limit: number) => []
      } as any;
    } else {
      this.eventRepository = new EventRepository();
      this.eventService = this.eventRepository;
      this.guestRepository = new GuestRepository();
      this.messageRepository = new MessageRepository();
      this.rsvpResponseRepository = new RSVPResponseRepository();
    }
  }

  /**
   * Get comprehensive analytics for a specific event
   */
  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    try {
      logger.info(`Generating analytics for event ${eventId}`);

      // Get basic event info
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Get all analytics data in parallel
      const [
        guestStats,
        rawMessagingStats,
        rsvpResponses,
        guests
      ] = await Promise.all([
        this.guestService.getGuestAnalytics(eventId),
        this.messagingService.getMessageStatistics(eventId),
        this.rsvpResponseRepository.findByEventId(eventId),
        this.guestRepository.findByEventId(eventId)
      ]);

      // Enhance messaging stats with missing properties
      const messagingStats = {
        ...rawMessagingStats,
        invitationsSent: rawMessagingStats.messageTypeBreakdown.invitation || 0,
        remindersSent: rawMessagingStats.messageTypeBreakdown.reminder || 0,
        confirmationsSent: rawMessagingStats.messageTypeBreakdown.confirmation || 0
      };

      // Calculate RSVP statistics
      const rsvpStats = this.calculateRSVPStats(guests, rsvpResponses, event);
      
      // Calculate dietary statistics
      const dietaryStats = this.calculateDietaryStats(guests);
      
      // Calculate feedback statistics
      const feedbackStats = this.calculateFeedbackStats(guests);
      
      // Calculate attendance trends
      const attendanceTrends = this.calculateAttendanceTrends(guests);
      
      // Calculate real-time metrics
      const realTimeMetrics = this.calculateRealTimeMetrics(guests, rsvpResponses, event);

      const analytics: EventAnalytics = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        rsvpDeadline: event.rsvpDeadline,
        guestStats,
        rsvpStats,
        messagingStats,
        dietaryStats,
        feedbackStats,
        attendanceTrends,
        realTimeMetrics
      };

      logger.info(`Analytics generated successfully for event ${eventId}`);
      return analytics;

    } catch (error) {
      logger.error(`Error generating analytics for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard summary across all events
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const events = await this.eventRepository.findAll();
      const activeEvents = events.filter(event => 
        event.rsvpDeadline > new Date() && event.date > new Date()
      );

      let totalGuests = 0;
      let totalResponses = 0;

      // Aggregate data across all events
      for (const event of events) {
        const guests = await this.guestRepository.findByEventId(event.id);
        totalGuests += guests.length;
        totalResponses += guests.filter(g => 
          g.rsvpStatus === 'accepted' || g.rsvpStatus === 'declined'
        ).length;
      }

      const overallResponseRate = totalGuests > 0 ? (totalResponses / totalGuests) * 100 : 0;

      // Get recent activity
      const recentActivity = await this.getRecentActivity();

      return {
        totalEvents: events.length,
        activeEvents: activeEvents.length,
        totalGuests,
        totalResponses,
        overallResponseRate: Math.round(overallResponseRate * 100) / 100,
        recentActivity
      };

    } catch (error) {
      logger.error('Error generating dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Calculate RSVP statistics
   */
  private calculateRSVPStats(guests: Guest[], rsvpResponses: RSVPResponse[], event: Event) {
    const acceptedGuests = guests.filter(g => g.rsvpStatus === 'accepted');
    const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined');
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');
    const noResponseGuests = guests.filter(g => g.rsvpStatus === 'no_response');

    const totalResponses = acceptedGuests.length + declinedGuests.length;
    const responseRate = guests.length > 0 ? (totalResponses / guests.length) * 100 : 0;
    const acceptanceRate = totalResponses > 0 ? (acceptedGuests.length / totalResponses) * 100 : 0;

    // Calculate total expected attendees (including additional guests)
    const totalExpectedAttendees = acceptedGuests.reduce((sum, guest) => 
      sum + 1 + (guest.additionalGuestCount || 0), 0
    );

    // Calculate average response time
    const averageResponseTime = this.calculateAverageResponseTime(rsvpResponses);

    // Generate response trend data
    const responseTrend = this.generateResponseTrend(rsvpResponses);

    return {
      totalResponses,
      acceptedCount: acceptedGuests.length,
      declinedCount: declinedGuests.length,
      pendingCount: pendingGuests.length,
      noResponseCount: noResponseGuests.length,
      responseRate: Math.round(responseRate * 100) / 100,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      totalExpectedAttendees,
      averageResponseTime,
      responseTrend
    };
  }

  /**
   * Calculate dietary statistics
   */
  private calculateDietaryStats(guests: Guest[]) {
    const guestsWithRestrictions = guests.filter(g => 
      g.dietaryRestrictions && g.dietaryRestrictions.length > 0
    );

    const restrictionBreakdown: Record<string, number> = {};
    guests.forEach(guest => {
      if (guest.dietaryRestrictions) {
        guest.dietaryRestrictions.forEach(restriction => {
          restrictionBreakdown[restriction] = (restrictionBreakdown[restriction] || 0) + 1;
        });
      }
    });

    const percentageWithRestrictions = guests.length > 0 
      ? (guestsWithRestrictions.length / guests.length) * 100 
      : 0;

    return {
      totalWithRestrictions: guestsWithRestrictions.length,
      restrictionBreakdown,
      percentageWithRestrictions: Math.round(percentageWithRestrictions * 100) / 100
    };
  }

  /**
   * Calculate feedback statistics
   */
  private calculateFeedbackStats(guests: Guest[]) {
    const guestsWithRequests = guests.filter(g => 
      g.specialRequests && g.specialRequests.trim().length > 0
    );

    const specialRequestsBreakdown = guestsWithRequests.map(guest => ({
      guestName: guest.name,
      request: guest.specialRequests,
      rsvpStatus: guest.rsvpStatus
    }));

    return {
      totalWithSpecialRequests: guestsWithRequests.length,
      specialRequestsBreakdown
    };
  }

  /**
   * Calculate attendance trends
   */
  private calculateAttendanceTrends(guests: Guest[]) {
    // Bride vs Groom side breakdown
    const brideGuests = guests.filter(g => g.brideOrGroomSide === 'bride');
    const groomGuests = guests.filter(g => g.brideOrGroomSide === 'groom');

    const brideVsGroomSide = {
      bride: {
        accepted: brideGuests.filter(g => g.rsvpStatus === 'accepted').length,
        declined: brideGuests.filter(g => g.rsvpStatus === 'declined').length,
        pending: brideGuests.filter(g => g.rsvpStatus === 'pending' || g.rsvpStatus === 'no_response').length
      },
      groom: {
        accepted: groomGuests.filter(g => g.rsvpStatus === 'accepted').length,
        declined: groomGuests.filter(g => g.rsvpStatus === 'declined').length,
        pending: groomGuests.filter(g => g.rsvpStatus === 'pending' || g.rsvpStatus === 'no_response').length
      }
    };

    // Relationship breakdown
    const relationshipBreakdown: Record<string, { accepted: number; declined: number; pending: number }> = {};
    
    guests.forEach(guest => {
      const relationship = guest.relationshipType;
      if (!relationshipBreakdown[relationship]) {
        relationshipBreakdown[relationship] = { accepted: 0, declined: 0, pending: 0 };
      }

      if (guest.rsvpStatus === 'accepted') {
        relationshipBreakdown[relationship].accepted++;
      } else if (guest.rsvpStatus === 'declined') {
        relationshipBreakdown[relationship].declined++;
      } else {
        relationshipBreakdown[relationship].pending++;
      }
    });

    return {
      brideVsGroomSide,
      relationshipBreakdown
    };
  }

  /**
   * Calculate real-time metrics
   */
  private calculateRealTimeMetrics(guests: Guest[], rsvpResponses: RSVPResponse[], event: Event) {
    const now = new Date();
    const deadlineTime = event.rsvpDeadline.getTime();
    const currentTime = now.getTime();
    
    const timeDiff = deadlineTime - currentTime;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
    const isOverdue = timeDiff < 0;

    // Get recent responses (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const recentResponses = rsvpResponses
      .filter(response => response.createdAt > sevenDaysAgo)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(response => {
        const guest = guests.find(g => g.id === response.guestId);
        return {
          guestName: guest?.name || 'Unknown Guest',
          responseType: response.attendanceStatus,
          timestamp: response.createdAt
        };
      });

    return {
      lastUpdated: now,
      recentResponses,
      upcomingDeadline: {
        daysRemaining: Math.max(0, daysRemaining),
        hoursRemaining: Math.max(0, hoursRemaining),
        isOverdue
      }
    };
  }

  /**
   * Calculate average response time in hours
   */
  private calculateAverageResponseTime(rsvpResponses: RSVPResponse[]): number {
    if (rsvpResponses.length === 0) return 0;

    const responseTimes = rsvpResponses.map(response => {
      // For now, we'll calculate from creation time to response time
      // In a real implementation, you'd track when invitations were sent
      const responseTime = response.createdAt.getTime();
      const invitationTime = response.createdAt.getTime() - (24 * 60 * 60 * 1000); // Assume invitation sent 1 day before
      return (responseTime - invitationTime) / (1000 * 60 * 60); // Convert to hours
    });

    const averageHours = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(averageHours * 100) / 100;
  }

  /**
   * Generate response trend data
   */
  private generateResponseTrend(rsvpResponses: RSVPResponse[]) {
    const trendData: Array<{
      date: string;
      acceptedCount: number;
      declinedCount: number;
      cumulativeTotal: number;
    }> = [];

    // Group responses by date
    const responsesByDate: Record<string, { accepted: number; declined: number }> = {};
    
    rsvpResponses.forEach(response => {
      const dateKey = response.createdAt.toISOString().split('T')[0];
      if (!responsesByDate[dateKey]) {
        responsesByDate[dateKey] = { accepted: 0, declined: 0 };
      }
      
      if (response.attendanceStatus === 'accepted') {
        responsesByDate[dateKey].accepted++;
      } else if (response.attendanceStatus === 'declined') {
        responsesByDate[dateKey].declined++;
      }
    });

    // Convert to trend array with cumulative totals
    let cumulativeTotal = 0;
    const sortedDates = Object.keys(responsesByDate).sort();
    
    sortedDates.forEach(date => {
      const dayData = responsesByDate[date];
      cumulativeTotal += dayData.accepted + dayData.declined;
      
      trendData.push({
        date,
        acceptedCount: dayData.accepted,
        declinedCount: dayData.declined,
        cumulativeTotal
      });
    });

    return trendData;
  }

  /**
   * Get recent activity across all events
   */
  private async getRecentActivity() {
    const recentActivity: Array<{
      type: 'rsvp_response' | 'message_sent' | 'guest_added';
      description: string;
      timestamp: Date;
      eventId: string;
    }> = [];

    try {
      // Get recent RSVP responses
      const recentRSVPs = await this.rsvpResponseRepository.findRecent(10);
      for (const rsvp of recentRSVPs) {
        const guest = await this.guestRepository.findById(rsvp.guestId);
        if (guest) {
          recentActivity.push({
            type: 'rsvp_response',
            description: `${guest.name} ${rsvp.attendanceStatus} the invitation`,
            timestamp: rsvp.createdAt,
            eventId: rsvp.eventId
          });
        }
      }

      // Get recent messages
      const recentMessages = await this.messageRepository.findRecent(10);
      for (const message of recentMessages) {
        const guest = await this.guestRepository.findById(message.recipientId);
        if (guest) {
          recentActivity.push({
            type: 'message_sent',
            description: `${message.messageType} sent to ${guest.name}`,
            timestamp: message.createdAt,
            eventId: message.eventId
          });
        }
      }

      // Get recently added guests
      const recentGuests = await this.guestRepository.findRecent(10);
      for (const guest of recentGuests) {
        recentActivity.push({
          type: 'guest_added',
          description: `${guest.name} added to guest list`,
          timestamp: guest.createdAt,
          eventId: guest.id // Note: This should be eventId, but Guest model doesn't have it directly
        });
      }

      // Sort by timestamp and return top 20
      return recentActivity
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);

    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      return [];
    }
  }
}