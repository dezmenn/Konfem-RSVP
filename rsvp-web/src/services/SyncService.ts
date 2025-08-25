import { io, Socket } from 'socket.io-client';
import { VenueLayout } from '../../../shared/src/types';

class SyncService {
  private socket: Socket;

  constructor(private eventId: string) {
    // Connect to the WebSocket server
    this.socket = io('http://localhost:3000', {
      query: { eventId },
    });

    this.socket.on('connect', () => {
      console.log('Connected to SyncService');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from SyncService');
    });
  }

  // Listen for layout updates from the server
  onLayoutUpdate(callback: (layout: VenueLayout) => void) {
    this.socket.on('layout-updated', callback);
  }

  // Send a layout update to the server
  sendLayoutUpdate(layout: VenueLayout) {
    this.socket.emit('update-layout', { eventId: this.eventId, layout });
  }

  // Disconnect from the server
  disconnect() {
    this.socket.disconnect();
  }
  public getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      webSocketConnected: this.socket.connected,
      pendingCount: 0,
      failedCount: 0,
      syncInProgress: false,
    };
  }

  public async initialize(eventId: string, userId?: string) {
    // Not implemented
  }

  public async performOperation(
    type: 'create' | 'update' | 'delete',
    entity: 'guest' | 'table' | 'venue' | 'rsvp',
    entityId: string,
    data: any,
    eventId: string
  ) {
    return { success: true };
  }

  public async requestFullSync(eventId: string) {
    // Not implemented
  }

  public async retryFailedOperations() {
    // Not implemented
  }

  public clearSyncedOperations() {
    // Not implemented
  }

  public destroy() {
    this.disconnect();
  }
}

export default SyncService;