import { io, Socket } from 'socket.io-client';

export interface SyncEvent {
  type: 'guest_updated' | 'guest_created' | 'guest_deleted' | 'table_updated' | 'venue_updated' | 'rsvp_updated' | 'analytics_updated';
  eventId: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface SyncData {
  eventId: string;
  data: {
    guests: any[];
    tables: any[];
    venueLayout: any;
    event: any;
  };
  timestamp: string;
}

export interface ConflictData {
  resolution: any;
  resolvedBy: string;
  timestamp: string;
}

export class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private eventId: string | null = null;
  private userId: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private offlineQueue: any[] = [];

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public connect(eventId: string, userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        this.disconnect();
      }

      this.eventId = eventId;
      this.userId = userId || null;

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Register with server
        this.socket!.emit('register', {
          userId: this.userId,
          eventId: this.eventId,
          platform: 'web'
        });

        // Subscribe to event updates
        if (this.eventId) {
          this.socket!.emit('subscribe_event', this.eventId);
        }

        // Process offline queue
        this.processOfflineQueue();

        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;

        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }

        // Attempt to reconnect
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
        
        this.attemptReconnect();
      });

      this.socket.on('registered', (data) => {
        console.log('WebSocket registration confirmed:', data);
      });

      this.socket.on('sync_event', (syncEvent: SyncEvent) => {
        console.log('Received sync event:', syncEvent);
        this.handleSyncEvent(syncEvent);
      });

      this.socket.on('sync_data', (syncData: SyncData) => {
        console.log('Received sync data:', syncData);
        this.handleSyncData(syncData);
      });

      this.socket.on('sync_error', (error) => {
        console.error('Sync error:', error);
        this.emit('sync_error', error);
      });

      this.socket.on('conflict_resolved', (conflictData: ConflictData) => {
        console.log('Conflict resolved:', conflictData);
        this.handleConflictResolution(conflictData);
      });

      // Send heartbeat every 30 seconds
      setInterval(() => {
        if (this.isConnected && this.socket) {
          this.socket.emit('heartbeat');
        }
      }, 30000);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.eventId = null;
    this.userId = null;
  }

  public subscribeToEvent(eventId: string): void {
    this.eventId = eventId;
    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe_event', eventId);
    }
  }

  public unsubscribeFromEvent(eventId: string): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe_event', eventId);
    }
  }

  public requestSync(eventId: string): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('request_sync', eventId);
    } else {
      // Queue for when connection is restored
      this.offlineQueue.push({ type: 'request_sync', eventId });
    }
  }

  public resolveConflict(eventId: string, resolution: any): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('resolve_conflict', { eventId, resolution });
    } else {
      // Queue for when connection is restored
      this.offlineQueue.push({ type: 'resolve_conflict', eventId, resolution });
    }
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  public emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public isOnline(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): { connected: boolean; eventId: string | null; userId: string | null } {
    return {
      connected: this.isConnected,
      eventId: this.eventId,
      userId: this.userId
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.eventId) {
        this.connect(this.eventId, this.userId || undefined).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private processOfflineQueue(): void {
    while (this.offlineQueue.length > 0) {
      const queuedAction = this.offlineQueue.shift();
      
      switch (queuedAction.type) {
        case 'request_sync':
          this.requestSync(queuedAction.eventId);
          break;
        case 'resolve_conflict':
          this.resolveConflict(queuedAction.eventId, queuedAction.resolution);
          break;
      }
    }
  }

  private handleSyncEvent(syncEvent: SyncEvent): void {
    this.emit('sync_event', syncEvent);
    
    // Emit specific event types for easier handling
    this.emit(syncEvent.type, {
      eventId: syncEvent.eventId,
      data: syncEvent.data,
      timestamp: syncEvent.timestamp,
      userId: syncEvent.userId
    });
  }

  private handleSyncData(syncData: SyncData): void {
    this.emit('sync_data', syncData);
  }

  private handleConflictResolution(conflictData: ConflictData): void {
    this.emit('conflict_resolved', conflictData);
  }

  // Utility method to check if we should sync
  public shouldSync(): boolean {
    return this.isConnected && this.eventId !== null;
  }

  // Method to get offline queue size (for debugging)
  public getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }
}