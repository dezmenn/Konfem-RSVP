import { Router, Request, Response } from 'express';
import { GuestService } from '../services/GuestService';
import { MockGuestService } from '../services/MockGuestService';
import { GuestRepository } from '../repositories/GuestRepository';
import { getPool } from '../config/database';
import multer from 'multer';

const router = Router();

// Lazy initialization of services to avoid database connection issues
let guestService: GuestService | MockGuestService;

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// GET /api/guests/:eventId - Get all guests for an event
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const guests = await getGuestService().getGuestsByEvent(eventId);
    res.json({ success: true, data: guests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/guests/:eventId/search - Search guests with filters
router.get('/:eventId/search', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { rsvpStatus, relationshipType, brideOrGroomSide, search } = req.query;

    const filters = {
      eventId,
      rsvpStatus: rsvpStatus as string,
      relationshipType: relationshipType as string,
      brideOrGroomSide: brideOrGroomSide as 'bride' | 'groom',
      search: search as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const guests = await getGuestService().searchGuests(filters);
    res.json({ success: true, data: guests });
  } catch (error) {
    console.error('Error searching guests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/guests/:eventId/analytics - Get guest analytics for an event
router.get('/:eventId/analytics', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const analytics = await getGuestService().getGuestAnalytics(eventId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching guest analytics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/guests/guest/:id - Get a specific guest
router.get('/guest/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guest = await getGuestService().getGuest(id);
    
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests - Create a new guest
router.post('/', async (req: Request, res: Response) => {
  try {
    const guestData = req.body;
    const result = await getGuestService().createGuest(guestData);

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.status(201).json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/guests/:id - Update a guest
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await getGuestService().updateGuest(id, updates);

    if (!result.success) {
      if (result.errors?.includes('Guest not found')) {
        return res.status(404).json({ success: false, errors: result.errors });
      }
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/guests/:id - Delete a guest
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getGuestService().deleteGuest(id);

    if (!result.success) {
      if (result.errors?.includes('Guest not found')) {
        return res.status(404).json({ success: false, errors: result.errors });
      }
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/guests/:id/table - Assign guest to table
router.put('/:id/table', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({ success: false, error: 'Table ID is required' });
    }

    const result = await getGuestService().assignGuestToTable(id, tableId);

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error assigning guest to table:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/guests/:id/table - Unassign guest from table
router.delete('/:id/table', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getGuestService().unassignGuestFromTable(id);

    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.errors });
    }

    res.json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error unassigning guest from table:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/:eventId/import/csv/preview - Preview CSV import
router.post('/:eventId/import/csv/preview', upload.single('csvFile'), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const preview = await getGuestService().previewCSVImport(csvContent, eventId);
    
    res.json({ success: true, data: preview });
  } catch (error) {
    console.error('Error previewing CSV import:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/:eventId/import/csv - Import guests from CSV
router.post('/:eventId/import/csv', upload.single('csvFile'), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const result = await getGuestService().importFromCSV(csvContent, eventId);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, data: result });
    }
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/:eventId/import/contacts - Import guests from mobile contacts
router.post('/:eventId/import/contacts', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { contacts } = req.body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ success: false, error: 'Contacts array is required' });
    }

    const result = await getGuestService().importFromContacts(contacts, eventId);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, data: result });
    }
  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/:id/assign-table - Assign guest to table
router.post('/:id/assign-table', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({ success: false, error: 'Table ID is required' });
    }

    const result = await getGuestService().assignGuestToTable(id, tableId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.errors?.join(', ') || 'Assignment failed' });
    }

    res.json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error assigning guest to table:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/:id/unassign-table - Unassign guest from table
router.post('/:id/unassign-table', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getGuestService().unassignGuestFromTable(id);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.errors?.join(', ') || 'Unassignment failed' });
    }

    res.json({ success: true, data: result.guest });
  } catch (error) {
    console.error('Error unassigning guest from table:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/bulk-assign - Bulk assign guests to table
router.post('/bulk-assign', async (req: Request, res: Response) => {
  try {
    const { guestIds, tableId } = req.body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Guest IDs array is required' });
    }

    if (!tableId) {
      return res.status(400).json({ success: false, error: 'Table ID is required' });
    }

    const results = [];
    const errors = [];

    // Assign each guest individually
    for (const guestId of guestIds) {
      try {
        const result = await getGuestService().assignGuestToTable(guestId, tableId);
        if (result.success) {
          results.push(result.guest);
        } else {
          errors.push({ guestId, errors: result.errors });
        }
      } catch (error) {
        errors.push({ guestId, errors: [error instanceof Error ? error.message : 'Unknown error'] });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        assignedGuests: results,
        errors: errors,
        totalProcessed: guestIds.length,
        successfulAssignments: results.length,
        failedAssignments: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk assigning guests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/guests/bulk-unassign - Bulk unassign guests from tables
router.post('/bulk-unassign', async (req: Request, res: Response) => {
  try {
    const { guestIds } = req.body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Guest IDs array is required' });
    }

    const results = [];
    const errors = [];

    // Unassign each guest individually
    for (const guestId of guestIds) {
      try {
        const result = await getGuestService().unassignGuestFromTable(guestId);
        if (result.success) {
          results.push(result.guest);
        } else {
          errors.push({ guestId, errors: result.errors });
        }
      } catch (error) {
        errors.push({ guestId, errors: [error instanceof Error ? error.message : 'Unknown error'] });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        unassignedGuests: results,
        errors: errors,
        totalProcessed: guestIds.length,
        successfulUnassignments: results.length,
        failedUnassignments: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk unassigning guests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;