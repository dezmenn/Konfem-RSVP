import request from 'supertest';
import { app } from '../../server';

describe('Table Integration Tests', () => {
  const testEventId = 'demo-event-1';
  let testTableId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('POST /api/tables', () => {
    it('should create a new table', async () => {
      const tableData = {
        eventId: testEventId,
        name: 'Test Table 1',
        capacity: 8,
        position: { x: 100, y: 100 }
      };

      const response = await request(app)
        .post('/api/tables')
        .send(tableData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Table 1');
      expect(response.body.capacity).toBe(8);
      expect(response.body.position).toEqual({ x: 100, y: 100 });
      expect(response.body.isLocked).toBe(false);
      expect(response.body.assignedGuests).toEqual([]);

      testTableId = response.body.id;
    });

    it('should return validation error for invalid table data', async () => {
      const invalidData = {
        eventId: '',
        name: '',
        capacity: 0,
        position: { x: -1, y: -1 }
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('GET /api/tables/events/:eventId', () => {
    it('should return tables for an event', async () => {
      const response = await request(app)
        .get(`/api/tables/events/${testEventId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const table = response.body.find((t: any) => t.id === testTableId);
      expect(table).toBeDefined();
      expect(table.name).toBe('Test Table 1');
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a specific table', async () => {
      const response = await request(app)
        .get(`/api/tables/${testTableId}`)
        .expect(200);

      expect(response.body.id).toBe(testTableId);
      expect(response.body.name).toBe('Test Table 1');
      expect(response.body.capacity).toBe(8);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .get('/api/tables/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update table properties', async () => {
      const updates = {
        name: 'Updated Test Table',
        capacity: 10,
        position: { x: 150, y: 150 }
      };

      const response = await request(app)
        .put(`/api/tables/${testTableId}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe('Updated Test Table');
      expect(response.body.capacity).toBe(10);
      expect(response.body.position).toEqual({ x: 150, y: 150 });
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .put('/api/tables/non-existent-id')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('POST /api/tables/:id/lock and /api/tables/:id/unlock', () => {
    it('should lock and unlock a table', async () => {
      // Lock the table
      const lockResponse = await request(app)
        .post(`/api/tables/${testTableId}/lock`)
        .expect(200);

      expect(lockResponse.body.isLocked).toBe(true);

      // Unlock the table
      const unlockResponse = await request(app)
        .post(`/api/tables/${testTableId}/unlock`)
        .expect(200);

      expect(unlockResponse.body.isLocked).toBe(false);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .post('/api/tables/non-existent-id/lock')
        .expect(404);

      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('GET /api/tables/events/:eventId/capacity', () => {
    it('should return capacity information for all tables', async () => {
      const response = await request(app)
        .get(`/api/tables/events/${testEventId}/capacity`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      const tableCapacity = response.body.find((info: any) => info.tableId === testTableId);
      expect(tableCapacity).toBeDefined();
      expect(tableCapacity.name).toBe('Updated Test Table');
      expect(tableCapacity.capacity).toBe(10);
      expect(tableCapacity.occupied).toBe(0);
      expect(tableCapacity.available).toBe(10);
      expect(tableCapacity.isOverCapacity).toBe(false);
    });
  });

  describe('GET /api/tables/events/:eventId/validate', () => {
    it('should validate table arrangement', async () => {
      const response = await request(app)
        .get(`/api/tables/events/${testEventId}/validate`)
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('warnings');
      expect(response.body).toHaveProperty('conflicts');
      
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
      expect(Array.isArray(response.body.conflicts)).toBe(true);
    });
  });

  describe('POST /api/tables/:id/duplicate', () => {
    it('should duplicate a table', async () => {
      const response = await request(app)
        .post(`/api/tables/${testTableId}/duplicate`)
        .send({ offset: { x: 50, y: 50 } })
        .expect(201);

      expect(response.body.name).toBe('Updated Test Table (Copy)');
      expect(response.body.capacity).toBe(10);
      expect(response.body.position).toEqual({ x: 200, y: 200 });
      expect(response.body.isLocked).toBe(false);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .post('/api/tables/non-existent-id/duplicate')
        .send({ offset: { x: 50, y: 50 } })
        .expect(404);

      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('DELETE /api/tables/:id', () => {
    it('should delete a table with no assigned guests', async () => {
      const response = await request(app)
        .delete(`/api/tables/${testTableId}`)
        .expect(204);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .delete('/api/tables/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('Guest Assignment', () => {
    let guestId: string;
    let newTableId: string;

    beforeAll(async () => {
      // Create a guest for testing
      const guestResponse = await request(app)
        .post('/api/guests')
        .send({
          eventId: testEventId,
          name: 'Test Guest',
          phoneNumber: '+1234567890',
          dietaryRestrictions: [],
          additionalGuestCount: 0,
          relationshipType: 'Friend',
          brideOrGroomSide: 'bride',
          specialRequests: ''
        });
      
      guestId = guestResponse.body.id;

      // Create a new table for assignment testing
      const tableResponse = await request(app)
        .post('/api/tables')
        .send({
          eventId: testEventId,
          name: 'Assignment Test Table',
          capacity: 4,
          position: { x: 300, y: 300 }
        });
      
      newTableId = tableResponse.body.id;
    });

    it('should assign a guest to a table', async () => {
      const response = await request(app)
        .post(`/api/tables/${newTableId}/assign-guest`)
        .send({ guestId })
        .expect(204);
    });

    it('should show updated capacity after assignment', async () => {
      const response = await request(app)
        .get(`/api/tables/events/${testEventId}/capacity`)
        .expect(200);

      const tableCapacity = response.body.find((info: any) => info.tableId === newTableId);
      expect(tableCapacity.occupied).toBe(1);
      expect(tableCapacity.available).toBe(3);
    });

    it('should unassign a guest from a table', async () => {
      const response = await request(app)
        .post('/api/tables/unassign-guest')
        .send({ guestId })
        .expect(204);
    });

    it('should return error when assigning non-existent guest', async () => {
      const response = await request(app)
        .post(`/api/tables/${newTableId}/assign-guest`)
        .send({ guestId: 'non-existent-guest' })
        .expect(400);

      expect(response.body.error).toBe('Guest not found');
    });

    it('should return error when assigning to non-existent table', async () => {
      const response = await request(app)
        .post('/api/tables/non-existent-table/assign-guest')
        .send({ guestId })
        .expect(400);

      expect(response.body.error).toContain('full capacity');
    });
  });
});