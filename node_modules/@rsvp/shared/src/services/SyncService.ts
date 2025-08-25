import { io, Socket } from 'socket.io-client';
import { VenueLayout } from '../types';

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
    this.socket.emit('update-layout', layout);
  }

  // Disconnect from the server
  disconnect() {
    this.socket.disconnect();
  }
}

export default SyncService;