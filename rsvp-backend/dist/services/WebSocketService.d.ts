import { Server } from 'socket.io';
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
export declare class WebSocketService {
    private io;
    private sessions;
    private eventSubscriptions;
    constructor(io: Server);
    private setupEventHandlers;
    private registerClient;
    private subscribeToEvent;
    private unsubscribeFromEvent;
    private handleSyncRequest;
    private handleConflictResolution;
    private updateSessionActivity;
    private handleDisconnection;
    broadcastSyncEvent(syncEvent: SyncEvent): void;
    broadcastToEvent(eventId: string, eventName: string, data: any, excludeSocketId?: string): void;
    getActiveSessionsForEvent(eventId: string): ClientSession[];
    getSessionCount(): number;
    private getEventSyncData;
    cleanupInactiveSessions(maxInactiveMinutes?: number): void;
}
//# sourceMappingURL=WebSocketService.d.ts.map