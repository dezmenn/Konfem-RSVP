import express from 'express';
import { RSVPService } from '../services/RSVPService';
import { MockRSVPService } from '../services/MockRSVPService';
import { logger } from '../utils/logger';

const router = express.Router();

// Use mock service in demo mode
const rsvpService = process.env.SKIP_DB_SETUP === 'true' 
  ? new MockRSVPService() 
  : new RSVPService();

// Invitation Template Routes
router.post('/events/:eventId/invitation-templates', async (req, res) => {
  try {
    const { eventId } = req.params;
    const templateData = { ...req.body, eventId };
    
    const template = await rsvpService.createInvitationTemplate(templateData);
    res.status(201).json(template);
  } catch (error) {
    logger.error('Error creating invitation template:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/events/:eventId/invitation-templates', async (req, res) => {
  try {
    const { eventId } = req.params;
    const templates = await rsvpService.getInvitationTemplatesByEvent(eventId);
    res.json(templates);
  } catch (error) {
    logger.error('Error fetching invitation templates:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/events/:eventId/invitation-templates/default', async (req, res) => {
  try {
    const { eventId } = req.params;
    const template = await rsvpService.getDefaultInvitationTemplate(eventId);
    res.json(template);
  } catch (error) {
    logger.error('Error fetching default invitation template:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/invitation-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await rsvpService.getInvitationTemplate(id);
    res.json(template);
  } catch (error) {
    logger.error('Error fetching invitation template:', error);
    res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.put('/invitation-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await rsvpService.updateInvitationTemplate(id, req.body);
    res.json(template);
  } catch (error) {
    logger.error('Error updating invitation template:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.delete('/invitation-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await rsvpService.deleteInvitationTemplate(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting invitation template:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// RSVP Token and Link Generation
router.post('/guests/:guestId/rsvp-token', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { eventId, expiryDays } = req.body;
    
    const token = await rsvpService.generateRSVPToken(guestId, eventId, expiryDays);
    res.status(201).json(token);
  } catch (error) {
    logger.error('Error generating RSVP token:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/guests/:guestId/rsvp-link', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { eventId } = req.query;
    
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    const rsvpLink = await rsvpService.getRSVPLink(guestId, eventId);
    res.json({ rsvpLink });
  } catch (error) {
    logger.error('Error generating RSVP link:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// RSVP Response Routes
router.get('/rsvp/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const validation = await rsvpService.validateRSVPToken(token);
    
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }
    
    res.json({
      valid: true,
      guestId: validation.rsvpToken?.guestId,
      eventId: validation.rsvpToken?.eventId
    });
  } catch (error) {
    logger.error('Error validating RSVP token:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/rsvp/:token/response', async (req, res) => {
  try {
    const { token } = req.params;
    const response = await rsvpService.submitRSVPResponse(token, req.body);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Error submitting RSVP response:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.put('/rsvp-responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await rsvpService.updateRSVPResponse(id, req.body);
    res.json(response);
  } catch (error) {
    logger.error('Error updating RSVP response:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/guests/:guestId/rsvp-response', async (req, res) => {
  try {
    const { guestId } = req.params;
    const response = await rsvpService.getRSVPResponse(guestId);
    
    if (!response) {
      return res.status(404).json({ error: 'RSVP response not found' });
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching RSVP response:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/events/:eventId/rsvp-responses', async (req, res) => {
  try {
    const { eventId } = req.params;
    const responses = await rsvpService.getEventRSVPResponses(eventId);
    res.json(responses);
  } catch (error) {
    logger.error('Error fetching event RSVP responses:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Public RSVP Routes
router.post('/events/:eventId/public-rsvp', async (req, res) => {
  try {
    const { eventId } = req.params;
    const registration = await rsvpService.submitPublicRSVP(eventId, req.body);
    res.status(201).json(registration);
  } catch (error) {
    logger.error('Error submitting public RSVP:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/events/:eventId/public-rsvp', async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await rsvpService.getPublicRSVPRegistrations(eventId);
    res.json(registrations);
  } catch (error) {
    logger.error('Error fetching public RSVP registrations:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Invitation Preview
router.get('/invitation-templates/:templateId/preview/:guestId', async (req, res) => {
  try {
    const { templateId, guestId } = req.params;
    const preview = await rsvpService.generateInvitationPreview(templateId, guestId);
    res.json(preview);
  } catch (error) {
    logger.error('Error generating invitation preview:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Statistics and Analytics
router.get('/events/:eventId/rsvp-statistics', async (req, res) => {
  try {
    const { eventId } = req.params;
    const statistics = await rsvpService.getEventRSVPStatistics(eventId);
    res.json(statistics);
  } catch (error) {
    logger.error('Error fetching RSVP statistics:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Additional endpoints for frontend integration

// Get event details
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // For demo mode, return mock event data
    if (process.env.SKIP_DB_SETUP === 'true') {
      const mockEvent = {
        id: eventId,
        name: "Sarah & John's Wedding",
        date: "2025-12-15",
        time: "6:00 PM",
        location: "Grand Ballroom, Elegant Hotel",
        description: "Join us for a celebration of love and joy!",
        rsvpDeadline: "2025-11-15"
      };
      return res.json({ success: true, data: mockEvent });
    }
    
    // In production, this would fetch from database
    res.status(404).json({ success: false, error: 'Event not found' });
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get RSVP token details
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const validation = await rsvpService.validateRSVPToken(token);
    
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    res.json({ success: true, data: validation.rsvpToken });
  } catch (error) {
    logger.error('Error fetching token details:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all tokens for an event
router.get('/tokens/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Only available in demo mode
    if (process.env.SKIP_DB_SETUP === 'true' && rsvpService instanceof MockRSVPService) {
      const tokens = await (rsvpService as MockRSVPService).getEventRSVPTokens(eventId);
      res.json({ success: true, data: tokens });
    } else {
      res.status(501).json({ success: false, error: 'Not implemented in production mode' });
    }
  } catch (error) {
    logger.error('Error fetching event tokens:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create or update RSVP response
router.post('/responses', async (req, res) => {
  try {
    // Only available in demo mode
    if (process.env.SKIP_DB_SETUP === 'true' && rsvpService instanceof MockRSVPService) {
      const response = await (rsvpService as MockRSVPService).createRSVPResponse(req.body);
      res.status(201).json({ success: true, data: response });
    } else {
      res.status(501).json({ success: false, error: 'Not implemented in production mode' });
    }
  } catch (error) {
    logger.error('Error creating RSVP response:', error);
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update RSVP response
router.put('/responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await rsvpService.updateRSVPResponse(id, req.body);
    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Error updating RSVP response:', error);
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get RSVP response by guest and event
router.get('/responses/guest/:guestId/event/:eventId', async (req, res) => {
  try {
    const { guestId, eventId } = req.params;
    
    // Only available in demo mode
    if (process.env.SKIP_DB_SETUP === 'true' && rsvpService instanceof MockRSVPService) {
      const response = await (rsvpService as MockRSVPService).getRSVPResponseByGuestAndEvent(guestId, eventId);
      
      if (!response) {
        return res.status(404).json({ success: false, error: 'RSVP response not found' });
      }
      
      res.json({ success: true, data: response });
    } else {
      res.status(501).json({ success: false, error: 'Not implemented in production mode' });
    }
  } catch (error) {
    logger.error('Error fetching RSVP response:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Public registration endpoint
router.post('/public-registration', async (req, res) => {
  try {
    const registration = await rsvpService.submitPublicRSVP(req.body.eventId, req.body);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    logger.error('Error submitting public registration:', error);
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Utility Routes
router.post('/cleanup-expired-tokens', async (req, res) => {
  try {
    const deletedCount = await rsvpService.cleanupExpiredTokens();
    res.json({ deletedTokens: deletedCount });
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;