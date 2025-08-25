import express from 'express';
import { ExportService, ExportOptions } from '../services/ExportService';
import { GuestRepository } from '../repositories/GuestRepository';
import { TableRepository } from '../repositories/TableRepository';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
import { MockGuestRepository } from '../services/MockGuestRepository';
import { MockTableService } from '../services/MockTableService';
import { MockVenueElementRepository } from '../services/MockVenueElementRepository';

const router = express.Router();

// Initialize repositories and service based on environment
let guestRepository: any;
let tableRepository: any;
let venueElementRepository: any;

if (process.env.SKIP_DB_SETUP === 'true') {
  // Use mock services for demo mode
  guestRepository = new MockGuestRepository();
  tableRepository = new MockTableService();
  venueElementRepository = new MockVenueElementRepository();
} else {
  // Use real repositories for production
  guestRepository = new GuestRepository();
  tableRepository = new TableRepository();
  venueElementRepository = new VenueElementRepository();
}

const exportService = new ExportService(guestRepository, tableRepository, venueElementRepository);

/**
 * POST /api/exports/seating-chart
 * Export seating chart in various formats
 */
router.post('/seating-chart', async (req, res) => {
  try {
    const { eventId, format, options } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!format || !['pdf', 'xlsx', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Valid format (pdf, xlsx, csv) is required' });
    }

    const exportOptions: ExportOptions = {
      format,
      includeVenueLayout: options?.includeVenueLayout ?? true,
      includeGuestDetails: options?.includeGuestDetails ?? true,
      includeTableAssignments: options?.includeTableAssignments ?? true,
      printOptimized: options?.printOptimized ?? false
    };

    const result = await exportService.exportSeatingChart(eventId, exportOptions);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Export failed',
        format: result.format
      });
    }

    // Set appropriate headers for file download
    const contentTypes = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv'
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.buffer) {
      res.send(result.buffer);
    } else {
      res.status(500).json({ error: 'Export buffer not available' });
    }

  } catch (error) {
    console.error('Seating chart export error:', error);
    res.status(500).json({ 
      error: 'Internal server error during export',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/exports/guest-list
 * Export guest list with table assignments
 */
router.post('/guest-list', async (req, res) => {
  try {
    const { eventId, format } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!format || !['xlsx', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Valid format (xlsx, csv) is required' });
    }

    const result = await exportService.exportGuestList(eventId, format);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Export failed',
        format: result.format
      });
    }

    // Set appropriate headers for file download
    const contentTypes = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv'
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.buffer) {
      res.send(result.buffer);
    } else {
      res.status(500).json({ error: 'Export buffer not available' });
    }

  } catch (error) {
    console.error('Guest list export error:', error);
    res.status(500).json({ 
      error: 'Internal server error during export',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/exports/venue-layout
 * Export venue layout with table positions
 */
router.post('/venue-layout', async (req, res) => {
  try {
    const { eventId, format } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!format || !['pdf', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: 'Valid format (pdf, xlsx) is required' });
    }

    const result = await exportService.exportVenueLayout(eventId, format);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Export failed',
        format: result.format
      });
    }

    // Set appropriate headers for file download
    const contentTypes = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.buffer) {
      res.send(result.buffer);
    } else {
      res.status(500).json({ error: 'Export buffer not available' });
    }

  } catch (error) {
    console.error('Venue layout export error:', error);
    res.status(500).json({ 
      error: 'Internal server error during export',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/exports/formats
 * Get available export formats and their capabilities
 */
router.get('/formats', (req, res) => {
  res.json({
    seatingChart: {
      formats: ['pdf', 'xlsx', 'csv'],
      options: {
        includeVenueLayout: 'Include venue layout elements',
        includeGuestDetails: 'Include guest details and dietary restrictions',
        includeTableAssignments: 'Include table assignment information',
        printOptimized: 'Optimize layout for printing'
      }
    },
    guestList: {
      formats: ['xlsx', 'csv'],
      description: 'Export complete guest list with table assignments'
    },
    venueLayout: {
      formats: ['pdf', 'xlsx'],
      description: 'Export venue layout with table positions'
    }
  });
});

export default router;