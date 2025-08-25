const fs = require('fs');
const path = require('path');

// Create a minimal working version of invitation routes for testing
const minimalInvitationRoutes = `import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get invitation schedules for an event
 * GET /api/invitations/event/:eventId
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    logger.info('Getting invitation schedules for event:', eventId);
    
    // Return empty schedules for now
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Error getting invitation schedules:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invitation schedules' 
    });
  }
});

/**
 * Get invitation status for an event
 * GET /api/invitations/status/:eventId
 */
router.get('/status/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    logger.info('Getting invitation status for event:', eventId);
    
    // Return mock status data
    res.json({
      success: true,
      data: {
        eventId,
        eventTitle: 'Demo Event',
        rsvpDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalGuests: 35,
        notInvitedGuests: 0,
        pendingGuests: 2,
        activeSchedules: 0,
        totalInvitationsScheduled: 0,
        totalInvitationsSent: 0
      }
    });
  } catch (error) {
    logger.error('Error getting invitation status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invitation status' 
    });
  }
});

/**
 * Configure invitation schedules for an event
 * POST /api/invitations/configure
 */
router.post('/configure', async (req, res) => {
  try {
    const { eventId, schedules } = req.body;
    logger.info('Configuring invitations for event:', eventId);
    
    if (!eventId || !schedules) {
      return res.status(400).json({ error: 'Event ID and schedules are required' });
    }
    
    // Mock successful creation
    res.json({
      success: true,
      data: schedules.map((schedule, index) => ({
        id: \`schedule-\${Date.now()}-\${index}\`,
        eventId,
        ...schedule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      message: \`Created \${schedules.length} invitation schedules\`
    });
  } catch (error) {
    logger.error('Error configuring invitations:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to configure invitations' 
    });
  }
});

/**
 * Send bulk invitations to all uninvited guests
 * POST /api/invitations/bulk-invite/:eventId
 */
router.post('/bulk-invite/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    logger.info('Sending bulk invitations for event:', eventId);
    
    // Mock successful bulk invitation
    res.json({
      success: true,
      data: {
        guestsInvited: 10,
        invitationsSent: 10,
        invitationsSkipped: 0,
        errors: []
      },
      message: 'Successfully sent 10 invitations to 10 guests'
    });
  } catch (error) {
    logger.error('Error sending bulk invitations:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send bulk invitations' 
    });
  }
});

export default router;
`;

// Backup the original file
const originalFile = path.join(__dirname, 'rsvp-backend/src/routes/invitations.ts');
const backupFile = path.join(__dirname, 'rsvp-backend/src/routes/invitations.ts.backup');

try {
  // Create backup
  if (fs.existsSync(originalFile)) {
    fs.copyFileSync(originalFile, backupFile);
    console.log('✅ Created backup of original invitations.ts');
  }
  
  // Write minimal version
  fs.writeFileSync(originalFile, minimalInvitationRoutes);
  console.log('✅ Created minimal invitation routes');
  console.log('');
  console.log('🔧 What this does:');
  console.log('   - Provides basic invitation API endpoints');
  console.log('   - Returns mock data to test frontend integration');
  console.log('   - Removes complex dependencies that might be causing issues');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Restart your backend server');
  console.log('   2. Test the invitation management page');
  console.log('   3. If it works, we can gradually add back functionality');
  console.log('');
  console.log('🔄 To restore original:');
  console.log('   - The original file is backed up as invitations.ts.backup');
  console.log('   - Copy it back if needed');
  
} catch (error) {
  console.error('❌ Error creating minimal routes:', error.message);
}