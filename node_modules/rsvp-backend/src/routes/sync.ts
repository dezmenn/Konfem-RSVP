import express from 'express';
import { SyncQueueService } from '../services/SyncQueueService';
import { logger } from '../utils/logger';

const router = express.Router();
const syncQueueService = SyncQueueService.getInstance();

// Get sync queue status
router.get('/status', (req, res) => {
  try {
    const status = syncQueueService.getQueueStatus();
    const pendingOperations = syncQueueService.getPendingOperations();
    const failedOperations = syncQueueService.getFailedOperations();
    const conflicts = syncQueueService.getConflicts();

    res.json({
      status,
      pendingCount: pendingOperations.length,
      failedCount: failedOperations.length,
      conflictCount: conflicts.size,
      pendingOperations: pendingOperations.slice(0, 10), // Limit to first 10
      failedOperations: failedOperations.slice(0, 10),
      conflicts: Array.from(conflicts.entries()).slice(0, 5)
    });
  } catch (error) {
    logger.error('Failed to get sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Add sync operation
router.post('/operations', (req, res) => {
  try {
    const { type, entity, entityId, data, eventId, userId, maxRetries = 3 } = req.body;

    if (!type || !entity || !entityId || !eventId) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, entity, entityId, eventId' 
      });
    }

    const operationId = syncQueueService.addOperation({
      type,
      entity,
      entityId,
      data,
      eventId,
      userId,
      timestamp: new Date(),
      maxRetries
    });

    res.json({ 
      success: true, 
      operationId,
      message: 'Sync operation added to queue'
    });
  } catch (error) {
    logger.error('Failed to add sync operation:', error);
    res.status(500).json({ error: 'Failed to add sync operation' });
  }
});

// Retry failed operations
router.post('/retry-failed', async (req, res) => {
  try {
    const failedOperations = syncQueueService.getFailedOperations();
    const retryPromises = failedOperations.map(op => {
      op.retryCount = 0;
      op.status = 'pending';
      return syncQueueService.processOperation(op.id);
    });

    await Promise.all(retryPromises);

    res.json({ 
      success: true, 
      message: `Retrying ${failedOperations.length} failed operations`
    });
  } catch (error) {
    logger.error('Failed to retry operations:', error);
    res.status(500).json({ error: 'Failed to retry operations' });
  }
});

// Resolve conflict
router.post('/conflicts/:operationId/resolve', async (req, res) => {
  try {
    const { operationId } = req.params;
    const { resolution, mergedData } = req.body;

    if (!['client_wins', 'server_wins', 'merge', 'manual'].includes(resolution)) {
      return res.status(400).json({ 
        error: 'Invalid resolution type. Must be: client_wins, server_wins, merge, or manual' 
      });
    }

    await syncQueueService.applyConflictResolution({
      operationId,
      resolution,
      mergedData,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: `Conflict resolved with strategy: ${resolution}`
    });
  } catch (error) {
    logger.error('Failed to resolve conflict:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// Clear completed operations
router.delete('/completed', (req, res) => {
  try {
    syncQueueService.clearCompletedOperations();
    res.json({ 
      success: true, 
      message: 'Completed operations cleared'
    });
  } catch (error) {
    logger.error('Failed to clear completed operations:', error);
    res.status(500).json({ error: 'Failed to clear completed operations' });
  }
});

// Get pending operations for a specific event
router.get('/events/:eventId/pending', (req, res) => {
  try {
    const { eventId } = req.params;
    const pendingOperations = syncQueueService.getPendingOperations()
      .filter(op => op.eventId === eventId);

    res.json({
      eventId,
      pendingOperations,
      count: pendingOperations.length
    });
  } catch (error) {
    logger.error('Failed to get pending operations:', error);
    res.status(500).json({ error: 'Failed to get pending operations' });
  }
});

export default router;