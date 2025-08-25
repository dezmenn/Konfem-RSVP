import express from 'express';
import { TableService } from '../services/TableService';
import { MockTableService } from '../services/MockTableService';
import { TableRepository } from '../repositories/TableRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
import { MockVenueElementRepository } from '../services/MockVenueElementRepository';
import { TableInput, TableUpdate } from '../models/Table';

const router = express.Router();

// Initialize service based on environment
let tableService: any;

if (process.env.SKIP_DB_SETUP === 'true') {
  // Use mock service for demo mode
  tableService = new MockTableService();
} else {
  // Use real service with repositories
  const tableRepository = new TableRepository();
  const guestRepository = new GuestRepository();
  const venueElementRepository = new VenueElementRepository();
  tableService = new TableService(tableRepository, guestRepository, venueElementRepository);
}

// GET /api/tables/events/:eventId - Get all tables for an event
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const tables = await tableService.getEventTables(eventId);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// GET /api/tables/:id - Get a specific table with guests
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const table = await tableService.getTable(id);
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

// POST /api/tables - Create a new table
router.post('/', async (req, res) => {
  try {
    const tableData: TableInput = req.body;
    const table = await tableService.createTable(tableData);
    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    if (error instanceof Error && error.message.includes('Validation failed')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create table' });
    }
  }
});

// PUT /api/tables/:id - Update a table
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: TableUpdate = req.body;
    const table = await tableService.updateTable(id, updates);
    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    if (error instanceof Error) {
      if (error.message.includes('Validation failed') || error.message.includes('Cannot reduce capacity')) {
        res.status(400).json({ error: error.message });
      } else if (error.message === 'Table not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update table' });
      }
    } else {
      res.status(500).json({ error: 'Failed to update table' });
    }
  }
});

// DELETE /api/tables/:id - Delete a table
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await tableService.deleteTable(id);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  } catch (error) {
    console.error('Error deleting table:', error);
    if (error instanceof Error && error.message.includes('Cannot delete table')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete table' });
    }
  }
});

// POST /api/tables/:id/lock - Lock a table
router.post('/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const table = await tableService.lockTable(id);
    res.json(table);
  } catch (error) {
    console.error('Error locking table:', error);
    if (error instanceof Error && error.message === 'Table not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to lock table' });
    }
  }
});

// POST /api/tables/:id/unlock - Unlock a table
router.post('/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const table = await tableService.unlockTable(id);
    res.json(table);
  } catch (error) {
    console.error('Error unlocking table:', error);
    if (error instanceof Error && error.message === 'Table not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to unlock table' });
    }
  }
});

// GET /api/tables/events/:eventId/locked - Get locked tables for an event
router.get('/events/:eventId/locked', async (req, res) => {
  try {
    const { eventId } = req.params;
    const tables = await tableService.getLockedTables(eventId);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching locked tables:', error);
    res.status(500).json({ error: 'Failed to fetch locked tables' });
  }
});

// GET /api/tables/events/:eventId/unlocked - Get unlocked tables for an event
router.get('/events/:eventId/unlocked', async (req, res) => {
  try {
    const { eventId } = req.params;
    const tables = await tableService.getUnlockedTables(eventId);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching unlocked tables:', error);
    res.status(500).json({ error: 'Failed to fetch unlocked tables' });
  }
});

// POST /api/tables/:id/assign-guest - Assign a guest to a table
router.post('/:id/assign-guest', async (req, res) => {
  try {
    const { id: tableId } = req.params;
    const { guestId } = req.body;
    
    if (!guestId) {
      return res.status(400).json({ error: 'Guest ID is required' });
    }
    
    await tableService.assignGuestToTable(guestId, tableId);
    res.status(204).send();
  } catch (error) {
    console.error('Error assigning guest to table:', error);
    if (error instanceof Error) {
      if (error.message.includes('full capacity') || error.message.includes('not found')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to assign guest to table' });
      }
    } else {
      res.status(500).json({ error: 'Failed to assign guest to table' });
    }
  }
});

// POST /api/tables/unassign-guest - Unassign a guest from their table
router.post('/unassign-guest', async (req, res) => {
  try {
    const { guestId } = req.body;
    
    if (!guestId) {
      return res.status(400).json({ error: 'Guest ID is required' });
    }
    
    await tableService.unassignGuestFromTable(guestId);
    res.status(204).send();
  } catch (error) {
    console.error('Error unassigning guest from table:', error);
    if (error instanceof Error && error.message === 'Guest not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to unassign guest from table' });
    }
  }
});

// GET /api/tables/events/:eventId/capacity - Get capacity information for all tables
router.get('/events/:eventId/capacity', async (req, res) => {
  try {
    const { eventId } = req.params;
    const capacityInfo = await tableService.getTableCapacityInfo(eventId);
    res.json(capacityInfo);
  } catch (error) {
    console.error('Error fetching table capacity info:', error);
    res.status(500).json({ error: 'Failed to fetch table capacity information' });
  }
});

// GET /api/tables/events/:eventId/validate - Validate table arrangement
router.get('/events/:eventId/validate', async (req, res) => {
  try {
    const { eventId } = req.params;
    const validation = await tableService.validateTableArrangement(eventId);
    res.json(validation);
  } catch (error) {
    console.error('Error validating table arrangement:', error);
    res.status(500).json({ error: 'Failed to validate table arrangement' });
  }
});

// POST /api/tables/:id/duplicate - Duplicate a table
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { offset } = req.body;
    const duplicatedTable = await tableService.duplicateTable(id, offset);
    res.status(201).json(duplicatedTable);
  } catch (error) {
    console.error('Error duplicating table:', error);
    if (error instanceof Error && error.message === 'Table not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to duplicate table' });
    }
  }
});

// POST /api/tables/events/:eventId/auto-arrange - Auto-arrange guests to tables (legacy)
router.post('/events/:eventId/auto-arrange', async (req, res) => {
  try {
    const { eventId } = req.params;
    const options = req.body || {};
    
    const result = await tableService.autoArrangeGuests(eventId, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error during auto-arrangement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Auto-arrangement failed due to server error',
      arrangedGuests: 0
    });
  }
});

// POST /api/tables/events/:eventId/auto-arrange-enhanced - Enhanced auto-arrangement with venue optimization
router.post('/events/:eventId/auto-arrange-enhanced', async (req, res) => {
  try {
    const { eventId } = req.params;
    const constraints = req.body || {};
    
    // Check if the service has the enhanced method
    if ('autoArrangeGuestsEnhanced' in tableService) {
      const result = await (tableService as any).autoArrangeGuestsEnhanced(eventId, constraints);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } else {
      // Fallback to legacy method if enhanced method is not available
      const legacyOptions = {
        respectRelationships: constraints.respectRelationships,
        balanceBrideGroomSides: constraints.balanceBrideGroomSides,
        considerDietaryRestrictions: constraints.considerDietaryRestrictions,
        keepFamiliesTogether: constraints.keepFamiliesTogether,
        maxGuestsPerTable: constraints.maxGuestsPerTable
      };
      
      const result = await (tableService as any).autoArrangeGuests(eventId, legacyOptions);
      
      // Convert legacy result to enhanced format
      const enhancedResult = {
        ...result,
        tableAssignments: new Map(),
        conflicts: [],
        score: result.success ? 0.8 : 0
      };
      
      if (result.success) {
        res.json(enhancedResult);
      } else {
        res.status(400).json(enhancedResult);
      }
    }
  } catch (error) {
    console.error('Error during enhanced auto-arrangement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Enhanced auto-arrangement failed due to server error',
      arrangedGuests: 0,
      tableAssignments: new Map(),
      conflicts: [],
      score: 0
    });
  }
});

export default router;