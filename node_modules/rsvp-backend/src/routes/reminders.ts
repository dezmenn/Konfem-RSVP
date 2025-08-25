import express from 'express';
import { ReminderService } from '../services/ReminderService';
import { MessagingService } from '../services/MessagingService';
import { WhatsAppMockService } from '../services/WhatsAppMockService';
import { MessageRepository } from '../repositories/MessageRepository';
import { EventRepository } from '../repositories/EventRepository';
import { MockEventService } from '../services/MockEventService';
import { MockGuestRepository } from '../services/MockGuestRepository';
import { ReminderScheduleModel } from '../models/ReminderSchedule';
import { logger } from '../utils/logger';

const router = express.Router();

// Lazy initialization of services to avoid database connection issues
let reminderService: ReminderService;

function getReminderService(): ReminderService {
  if (!reminderService) {
    // Use the global WhatsApp service instance if available (demo mode)
    const globalWhatsAppService = (global as any).whatsAppMockService;
    let whatsAppService: WhatsAppMockService;
    
    if (globalWhatsAppService) {
      whatsAppService = globalWhatsAppService;
    } else {
      // Fallback to creating new instance
      const messageRepository = new MessageRepository();
      whatsAppService = new WhatsAppMockService(messageRepository);
    }
    
    const messagingService = new MessagingService(whatsAppService);
    
    // Use mock services in demo mode
    if (process.env.SKIP_DB_SETUP === 'true') {
      const mockEventService = new MockEventService();
      const mockGuestRepository = new MockGuestRepository();
      reminderService = new ReminderService(messagingService, mockEventService, mockGuestRepository);
    } else {
      reminderService = new ReminderService(messagingService);
    }
  }
  return reminderService;
}

/**
 * Configure reminder schedules for an event
 * POST /api/reminders/configure
 */
router.post('/configure', async (req, res) => {
  try {
    const { eventId, schedules } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: 'Schedules array is required' });
    }

    // Validate each schedule
    for (const schedule of schedules) {
      if (typeof schedule.triggerDays !== 'number' || schedule.triggerDays < 0) {
        return res.status(400).json({ 
          error: `Invalid trigger days: ${schedule.triggerDays}. Must be a non-negative number.` 
        });
      }

      if (!schedule.messageTemplate || typeof schedule.messageTemplate !== 'string') {
        return res.status(400).json({ 
          error: 'Message template is required for each schedule' 
        });
      }
    }

    const reminderSchedules = await getReminderService().configureReminders({
      eventId,
      schedules
    });

    res.json({
      success: true,
      data: reminderSchedules,
      message: `Created ${reminderSchedules.length} reminder schedules`
    });
  } catch (error) {
    logger.error('Error configuring reminders:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to configure reminders' 
    });
  }
});

/**
 * Get reminder schedules for an event
 * GET /api/reminders/event/:eventId
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const schedules = await getReminderService().getReminderSchedules(eventId);

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    logger.error('Error getting reminder schedules:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get reminder schedules' 
    });
  }
});

/**
 * Update a reminder schedule
 * PUT /api/reminders/schedule/:scheduleId
 */
router.put('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const update = req.body;

    const updatedSchedule = await getReminderService().updateReminderSchedule(scheduleId, update);

    if (!updatedSchedule) {
      return res.status(404).json({ error: 'Reminder schedule not found' });
    }

    res.json({
      success: true,
      data: updatedSchedule,
      message: 'Reminder schedule updated successfully'
    });
  } catch (error) {
    logger.error('Error updating reminder schedule:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update reminder schedule' 
    });
  }
});

/**
 * Delete a reminder schedule
 * DELETE /api/reminders/schedule/:scheduleId
 */
router.delete('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const deleted = await getReminderService().deleteReminderSchedule(scheduleId);

    if (!deleted) {
      return res.status(404).json({ error: 'Reminder schedule not found' });
    }

    res.json({
      success: true,
      message: 'Reminder schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting reminder schedule:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete reminder schedule' 
    });
  }
});

/**
 * Activate or deactivate a reminder schedule
 * POST /api/reminders/schedule/:scheduleId/toggle
 */
router.post('/schedule/:scheduleId/toggle', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    const updatedSchedule = await getReminderService().setReminderScheduleActive(scheduleId, isActive);

    if (!updatedSchedule) {
      return res.status(404).json({ error: 'Reminder schedule not found' });
    }

    res.json({
      success: true,
      data: updatedSchedule,
      message: `Reminder schedule ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Error toggling reminder schedule:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to toggle reminder schedule' 
    });
  }
});

/**
 * Execute scheduled reminders manually
 * POST /api/reminders/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const results = await getReminderService().executeScheduledReminders();

    const summary = {
      totalExecutions: results.length,
      totalGuestsProcessed: results.reduce((sum, r) => sum + r.guestsProcessed, 0),
      totalRemindersScheduled: results.reduce((sum, r) => sum + r.remindersScheduled, 0),
      totalRemindersSkipped: results.reduce((sum, r) => sum + r.remindersSkipped, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
    };

    res.json({
      success: true,
      data: {
        executions: results,
        summary
      },
      message: `Executed ${results.length} reminder schedules`
    });
  } catch (error) {
    logger.error('Error executing scheduled reminders:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute scheduled reminders' 
    });
  }
});

/**
 * Get reminder status for an event
 * GET /api/reminders/status/:eventId
 */
router.get('/status/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const status = await getReminderService().getReminderStatus(eventId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting reminder status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get reminder status' 
    });
  }
});

/**
 * Execute reminders for a specific schedule
 * POST /api/reminders/execute/:scheduleId
 */
router.post('/execute/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const result = await getReminderService().executeReminders(scheduleId);

    res.json({
      success: true,
      data: result,
      message: `Executed reminders for schedule ${scheduleId}`
    });
  } catch (error) {
    logger.error('Error executing reminders:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute reminders' 
    });
  }
});

/**
 * Execute all active reminders for an event
 * POST /api/reminders/execute-all/:eventId
 */
router.post('/execute-all/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const results = await getReminderService().executeAllReminders(eventId);

    const totalReminders = results.reduce((sum, r) => sum + r.remindersScheduled, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    res.json({
      success: true,
      data: results,
      message: `Executed ${results.length} reminder schedules, sent ${totalReminders} reminders${totalErrors > 0 ? ` with ${totalErrors} errors` : ''}`
    });
  } catch (error) {
    logger.error('Error executing all reminders:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute all reminders' 
    });
  }
});

/**
 * Get reminder execution history for an event
 * GET /api/reminders/executions/:eventId
 */
router.get('/executions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const executions = await getReminderService().getReminderExecutions(eventId);

    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    logger.error('Error getting reminder executions:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get reminder executions' 
    });
  }
});

/**
 * Create default reminder schedules for an event
 * POST /api/reminders/defaults/:eventId
 */
router.post('/defaults/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const schedules = await getReminderService().createDefaultReminders(eventId);

    res.json({
      success: true,
      data: schedules,
      message: `Created ${schedules.length} default reminder schedules`
    });
  } catch (error) {
    logger.error('Error creating default reminders:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create default reminders' 
    });
  }
});

/**
 * Get reminder statistics for an event
 * GET /api/reminders/statistics/:eventId
 */
router.get('/statistics/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const statistics = await getReminderService().getReminderStatistics(eventId);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting reminder statistics:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get reminder statistics' 
    });
  }
});

/**
 * Get default reminder template
 * GET /api/reminders/template/default
 */
router.get('/template/default', async (req, res) => {
  try {
    const defaultTemplate = ReminderScheduleModel.getDefaultTemplate();

    res.json({
      success: true,
      data: {
        template: defaultTemplate,
        availableVariables: [
          '{{guestName}}',
          '{{eventTitle}}',
          '{{eventDate}}',
          '{{eventTime}}',
          '{{eventLocation}}',
          '{{rsvpDeadline}}',
          '{{rsvpLink}}',
          '{{organizerName}}'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting default template:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get default template' 
    });
  }
});

export default router;