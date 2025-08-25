import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export interface SyncEvent {
  type: 'guest_updated' | 'guest_created' | 'guest_deleted' | 'table_updated' | 'venue_updated' | 'rsvp_updated' | 'analytics_updated';
  eventId: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface ClientSession {
  socketId: string;
  userId?: string;
  eventId?: string;
  platform: 'web' | 'mobile';
  lastActivity: Date;
}

export class WebSocketService {
  private io: Server;
  private sessions: Map<string, ClientSession> = new Map();
  private eventSubscriptions: Map<string, Set<string>> = new Map(); // eventId -> Set of socketIds

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Handle client registration
      socket.on('register', (data: { userId?: string; eventId?: string; platform: 'web' | 'mobile' }) => {
        this.registerClient(socket, data);
      });

      // Handle event subscription
      socket.on('subscribe_event', (eventId: string) => {
        this.subscribeToEvent(socket.id, eventId);
      });

      // Handle event unsubscription
      socket.on('unsubscribe_event', (eventId: string) => {
        this.unsubscribeFromEvent(socket.id, eventId);
      });

      // Handle sync request
      socket.on('request_sync', (eventId: string) => {
        this.handleSyncRequest(socket, eventId);
      });

      // Handle conflict resolution
      socket.on('resolve_conflict', (data: { eventId: string; resolution: any }) => {
        this.handleConflictResolution(socket, data);
      });

      // Handle heartbeat for session management
      socket.on('heartbeat', () => {
        this.updateSessionActivity(socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket.id);
      });
      
      socket.on('update-layout', (data: { eventId: string, layout: any }) => {
        this.broadcastToEvent(data.eventId, 'layout-updated', data.layout, socket.id);
      });
    });
  }

  private registerClient(socket: Socket, data: { userId?: string; eventId?: string; platform: 'web' | 'mobile' }): void {
    const session: ClientSession = {
      socketId: socket.id,
      userId: data.userId,
      eventId: data.eventId,
      platform: data.platform,
      lastActivity: new Date()
    };

    this.sessions.set(socket.id, session);

    if (data.eventId) {
      this.subscribeToEvent(socket.id, data.eventId);
    }

    logger.info(`Client registered: ${socket.id} (${data.platform})`);
    
    // Send registration confirmation
    socket.emit('registered', { 
      sessionId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  private subscribeToEvent(socketId: string, eventId: string): void {
    if (!this.eventSubscriptions.has(eventId)) {
      this.eventSubscriptions.set(eventId, new Set());
    }
    
    this.eventSubscriptions.get(eventId)!.add(socketId);
    
    const session = this.sessions.get(socketId);
    if (session) {
      session.eventId = eventId;
    }

    logger.info(`Client ${socketId} subscribed to event ${eventId}`);
  }

  private unsubscribeFromEvent(socketId: string, eventId: string): void {
    const subscribers = this.eventSubscriptions.get(eventId);
    if (subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.eventSubscriptions.delete(eventId);
      }
    }

    logger.info(`Client ${socketId} unsubscribed from event ${eventId}`);
  }

  private async handleSyncRequest(socket: Socket, eventId: string): Promise<void> {
    try {
      // Get latest data for the event
      const syncData = await this.getEventSyncData(eventId);
      
      socket.emit('sync_data', {
        eventId,
        data: syncData,
        timestamp: new Date().toISOString()
      });

      logger.info(`Sync data sent to client ${socket.id} for event ${eventId}`);
    } catch (error) {
      logger.error(`Failed to handle sync request for ${socket.id}:`, error);
      socket.emit('sync_error', {
        eventId,
        error: 'Failed to retrieve sync data'
      });
    }
  }

  private handleConflictResolution(socket: Socket, data: { eventId: string; resolution: any }): void {
    // Broadcast conflict resolution to other clients
    this.broadcastToEvent(data.eventId, 'conflict_resolved', {
      resolution: data.resolution,
      resolvedBy: socket.id,
      timestamp: new Date().toISOString()
    }, socket.id);

    logger.info(`Conflict resolved by ${socket.id} for event ${data.eventId}`);
  }

  private updateSessionActivity(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  private handleDisconnection(socketId: string): void {
    const session = this.sessions.get(socketId);
    
    if (session && session.eventId) {
      this.unsubscribeFromEvent(socketId, session.eventId);
    }
    
    this.sessions.delete(socketId);
    logger.info(`Client disconnected: ${socketId}`);
  }

  // Public methods for broadcasting events
  public broadcastSyncEvent(syncEvent: SyncEvent): void {
    this.broadcastToEvent(syncEvent.eventId, 'sync_event', syncEvent);
  }

  public broadcastToEvent(eventId: string, eventName: string, data: any, excludeSocketId?: string): void {
    const subscribers = this.eventSubscriptions.get(eventId);
    if (!subscribers) return;

    subscribers.forEach(socketId => {
      if (socketId !== excludeSocketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(eventName, data);
        }
      }
    });

    logger.info(`Broadcasted ${eventName} to ${subscribers.size} clients for event ${eventId}`);
  }

  public getActiveSessionsForEvent(eventId: string): ClientSession[] {
    const subscribers = this.eventSubscriptions.get(eventId);
    if (!subscribers) return [];

    return Array.from(subscribers)
      .map(socketId => this.sessions.get(socketId))
      .filter((session): session is ClientSession => session !== undefined);
  }

  public getSessionCount(): number {
    return this.sessions.size;
  }

  private async getEventSyncData(eventId: string): Promise<any> {
    // Import services dynamically to avoid circular dependencies
    const { DemoDataService } = await import('./DemoDataService');
    
    if (process.env.SKIP_DB_SETUP === 'true') {
      const demoService = DemoDataService.getInstance();
      return {
        guests: demoService.getGuests(eventId),
        tables: demoService.getTables(eventId),
        venueLayout: demoService.getVenueLayout(eventId),
        event: demoService.getEvent(eventId)
      };
    }

    // In production, this would query the actual database
    // For now, return empty data structure
    return {
      guests: [],
      tables: [],
      venueLayout: null,
      event: null
    };
  }

  // Cleanup inactive sessions
  public cleanupInactiveSessions(maxInactiveMinutes: number = 30): void {
    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
    
    for (const [socketId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        if (session.eventId) {
          this.unsubscribeFromEvent(socketId, session.eventId);
        }
        this.sessions.delete(socketId);
        logger.info(`Cleaned up inactive session: ${socketId}`);
      }
    }
  }
}