import request from 'supertest';
import { app } from '../../server';
import { DemoDataService } from '../../services/DemoDataService';

describe('Export Integration Tests', () => {
  let demoDataService: DemoDataService;
  const testEventId = 'demo-event-1';

  beforeAll(async () => {
    // Initialize demo data service
    demoDataService = DemoDataService.getInstance();
    await demoDataService.loadDemoData();
  });

  describe('POST /api/exports/seating-chart', () => {
    it('should export seating chart as CSV', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'csv',
          options: {
            includeVenueLayout: true,
            includeGuestDetails: true,
            includeTableAssignments: true,
            printOptimized: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="seating-chart-\d+\.csv"/);
      
      const csvContent = response.text;
      expect(csvContent).toContain('Table Name,Guest Name,Additional Guests');
      expect(csvContent).toContain('Statistics');
      expect(csvContent).toContain('Total Guests');
    });

    it('should export seating chart as PDF (placeholder)', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'pdf',
          options: {
            includeVenueLayout: true,
            includeGuestDetails: true,
            includeTableAssignments: true,
            printOptimized: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="seating-chart-\d+\.pdf"/);
    });

    it('should export seating chart as Excel (placeholder)', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'xlsx',
          options: {
            includeVenueLayout: false,
            includeGuestDetails: true,
            includeTableAssignments: true,
            printOptimized: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="seating-chart-\d+\.xlsx"/);
    });

    it('should return 400 for missing eventId', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          format: 'csv'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Event ID is required');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'xml'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid format (pdf, xlsx, csv) is required');
    });

    it('should handle missing format', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid format (pdf, xlsx, csv) is required');
    });
  });

  describe('POST /api/exports/guest-list', () => {
    it('should export guest list as CSV', async () => {
      const response = await request(app)
        .post('/api/exports/guest-list')
        .send({
          eventId: testEventId,
          format: 'csv'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="guest-list-\d+\.csv"/);
      
      const csvContent = response.text;
      expect(csvContent).toContain('Name,Phone Number,RSVP Status');
      expect(csvContent).toContain('Additional Guests');
      expect(csvContent).toContain('Table Assignment');
    });

    it('should export guest list as Excel (placeholder)', async () => {
      const response = await request(app)
        .post('/api/exports/guest-list')
        .send({
          eventId: testEventId,
          format: 'xlsx'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="guest-list-\d+\.xlsx"/);
    });

    it('should return 400 for missing eventId', async () => {
      const response = await request(app)
        .post('/api/exports/guest-list')
        .send({
          format: 'csv'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Event ID is required');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .post('/api/exports/guest-list')
        .send({
          eventId: testEventId,
          format: 'pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid format (xlsx, csv) is required');
    });
  });

  describe('POST /api/exports/venue-layout', () => {
    it('should export venue layout as PDF (placeholder)', async () => {
      const response = await request(app)
        .post('/api/exports/venue-layout')
        .send({
          eventId: testEventId,
          format: 'pdf'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="venue-layout-\d+\.pdf"/);
    });

    it('should export venue layout as Excel (placeholder)', async () => {
      const response = await request(app)
        .post('/api/exports/venue-layout')
        .send({
          eventId: testEventId,
          format: 'xlsx'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="venue-layout-\d+\.xlsx"/);
    });

    it('should return 400 for missing eventId', async () => {
      const response = await request(app)
        .post('/api/exports/venue-layout')
        .send({
          format: 'pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Event ID is required');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .post('/api/exports/venue-layout')
        .send({
          eventId: testEventId,
          format: 'csv'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid format (pdf, xlsx) is required');
    });
  });

  describe('GET /api/exports/formats', () => {
    it('should return available export formats and options', async () => {
      const response = await request(app)
        .get('/api/exports/formats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('seatingChart');
      expect(response.body).toHaveProperty('guestList');
      expect(response.body).toHaveProperty('venueLayout');

      expect(response.body.seatingChart.formats).toEqual(['pdf', 'xlsx', 'csv']);
      expect(response.body.guestList.formats).toEqual(['xlsx', 'csv']);
      expect(response.body.venueLayout.formats).toEqual(['pdf', 'xlsx']);

      expect(response.body.seatingChart.options).toHaveProperty('includeVenueLayout');
      expect(response.body.seatingChart.options).toHaveProperty('includeGuestDetails');
      expect(response.body.seatingChart.options).toHaveProperty('includeTableAssignments');
      expect(response.body.seatingChart.options).toHaveProperty('printOptimized');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid eventId gracefully', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: 'non-existent-event',
          format: 'csv'
        });

      // Should still return 200 but with empty data
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      
      const csvContent = response.text;
      expect(csvContent).toContain('Table Name,Guest Name');
      expect(csvContent).toContain('Total Guests,0');
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('Content validation', () => {
    it('should include proper CSV headers for seating chart', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'csv'
        });

      const csvContent = response.text;
      const lines = csvContent.split('\n');
      const headers = lines[0];

      expect(headers).toContain('Table Name');
      expect(headers).toContain('Guest Name');
      expect(headers).toContain('Additional Guests');
      expect(headers).toContain('Total Seats');
      expect(headers).toContain('Dietary Restrictions');
      expect(headers).toContain('Special Requests');
      expect(headers).toContain('Table Position X');
      expect(headers).toContain('Table Position Y');
    });

    it('should include proper CSV headers for guest list', async () => {
      const response = await request(app)
        .post('/api/exports/guest-list')
        .send({
          eventId: testEventId,
          format: 'csv'
        });

      const csvContent = response.text;
      const lines = csvContent.split('\n');
      const headers = lines[0];

      expect(headers).toContain('Name');
      expect(headers).toContain('Phone Number');
      expect(headers).toContain('RSVP Status');
      expect(headers).toContain('Additional Guests');
      expect(headers).toContain('Total Seats');
      expect(headers).toContain('Relationship Type');
      expect(headers).toContain('Bride/Groom Side');
      expect(headers).toContain('Dietary Restrictions');
      expect(headers).toContain('Special Requests');
      expect(headers).toContain('Table Assignment');
    });

    it('should include statistics section in seating chart export', async () => {
      const response = await request(app)
        .post('/api/exports/seating-chart')
        .send({
          eventId: testEventId,
          format: 'csv'
        });

      const csvContent = response.text;
      
      expect(csvContent).toContain('Statistics');
      expect(csvContent).toContain('Total Guests');
      expect(csvContent).toContain('Total Seats Required');
      expect(csvContent).toContain('Occupied Seats');
      expect(csvContent).toContain('Available Seats');
      expect(csvContent).toContain('Tables Used');
      expect(csvContent).toContain('Total Tables');
    });
  });
});