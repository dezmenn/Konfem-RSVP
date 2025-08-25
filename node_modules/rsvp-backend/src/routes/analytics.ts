import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { GuestService } from '../services/GuestService';
import { MessagingService } from '../services/MessagingService';
import { RSVPService } from '../services/RSVPService';
import { ReminderService } from '../services/ReminderService';
import { GuestRepository } from '../repositories/GuestRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { WhatsAppMockService } from '../services/WhatsAppMockService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services
let analyticsService: AnalyticsService;

function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    // Use mock services in demo mode
    const isDemo = process.env.SKIP_DB_SETUP === 'true';
    
    let guestRepository;
    let messageRepository;
    
    if (isDemo) {
      const { MockGuestRepository } = require('../services/MockGuestRepository');
      const { MockMessageRepository } = require('../services/MockMessageRepository');
      guestRepository = new MockGuestRepository();
      messageRepository = new MockMessageRepository();
    } else {
      guestRepository = new GuestRepository();
      messageRepository = new MessageRepository();
    }
    
    const guestService = new GuestService(guestRepository);
    const whatsAppService = new WhatsAppMockService(messageRepository);
    const messagingService = new MessagingService(whatsAppService);
    const rsvpService = new RSVPService();
    const reminderService = new ReminderService(messagingService);
    
    analyticsService = new AnalyticsService(
      guestService,
      messagingService,
      rsvpService,
      reminderService
    );
  }
  return analyticsService;
}

/**
 * GET /api/analytics/events/:eventId - Get comprehensive analytics for a specific event
 */
router.get('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching analytics for event ${eventId}`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error fetching event analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/analytics/dashboard - Get dashboard summary across all events
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching dashboard summary');
    
    const summary = await getAnalyticsService().getDashboardSummary();
    
    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary'
    });
  }
});

/**
 * GET /api/analytics/events/:eventId/rsvp-trends - Get RSVP response trends for an event
 */
router.get('/events/:eventId/rsvp-trends', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { days = '30' } = req.query;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching RSVP trends for event ${eventId} (${days} days)`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    // Filter trend data based on requested days
    const daysNumber = parseInt(days as string, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNumber);
    
    const filteredTrend = analytics.rsvpStats.responseTrend.filter(trend => 
      new Date(trend.date) >= cutoffDate
    );
    
    res.json({
      success: true,
      data: {
        trends: filteredTrend,
        summary: {
          totalResponses: analytics.rsvpStats.totalResponses,
          responseRate: analytics.rsvpStats.responseRate,
          acceptanceRate: analytics.rsvpStats.acceptanceRate
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching RSVP trends:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RSVP trends'
    });
  }
});

/**
 * GET /api/analytics/events/:eventId/dietary-summary - Get dietary requirements summary
 */
router.get('/events/:eventId/dietary-summary', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching dietary summary for event ${eventId}`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    res.json({
      success: true,
      data: {
        dietaryStats: analytics.dietaryStats,
        totalAcceptedGuests: analytics.rsvpStats.acceptedCount,
        totalExpectedAttendees: analytics.rsvpStats.totalExpectedAttendees
      }
    });

  } catch (error) {
    logger.error('Error fetching dietary summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dietary summary'
    });
  }
});

/**
 * GET /api/analytics/events/:eventId/special-requests - Get special requests and feedback
 */
router.get('/events/:eventId/special-requests', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching special requests for event ${eventId}`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    res.json({
      success: true,
      data: analytics.feedbackStats
    });

  } catch (error) {
    logger.error('Error fetching special requests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch special requests'
    });
  }
});

/**
 * GET /api/analytics/events/:eventId/attendance-breakdown - Get attendance breakdown by relationship and side
 */
router.get('/events/:eventId/attendance-breakdown', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching attendance breakdown for event ${eventId}`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    res.json({
      success: true,
      data: {
        attendanceTrends: analytics.attendanceTrends,
        guestStats: {
          totalGuests: analytics.guestStats.totalGuests,
          brideGroomSideCounts: analytics.guestStats.brideGroomSideCounts,
          relationshipTypeCounts: analytics.guestStats.relationshipTypeCounts
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching attendance breakdown:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attendance breakdown'
    });
  }
});

/**
 * GET /api/analytics/events/:eventId/real-time - Get real-time metrics and recent activity
 */
router.get('/events/:eventId/real-time', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    logger.info(`Fetching real-time metrics for event ${eventId}`);
    
    const analytics = await getAnalyticsService().getEventAnalytics(eventId);
    
    res.json({
      success: true,
      data: {
        realTimeMetrics: analytics.realTimeMetrics,
        messagingStats: analytics.messagingStats,
        currentStats: {
          totalGuests: analytics.guestStats.totalGuests,
          totalResponses: analytics.rsvpStats.totalResponses,
          responseRate: analytics.rsvpStats.responseRate,
          expectedAttendees: analytics.rsvpStats.totalExpectedAttendees
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch real-time metrics'
    });
  }
});

export default router;