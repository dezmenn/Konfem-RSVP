import request from 'supertest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { app } from '../../server';
import { WebSocketService } from '../../services/WebSocketService';
import { SyncQueueService } from '../../services/SyncQueueService';
import { DemoDataService } from '../../services/DemoDataService';
import io from 'socket.io-client';

describe('Cross-Platform Synchronization Integration', () => {
  let server: any;
  let webSocketService: WebSocketService;
  let syncQueueService: SyncQueueService;
  let demoDataService: DemoDataService;
  let clientSocket: any;
  let serverSocket: any;

  beforeAll(async () => {
    // Set up demo mode
    process.env.SKIP_DB_SETUP = 'true';
    
    // Initialize services
    demoDataService = DemoDataService.getInstance();
    await demoDataService.loadDemoData();
    
    syncQueueService = SyncQueueService.getInstance();
    
    // Create HTTP server and Socket.IO
    const httpServer = createServer(app);
    const ioServer = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    webSocketService = new WebSocketService(ioServer);
    (global as any).webSocketService = webSocketService;
    
    server = httpServer.listen(0); // Use random port
    const port = (server.address() as any).port;
    
    // Set up client socket for testing
    clientSocket = io(`http://localhost:${port}`);
    
    // Wait for connection
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear any existing operations
    syncQueueService.clearCompletedOperations();
  });

  describe('WebSocket Connection and Registration', () => {
    test('should register client successfully', (done) => {
      clientSocket.emit('register', {
        userId: 'test-user',
        eventId: 'demo-event-1',
        platform: 'web'
      });

      clientSocket.on('registered', (data: any) => {
        expect(data).toHaveProperty('sessionId');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    test('should subscribe to event updates', (done) => {
      clientSocket.emit('subscribe_event', 'demo-event-1');
      
      // Should receive sync events for this event
      setTimeout(() => {
        const sessions = webSocketService.getActiveSessionsForEvent('demo-event-1');
        expect(sessions.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('Real-time Sync Events', () => {
    test('should broadcast guest creation events', (done) => {
      // Listen for sync events
      clientSocket.on('sync_event', (syncEvent: any) => {
        expect(syncEvent.type).toBe('guest_created');
        expect(syncEvent.eventId).toBe('demo-event-1');
        expect(syncEvent.data).toHaveProperty('name');
        done();
      });

      // Create a guest via API
      request(app)
        .post('/api/guests')
        .send({
          name: 'Test Guest',
          phoneNumber: '+1234567890',
          eventId: 'demo-event-1',
          relationshipType: 'Friend',
          brideOrGroomSide: 'bride'
        })
        .expect(201);
    });

    test('should broadcast guest update events', (done) => {
      // First create a guest
      const guestData = {
        name: 'Update Test Guest',
        phoneNumber: '+1234567891',
        eventId: 'demo-event-1',
        relationshipType: 'Friend',
        brideOrGroomSide: 'bride'
      };

      request(app)
        .post('/api/guests')
        .send(guestData)
        .expect(201)
        .then((createResponse) => {
          const guestId = createResponse.body.guest.id;

          // Listen for update sync event
          clientSocket.on('sync_event', (syncEvent: any) => {
            if (syncEvent.type === 'guest_updated') {
              expect(syncEvent.eventId).toBe('demo-event-1');
              expect(syncEvent.data.name).toBe('Updated Guest Name');
              done();
            }
          });

          // Update the guest
          request(app)
            .put(`/api/guests/${guestId}`)
            .send({ name: 'Updated Guest Name' })
            .expect(200);
        });
    });

    test('should broadcast guest deletion events', (done) => {
      // First create a guest
      const guestData = {
        name: 'Delete Test Guest',
        phoneNumber: '+1234567892',
        eventId: 'demo-event-1',
        relationshipType: 'Friend',
        brideOrGroomSide: 'bride'
      };

      request(app)
        .post('/api/guests')
        .send(guestData)
        .expect(201)
        .then((createResponse) => {
          const guestId = createResponse.body.guest.id;

          // Listen for delete sync event
          clientSocket.on('sync_event', (syncEvent: any) => {
            if (syncEvent.type === 'guest_deleted') {
              expect(syncEvent.eventId).toBe('demo-event-1');
              expect(syncEvent.data.id).toBe(guestId);
              done();
            }
          });

          // Delete the guest
          request(app)
            .delete(`/api/guests/${guestId}`)
            .expect(200);
        });
    });
  });

  describe('Sync Queue Operations', () => {
    test('should add sync operation to queue', async () => {
      const response = await request(app)
        .post('/api/sync/operations')
        .send({
          type: 'create',
          entity: 'guest',
          entityId: 'test-guest-1',
          data: { name: 'Test Guest' },
          eventId: 'demo-event-1',
          userId: 'test-user'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.operationId).toBeDefined();
    });

    test('should get sync queue status', async () => {
      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toHaveProperty('pending');
      expect(response.body.status).toHaveProperty('processing');
      expect(response.body.status).toHaveProperty('completed');
      expect(response.body.status).toHaveProperty('failed');
    });

    test('should retry failed operations', async () => {
      // First add an operation that might fail
      await request(app)
        .post('/api/sync/operations')
        .send({
          type: 'update',
          entity: 'guest',
          entityId: 'non-existent-guest',
          data: { name: 'Test' },
          eventId: 'demo-event-1'
        });

      // Retry failed operations
      const response = await request(app)
        .post('/api/sync/retry-failed')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Full Sync Request', () => {
    test('should handle sync data request', (done) => {
      // Listen for sync data
      clientSocket.on('sync_data', (syncData: any) => {
        expect(syncData.eventId).toBe('demo-event-1');
        expect(syncData.data).toHaveProperty('guests');
        expect(syncData.data).toHaveProperty('tables');
        expect(syncData.data).toHaveProperty('venueLayout');
        expect(syncData.data).toHaveProperty('event');
        done();
      });

      // Request sync
      clientSocket.emit('request_sync', 'demo-event-1');
    });
  });

  describe('Conflict Resolution', () => {
    test('should handle conflict resolution', (done) => {
      // Listen for conflict resolution
      clientSocket.on('conflict_resolved', (conflictData: any) => {
        expect(conflictData.resolution).toBeDefined();
        expect(conflictData.resolvedBy).toBeDefined();
        expect(conflictData.timestamp).toBeDefined();
        done();
      });

      // Simulate conflict resolution
      clientSocket.emit('resolve_conflict', {
        eventId: 'demo-event-1',
        resolution: { strategy: 'client_wins', data: { test: 'data' } }
      });
    });

    test('should resolve conflicts via API', async () => {
      // First create an operation
      const createResponse = await request(app)
        .post('/api/sync/operations')
        .send({
          type: 'create',
          entity: 'guest',
          entityId: 'conflict-guest-1',
          data: { name: 'Conflict Guest' },
          eventId: 'demo-event-1'
        });

      const operationId = createResponse.body.operationId;

      // Resolve conflict
      const response = await request(app)
        .post(`/api/sync/conflicts/${operationId}/resolve`)
        .send({
          resolution: 'client_wins',
          mergedData: { name: 'Resolved Guest' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    test('should track active sessions', () => {
      const sessionCount = webSocketService.getSessionCount();
      expect(sessionCount).toBeGreaterThan(0);
    });

    test('should handle heartbeat', (done) => {
      clientSocket.emit('heartbeat');
      
      // Should not disconnect after heartbeat
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 100);
    });

    test('should clean up inactive sessions', () => {
      // This would normally be tested with a longer timeout
      // For the test, we'll just verify the method exists and can be called
      expect(() => {
        webSocketService.cleanupInactiveSessions(0.01); // 0.01 minutes = 0.6 seconds
      }).not.toThrow();
    });
  });

  describe('Cross-Platform Data Consistency', () => {
    test('should maintain data consistency across platforms', async () => {
      // Create guest via API
      const createResponse = await request(app)
        .post('/api/guests')
        .send({
          name: 'Consistency Test Guest',
          phoneNumber: '+1234567893',
          eventId: 'demo-event-1',
          relationshipType: 'Friend',
          brideOrGroomSide: 'bride'
        })
        .expect(201);

      const guestId = createResponse.body.guest.id;

      // Verify guest exists in demo data
      const guests = demoDataService.getGuests('demo-event-1');
      const createdGuest = guests.find(g => g.id === guestId);
      expect(createdGuest).toBeDefined();
      expect(createdGuest?.name).toBe('Consistency Test Guest');

      // Update via sync operation
      await request(app)
        .post('/api/sync/operations')
        .send({
          type: 'update',
          entity: 'guest',
          entityId: guestId,
          data: { name: 'Updated via Sync' },
          eventId: 'demo-event-1'
        });

      // Allow time for sync processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify update was applied
      const updatedGuests = demoDataService.getGuests('demo-event-1');
      const updatedGuest = updatedGuests.find(g => g.id === guestId);
      expect(updatedGuest?.name).toBe('Updated via Sync');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid sync operations gracefully', async () => {
      const response = await request(app)
        .post('/api/sync/operations')
        .send({
          type: 'invalid_type',
          entity: 'guest',
          entityId: 'test-guest',
          data: {},
          eventId: 'demo-event-1'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should handle WebSocket connection errors', (done) => {
      const errorSocket = io('http://localhost:99999'); // Invalid port
      
      errorSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        errorSocket.disconnect();
        done();
      });
    });

    test('should handle sync errors gracefully', (done) => {
      clientSocket.on('sync_error', (error: any) => {
        expect(error).toHaveProperty('error');
        done();
      });

      // Request sync for non-existent event
      clientSocket.emit('request_sync', 'non-existent-event');
    });
  });
});