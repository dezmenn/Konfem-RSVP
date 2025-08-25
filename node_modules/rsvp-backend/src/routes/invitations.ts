import express from 'express';
import { GuestService } from '../services/GuestService';
import { MockGuestService } from '../services/MockGuestService';
import { GuestRepository } from '../repositories/GuestRepository';
import { WhatsAppMockService } from '../services/WhatsAppMockService';
import { MessagingService } from '../services/MessagingService';

const router = express.Router();

// In-memory storage for invitation schedules (for demo mode)
interface InvitationSchedule {
  id: string;
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchedules: Map<string, InvitationSchedule[]> = new Map();

// Helper functions for schedule management
function getSchedulesForEvent(eventId: string): InvitationSchedule[] {
  return invitationSchedules.get(eventId) || [];
}

function addScheduleToEvent(eventId: string, schedule: InvitationSchedule): void {
  const existingSchedules = getSchedulesForEvent(eventId);
  existingSchedules.push(schedule);
  invitationSchedules.set(eventId, existingSchedules);
}

function updateScheduleInEvent(eventId: string, scheduleId: string, updates: Partial<InvitationSchedule>): InvitationSchedule | null {
  const schedules = getSchedulesForEvent(eventId);
  const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
  
  if (scheduleIndex === -1) return null;
  
  schedules[scheduleIndex] = { ...schedules[scheduleIndex], ...updates, updatedAt: new Date() };
  invitationSchedules.set(eventId, schedules);
  
  return schedules[scheduleIndex];
}

function deleteScheduleFromEvent(eventId: string, scheduleId: string): boolean {
  const schedules = getSchedulesForEvent(eventId);
  const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
  
  if (scheduleIndex === -1) return false;
  
  schedules.splice(scheduleIndex, 1);
  invitationSchedules.set(eventId, schedules);
  
  return true;
}

// Lazy initialization of services to avoid database connection issues
let guestService: GuestService | MockGuestService;
let messagingService: MessagingService;

function getGuestService(): GuestService | MockGuestService {
  if (!guestService) {
    // Use mock service in demo mode (when database is skipped)
    if (process.env.SKIP_DB_SETUP === 'true') {
      guestService = new MockGuestService();
    } else {
      const guestRepository = new GuestRepository();
      guestService = new GuestService(guestRepository);
    }
  }
  return guestService;
}

function getMessagingService(): MessagingService | null {
  try {
    if (!messagingService) {
      // Get the global WhatsApp service instance (initialized in server.ts)
      const whatsAppService = (global as any).whatsAppMockService;
      if (!whatsAppService) {
        console.warn('WhatsApp service not initialized - messaging features will be disabled');
        return null;
      }
      
      // Create a custom messaging service that bypasses repository lookups in demo mode
      if (process.env.SKIP_DB_SETUP === 'true') {
        // In demo mode, create a simplified messaging service that works with our guest data
        messagingService = {
          sendInvitation: async (guestId: string, eventId: string, templateContent: string) => {
            try {
              // Get the guest data to find their phone number
              const guests = await getGuestService().getGuestsByEvent(eventId);
              const guest = guests.find(g => g.id === guestId);
              
              if (!guest) {
                throw new Error(`Guest with ID ${guestId} not found`);
              }
              
              // Send message directly via WhatsApp service using guest's actual phone
              const result = await whatsAppService.sendMessage(
                guest.phoneNumber,
                templateContent,
                `invitation-${guestId}-${Date.now()}`
              );
              
              if (result.success) {
                return {
                  id: `msg-${Date.now()}`,
                  to: guest.phoneNumber,
                  content: templateContent,
                  messageType: 'invitation',
                  status: 'sent',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
              } else {
                throw new Error(result.error || 'Failed to send message');
              }
            } catch (error) {
              throw new Error(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          
          sendReminder: async (guestId: string, eventId: string, reminderContent: string) => {
            try {
              // Get the guest data to find their phone number
              const guests = await getGuestService().getGuestsByEvent(eventId);
              const guest = guests.find(g => g.id === guestId);
              
              if (!guest) {
                throw new Error(`Guest with ID ${guestId} not found`);
              }
              
              // Send message directly via WhatsApp service using guest's actual phone
              const result = await whatsAppService.sendMessage(
                guest.phoneNumber,
                reminderContent,
                `reminder-${guestId}-${Date.now()}`
              );
              
              if (result.success) {
                return {
                  id: `msg-${Date.now()}`,
                  to: guest.phoneNumber,
                  content: reminderContent,
                  messageType: 'reminder',
                  status: 'sent',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
              } else {
                throw new Error(result.error || 'Failed to send message');
              }
            } catch (error) {
              throw new Error(`Failed to send reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } as any;
      } else {
        // In production mode, use the full MessagingService
        messagingService = new MessagingService(whatsAppService);
      }
    }
    return messagingService;
  } catch (error) {
    console.error('Error initializing messaging service:', error);
    return null;
  }
}

/**
 * Get invitation schedules for an event
 * GET /api/invitations/event/:eventId
 */
router.get('/event/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    
    // Get schedules from in-memory storage
    const schedules = getSchedulesForEvent(eventId);
    
    console.log(`GET /api/invitations/event/${eventId} - Found ${schedules.length} schedules`);
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error: any) {
    console.error('Error getting invitation schedules:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invitation schedules' 
    });
  }
});

/**
 * Get invitation status for an event
 * GET /api/invitations/status/:eventId
 */
router.get('/status/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    
    // Get real guest data from the guest service
    const guests = await getGuestService().getGuestsByEvent(eventId);
    
    // Calculate invitation statistics from real data
    const totalGuests = guests.length;
    const pendingGuests = guests.filter(guest => guest.rsvpStatus === 'pending').length;
    const acceptedGuests = guests.filter(guest => guest.rsvpStatus === 'accepted').length;
    const declinedGuests = guests.filter(guest => guest.rsvpStatus === 'declined').length;
    
    // Calculate not invited guests - check for guests with not_invited status
    const notInvitedGuests = guests.filter(guest => 
      guest.rsvpStatus === 'not_invited'
    ).length;
    
    // Get schedule data from in-memory storage
    const schedules = getSchedulesForEvent(eventId);
    const activeSchedules = schedules.filter(s => s.isActive).length;
    
    // Calculate total invitations sent (total minus not invited)
    const totalInvitationsSent = totalGuests - notInvitedGuests;
    
    res.json({
      success: true,
      data: {
        eventId,
        eventTitle: 'Sarah & John\'s Wedding',
        rsvpDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalGuests,
        notInvitedGuests,
        pendingGuests,
        acceptedGuests,
        declinedGuests,
        activeSchedules,
        totalInvitationsScheduled: schedules.length,
        totalInvitationsSent
      }
    });
  } catch (error: any) {
    console.error('Error getting invitation status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invitation status' 
    });
  }
});

/**
 * Get invitation execution history for an event
 * GET /api/invitations/executions/:eventId
 */
router.get('/executions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // In the current mock implementation, we don't store execution history.
    // We will return an empty array to prevent 404 errors on the client.
    console.log(`GET /api/invitations/executions/${eventId} - Returning empty array (mock)`);
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Error getting invitation executions:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get invitation executions'
    });
  }
});

/**
 * Configure invitation schedules for an event
 * POST /api/invitations/configure
 */
router.post('/configure', async (req: any, res: any) => {
  try {
    const { eventId, schedules } = req.body;
    
    console.log('POST /api/invitations/configure called with:', { eventId, schedulesCount: schedules?.length });
    
    if (!eventId || !schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Event ID and schedules array are required' });
    }
    
    // Create and store schedules
    const createdSchedules = schedules.map((schedule: any, index: number) => {
      const newSchedule: InvitationSchedule = {
        id: `schedule-${Date.now()}-${index}`,
        eventId,
        triggerDays: schedule.triggerDays || 0,
        messageTemplate: schedule.messageTemplate || 'Default invitation message',
        isActive: schedule.isActive !== undefined ? schedule.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store the schedule in memory
      addScheduleToEvent(eventId, newSchedule);
      
      return newSchedule;
    });
    
    console.log('Created and stored schedules:', createdSchedules.length);
    
    res.json({
      success: true,
      data: createdSchedules,
      message: `Created ${createdSchedules.length} invitation schedules`
    });
  } catch (error: any) {
    console.error('Error in POST /api/invitations/configure:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to configure invitations' 
    });
  }
});

/**
 * Send bulk invitations to all uninvited guests
 * POST /api/invitations/bulk-invite/:eventId
 */
router.post('/bulk-invite/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    
    console.log('POST /api/invitations/bulk-invite called for event:', eventId);
    
    // Get real guest data from the guest service
    const guests = await getGuestService().getGuestsByEvent(eventId);
    
    // Find guests who haven't been invited yet
    const uninvitedGuests = guests.filter(guest => 
      guest.rsvpStatus === 'not_invited'
    );
    
    if (uninvitedGuests.length === 0) {
      return res.json({
        success: true,
        data: {
          guestsInvited: 0,
          invitationsSent: 0,
          invitationsSkipped: 0,
          errors: []
        },
        message: 'No uninvited guests found - all guests have already been invited'
      });
    }
    
    console.log(`Bulk invitation: Found ${guests.length} total guests, ${uninvitedGuests.length} uninvited guests`);
    
    // Get messaging service and send invitations
    const messagingService = getMessagingService();
    let invitationsSent = 0;
    let invitationsSkipped = 0;
    const errors: string[] = [];
    
    // Default invitation message template
    const defaultInvitationTemplate = `Hi {{guestName}},

You're invited to Sarah & John's Wedding on {{eventDate}} at {{eventLocation}}!

We're excited to celebrate with you. Please let us know if you can make it by {{rsvpDeadline}} by clicking the link below:

{{rsvpLink}}

Looking forward to seeing you there!

Best regards,
Sarah & John`;
    
    // Send invitations to each uninvited guest
    for (const guest of uninvitedGuests) {
      try {
        // Personalize the message
        const personalizedMessage = defaultInvitationTemplate
          .replace(/\{\{guestName\}\}/g, guest.name)
          .replace(/\{\{eventTitle\}\}/g, "Sarah & John's Wedding")
          .replace(/\{\{eventDate\}\}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString())
          .replace(/\{\{eventLocation\}\}/g, "Grand Ballroom, Hotel Majestic")
          .replace(/\{\{rsvpDeadline\}\}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
          .replace(/\{\{rsvpLink\}\}/g, `http://localhost:3000/rsvp/${guest.id}`)
          .replace(/\{\{organizerName\}\}/g, "Sarah & John");
        
        if (messagingService) {
          try {
            // Send invitation via WhatsApp
            const message = await messagingService.sendInvitation(guest.id, eventId, personalizedMessage);
            
            // Update guest status to pending after successful invitation
            await getGuestService().updateGuest(guest.id, { rsvpStatus: 'pending' }, eventId);
            invitationsSent++;
            console.log(`✅ Sent invitation to ${guest.name} (${guest.phoneNumber}) - Message ID: ${message.id}`);
          } catch (error) {
            invitationsSkipped++;
            const errorMsg = `Failed to send invitation to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        } else {
          // Fallback: Update status without sending message (for demo/testing)
          await getGuestService().updateGuest(guest.id, { rsvpStatus: 'pending' }, eventId);
          invitationsSent++;
          console.log(`✅ Updated status for ${guest.name} (WhatsApp service not available)`);
        }
      } catch (error) {
        invitationsSkipped++;
        const errorMsg = `Error sending invitation to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`Bulk invitation completed: ${invitationsSent} sent, ${invitationsSkipped} skipped`);
    
    res.json({
      success: true,
      data: {
        guestsInvited: uninvitedGuests.length,
        invitationsSent,
        invitationsSkipped,
        errors
      },
      message: invitationsSent > 0 
        ? `Successfully sent ${invitationsSent} invitations to guests. ${invitationsSkipped > 0 ? `${invitationsSkipped} failed.` : ''}`
        : `Failed to send invitations. ${errors.length} errors occurred.`
    });
  } catch (error: any) {
    console.error('Error in POST /api/invitations/bulk-invite:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send bulk invitations' 
    });
  }
});

/**
 * Delete an invitation schedule
 * DELETE /api/invitations/schedule/:scheduleId
 */
router.delete('/schedule/:scheduleId', async (req: any, res: any) => {
  try {
    const { scheduleId } = req.params;
    
    console.log('DELETE /api/invitations/schedule called for:', scheduleId);
    
    // Find the schedule across all events to delete it
    let deleted = false;
    for (const [eventId, schedules] of invitationSchedules.entries()) {
      if (deleteScheduleFromEvent(eventId, scheduleId)) {
        deleted = true;
        break;
      }
    }
    
    if (!deleted) {
      return res.status(404).json({ error: 'Invitation schedule not found' });
    }
    
    res.json({
      success: true,
      message: 'Invitation schedule deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/invitations/schedule:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete invitation schedule' 
    });
  }
});

/**
 * Toggle invitation schedule active status
 * POST /api/invitations/schedule/:scheduleId/toggle
 */
router.post('/schedule/:scheduleId/toggle', async (req: any, res: any) => {
  try {
    const { scheduleId } = req.params;
    const { isActive } = req.body;
    
    console.log('POST /api/invitations/schedule/toggle called for:', scheduleId, 'isActive:', isActive);
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }
    
    // Find and update the schedule across all events
    let updatedSchedule: InvitationSchedule | null = null;
    for (const [eventId, schedules] of invitationSchedules.entries()) {
      updatedSchedule = updateScheduleInEvent(eventId, scheduleId, { isActive });
      if (updatedSchedule) {
        break;
      }
    }
    
    if (!updatedSchedule) {
      return res.status(404).json({ error: 'Invitation schedule not found' });
    }
    
    res.json({
      success: true,
      data: updatedSchedule,
      message: `Invitation schedule ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Error in POST /api/invitations/schedule/toggle:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to toggle invitation schedule' 
    });
  }
});

/**
 * Execute all active invitation schedules for an event
 * POST /api/invitations/execute-all/:eventId
 */
router.post('/execute-all/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    
    console.log('POST /api/invitations/execute-all called for event:', eventId);
    
    // Get active schedules for the event
    const schedules = getSchedulesForEvent(eventId);
    const activeSchedules = schedules.filter(s => s.isActive);
    
    if (activeSchedules.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No active invitation schedules found to execute'
      });
    }
    
    // Get real guest data - schedules work like reminders, targeting pending guests
    const guests = await getGuestService().getGuestsByEvent(eventId);
    const targetGuests = guests.filter(guest => 
      guest.rsvpStatus === 'pending'
    );
    
    if (targetGuests.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No pending guests found to send reminders to'
      });
    }
    
    console.log(`Executing ${activeSchedules.length} schedules for ${targetGuests.length} pending guests`);
    
    // Get messaging service and send reminders
    const messagingService = getMessagingService();
    const executionResults = [];
    
    // Execute each active schedule
    for (const schedule of activeSchedules) {
      let remindersSent = 0;
      let remindersSkipped = 0;
      const errors: string[] = [];
      
      // Send reminders to each pending guest
      for (const guest of targetGuests) {
        try {
          // Personalize the message using the schedule template
          const personalizedMessage = schedule.messageTemplate
            .replace(/\{\{guestName\}\}/g, guest.name)
            .replace(/\{\{eventTitle\}\}/g, "Sarah & John's Wedding")
            .replace(/\{\{eventDate\}\}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString())
            .replace(/\{\{eventLocation\}\}/g, "Grand Ballroom, Hotel Majestic")
            .replace(/\{\{rsvpDeadline\}\}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
            .replace(/\{\{rsvpLink\}\}/g, `http://localhost:3000/rsvp/${guest.id}`)
            .replace(/\{\{organizerName\}\}/g, "Sarah & John");
          
          if (messagingService) {
            try {
              // Send reminder via WhatsApp
              const message = await messagingService.sendReminder(guest.id, eventId, personalizedMessage);
              
              remindersSent++;
              console.log(`✅ Sent reminder to ${guest.name} (${guest.phoneNumber}) via schedule ${schedule.id} - Message ID: ${message.id}`);
            } catch (error) {
              remindersSkipped++;
              const errorMsg = `Failed to send reminder to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          } else {
            // Fallback: Log reminder without sending (for demo/testing)
            remindersSent++;
            console.log(`✅ Logged reminder for ${guest.name} (WhatsApp service not available)`);
          }
        } catch (error) {
          remindersSkipped++;
          const errorMsg = `Error sending reminder to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      executionResults.push({
        scheduleId: schedule.id,
        triggerDays: schedule.triggerDays,
        guestsProcessed: targetGuests.length,
        invitationsScheduled: remindersSent,
        invitationsSkipped: remindersSkipped,
        errors
      });
    }
    
    const totalReminders = executionResults.reduce((sum, result) => sum + result.invitationsScheduled, 0);
    const totalErrors = executionResults.reduce((sum, result) => sum + result.errors.length, 0);
    
    console.log(`Execute all completed: ${totalReminders} reminders sent, ${totalErrors} errors`);
    
    res.json({
      success: true,
      data: executionResults,
      message: `Executed ${activeSchedules.length} invitation schedules, sent ${totalReminders} reminders to pending guests${totalErrors > 0 ? ` with ${totalErrors} errors` : ''}`
    });
  } catch (error: any) {
    console.error('Error executing all invitations:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute all invitations' 
    });
  }
});

/**
 * Execute a specific invitation schedule
 * POST /api/invitations/execute/:scheduleId
 */
router.post('/execute/:scheduleId', async (req: any, res: any) => {
  try {
    const { scheduleId } = req.params;
    
    console.log('POST /api/invitations/execute called for schedule:', scheduleId);
    
    // Find the schedule across all events
    let targetSchedule: InvitationSchedule | null = null;
    let eventId: string | null = null;
    
    for (const [eId, schedules] of invitationSchedules.entries()) {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        targetSchedule = schedule;
        eventId = eId;
        break;
      }
    }
    
    if (!targetSchedule || !eventId) {
      return res.status(404).json({ error: 'Invitation schedule not found' });
    }
    
    if (!targetSchedule.isActive) {
      return res.status(400).json({ error: 'Cannot execute inactive invitation schedule' });
    }
    
    // Get real guest data for the event - schedules work like reminders, targeting pending guests
    const guests = await getGuestService().getGuestsByEvent(eventId);
    const targetGuests = guests.filter(guest => 
      guest.rsvpStatus === 'pending'
    );
    
    if (targetGuests.length === 0) {
      return res.json({
        success: true,
        data: {
          scheduleId,
          eventId,
          guestsProcessed: 0,
          invitationsScheduled: 0,
          invitationsSkipped: 0,
          errors: []
        },
        message: 'No pending guests found to send reminders to'
      });
    }
    
    console.log(`Executing schedule ${scheduleId} for ${targetGuests.length} pending guests`);
    
    // Get messaging service and send reminders
    const messagingService = getMessagingService();
    let remindersSent = 0;
    let remindersSkipped = 0;
    const errors: string[] = [];
    
    // Send reminders to each pending guest
    for (const guest of targetGuests) {
      try {
        // Personalize the message using the schedule template
        const personalizedMessage = targetSchedule.messageTemplate
          .replace(/\{\{guestName\}\}/g, guest.name)
          .replace(/\{\{eventTitle\}\}/g, "Sarah & John's Wedding")
          .replace(/\{\{eventDate\}\}/g, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString())
          .replace(/\{\{eventLocation\}\}/g, "Grand Ballroom, Hotel Majestic")
          .replace(/\{\{rsvpDeadline\}\}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
          .replace(/\{\{rsvpLink\}\}/g, `http://localhost:3000/rsvp/${guest.id}`)
          .replace(/\{\{organizerName\}\}/g, "Sarah & John");
        
        if (messagingService) {
          try {
            // Send reminder via WhatsApp
            const message = await messagingService.sendReminder(guest.id, eventId, personalizedMessage);
            
            remindersSent++;
            console.log(`✅ Sent reminder to ${guest.name} (${guest.phoneNumber}) via schedule ${scheduleId} - Message ID: ${message.id}`);
          } catch (error) {
            remindersSkipped++;
            const errorMsg = `Failed to send reminder to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        } else {
          // Fallback: Log reminder without sending (for demo/testing)
          remindersSent++;
          console.log(`✅ Logged reminder for ${guest.name} (WhatsApp service not available)`);
        }
      } catch (error) {
        remindersSkipped++;
        const errorMsg = `Error sending reminder to ${guest.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`Individual schedule execution completed: ${remindersSent} reminders sent, ${remindersSkipped} skipped`);
    
    res.json({
      success: true,
      data: {
        scheduleId,
        eventId,
        guestsProcessed: targetGuests.length,
        invitationsScheduled: remindersSent,
        invitationsSkipped: remindersSkipped,
        errors
      },
      message: `Successfully executed invitation schedule. Sent ${remindersSent} reminders to pending guests.${remindersSkipped > 0 ? ` ${remindersSkipped} failed.` : ''}`
    });
  } catch (error: any) {
    console.error('Error executing invitation schedule:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute invitation schedule' 
    });
  }
});

/**
 * Create default invitation schedules for an event
 * POST /api/invitations/defaults/:eventId
 */
router.post('/defaults/:eventId', async (req: any, res: any) => {
  try {
    const { eventId } = req.params;
    
    console.log('POST /api/invitations/defaults called for event:', eventId);
    
    // Create default reminder schedules
    const defaultSchedules = [
      {
        triggerDays: 7,
        messageTemplate: `Hi {{guestName}},

This is a friendly reminder about {{eventTitle}} on {{eventDate}} at {{eventLocation}}.

We haven't received your RSVP yet and the deadline is {{rsvpDeadline}}. Please let us know if you can make it by clicking the link below:

{{rsvpLink}}

Looking forward to celebrating with you!

Best regards,
{{organizerName}}`,
        isActive: true
      },
      {
        triggerDays: 3,
        messageTemplate: `Hi {{guestName}},

Just a quick reminder that {{eventTitle}} is coming up on {{eventDate}} at {{eventLocation}}.

We still need your RSVP! The deadline is {{rsvpDeadline}}. Please respond as soon as possible:

{{rsvpLink}}

We hope to see you there!

Best regards,
{{organizerName}}`,
        isActive: true
      },
      {
        triggerDays: 1,
        messageTemplate: `Hi {{guestName}},

Final reminder: {{eventTitle}} is tomorrow ({{eventDate}}) at {{eventLocation}}.

This is your last chance to RSVP! The deadline is {{rsvpDeadline}}:

{{rsvpLink}}

We really hope you can join us!

Best regards,
{{organizerName}}`,
        isActive: true
      }
    ];
    
    // Create and store the default schedules
    const createdSchedules = defaultSchedules.map((schedule, index) => {
      const newSchedule: InvitationSchedule = {
        id: `default-schedule-${Date.now()}-${index}`,
        eventId,
        triggerDays: schedule.triggerDays,
        messageTemplate: schedule.messageTemplate,
        isActive: schedule.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      addScheduleToEvent(eventId, newSchedule);
      return newSchedule;
    });
    
    console.log('Created default schedules:', createdSchedules.length);
    
    res.json({
      success: true,
      data: createdSchedules,
      message: `Created ${createdSchedules.length} default invitation schedules`
    });
  } catch (error: any) {
    console.error('Error creating default invitations:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create default invitations' 
    });
  }
});

// Simple test route
router.post('/test', (req: any, res: any) => {
  console.log('POST /api/invitations/test called');
  res.json({ success: true, message: 'POST route is working!' });
});

export default router;