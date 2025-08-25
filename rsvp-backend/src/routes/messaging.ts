import express from 'express';
import { MessagingService } from '../services/MessagingService';
import { WhatsAppMockService } from '../services/WhatsAppMockService';
import { MessageRepository } from '../repositories/MessageRepository';
import { MockGuestService } from '../services/MockGuestService';
import { DemoDataService } from '../services/DemoDataService';
import { logger } from '../utils/logger';

const router = express.Router();

// Use the shared WhatsApp service instance from global
const getWhatsAppService = (): WhatsAppMockService => {
  const service = (global as any).whatsAppMockService;
  if (!service) {
    throw new Error('WhatsApp service not initialized');
  }
  return service;
};

// Initialize demo services for guest lookup
const demoDataService = DemoDataService.getInstance();
const mockGuestService = new MockGuestService();

// Bulk invitation sending
router.post('/events/:eventId/bulk-invitations', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guestIds, templateId, scheduledAt } = req.body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ error: 'Guest IDs array is required' });
    }

    const request = {
      eventId,
      guestIds,
      templateId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    };

    // For demo mode, we'll just return a mock tracking ID
    const trackingId = `bulk-${Date.now()}`;
    
    res.status(202).json({
      success: true,
      trackingId,
      message: 'Bulk invitation sending started'
    });
  } catch (error) {
    logger.error('Error starting bulk invitation sending:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get bulk invitation progress
router.get('/bulk-invitations/:trackingId/progress', async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // For demo mode, return mock progress
    const progress = {
      totalGuests: 10,
      processedGuests: 10,
      successfulSends: 9,
      failedSends: 1,
      isComplete: true,
      errors: []
    };
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Error fetching bulk invitation progress:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Send individual invitation
router.post('/guests/:guestId/invitation', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Get guest from demo data
    const guest = demoDataService.getGuestById(guestId);
    if (!guest) {
      return res.status(400).json({ error: 'Guest not found' });
    }

    // Create invitation message content
    const invitationContent = `🎉 You're Invited! 🎉

Hi ${guest.name}!

You are cordially invited to our special event. We would be delighted to have you join us for this celebration.

📅 Event Details:
• Date: [Event Date]
• Time: [Event Time]  
• Venue: [Event Location]

Please confirm your attendance by replying to this message or clicking the link below:
[RSVP Link]

We look forward to celebrating with you!

Best regards,
The Event Team`;

    // Generate message ID and send message via WhatsApp service
    const messageId = `invitation-${guestId}-${Date.now()}`;
    const whatsAppService = getWhatsAppService();
    const result = await whatsAppService.sendMessage(
      guest.phoneNumber,
      invitationContent,
      messageId
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          id: messageId,
          recipientId: guestId,
          content: invitationContent,
          messageType: 'invitation',
          deliveryStatus: 'sent'
        }
      });
    } else {
      res.status(400).json({ error: result.error || 'Failed to send invitation' });
    }
  } catch (error) {
    logger.error('Error sending individual invitation:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Send reminder
router.post('/guests/:guestId/reminder', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { eventId, content } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Reminder content is required' });
    }

    // Get guest from demo data
    const guest = demoDataService.getGuestById(guestId);
    if (!guest) {
      return res.status(400).json({ error: 'Guest not found' });
    }

    // Generate message ID and send message via WhatsApp service
    const messageId = `reminder-${guestId}-${Date.now()}`;
    const whatsAppService = getWhatsAppService();
    const result = await whatsAppService.sendMessage(
      guest.phoneNumber,
      content,
      messageId
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          id: messageId,
          recipientId: guestId,
          content: content,
          messageType: 'reminder',
          deliveryStatus: 'sent'
        }
      });
    } else {
      res.status(400).json({ error: result.error || 'Failed to send reminder' });
    }
  } catch (error) {
    logger.error('Error sending reminder:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Schedule messages
router.post('/events/:eventId/schedule-messages', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guestIds, messageType, content, scheduledAt } = req.body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ error: 'Guest IDs array is required' });
    }

    if (!messageType || !['invitation', 'reminder', 'confirmation'].includes(messageType)) {
      return res.status(400).json({ error: 'Valid message type is required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!scheduledAt) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const request = {
      eventId,
      guestIds,
      messageType,
      content,
      scheduledAt: new Date(scheduledAt)
    };

    // For demo mode, return mock scheduled messages
    const messages = guestIds.map(guestId => ({
      id: `scheduled-${guestId}-${Date.now()}`,
      guestId,
      messageType,
      content,
      scheduledAt: new Date(scheduledAt)
    }));
    
    res.status(201).json({
      success: true,
      data: messages,
      message: `Scheduled ${messages.length} messages`
    });
  } catch (error) {
    logger.error('Error scheduling messages:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Process scheduled messages (typically called by a cron job)
router.post('/process-scheduled', async (req, res) => {
  try {
    // For demo mode, just return success
    res.json({
      success: true,
      message: 'Scheduled messages processed'
    });
  } catch (error) {
    logger.error('Error processing scheduled messages:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get message statistics for an event
router.get('/events/:eventId/message-statistics', async (req, res) => {
  try {
    const { eventId } = req.params;
    const whatsAppService = getWhatsAppService();
    const statistics = whatsAppService.getStats();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error fetching message statistics:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Retry failed messages
router.post('/events/:eventId/retry-failed', async (req, res) => {
  try {
    const { eventId } = req.params;
    const retriedCount = 0; // For demo mode, return 0
    
    res.json({
      success: true,
      retriedCount,
      message: `Retried ${retriedCount} failed messages`
    });
  } catch (error) {
    logger.error('Error retrying failed messages:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get messages for an event
router.get('/events/:eventId/messages', async (req, res) => {
  try {
    const { eventId } = req.params;
    const whatsAppService = getWhatsAppService();
    const messages = whatsAppService.getSentMessages();
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get messages for a specific guest
router.get('/guests/:guestId/messages', async (req, res) => {
  try {
    const { guestId } = req.params;
    const whatsAppService = getWhatsAppService();
    const allMessages = whatsAppService.getSentMessages();
    
    // Filter messages for this specific guest (by phone number)
    const guest = demoDataService.getGuestById(guestId);
    const messages = guest ? allMessages.filter(msg => msg.to === guest.phoneNumber) : [];
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching guest messages:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update message content (for scheduled messages only)
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, scheduledAt } = req.body;

    // For demo mode, just return success with mock updated message
    const updatedMessage = {
      id: messageId,
      content: content || 'Updated message content',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      deliveryStatus: 'pending',
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    logger.error('Error updating message:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Cancel scheduled message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // For demo mode, just return success
    res.json({
      success: true,
      message: 'Message cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling message:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Cleanup completed bulk operation trackers
router.post('/cleanup-trackers', async (req, res) => {
  try {
    // For demo mode, just return success
    res.json({
      success: true,
      message: 'Completed trackers cleaned up'
    });
  } catch (error) {
    logger.error('Error cleaning up trackers:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;