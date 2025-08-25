"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor(io) {
        this.sessions = new Map();
        this.eventSubscriptions = new Map(); // eventId -> Set of socketIds
        this.io = io;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`WebSocket client connected: ${socket.id}`);
            // Handle client registration
            socket.on('register', (data) => {
                this.registerClient(socket, data);
            });
            // Handle event subscription
            socket.on('subscribe_event', (eventId) => {
                this.subscribeToEvent(socket.id, eventId);
            });
            // Handle event unsubscription
            socket.on('unsubscribe_event', (eventId) => {
                this.unsubscribeFromEvent(socket.id, eventId);
            });
            // Handle sync request
            socket.on('request_sync', (eventId) => {
                this.handleSyncRequest(socket, eventId);
            });
            // Handle conflict resolution
            socket.on('resolve_conflict', (data) => {
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
        });
    }
    registerClient(socket, data) {
        const session = {
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
        logger_1.logger.info(`Client registered: ${socket.id} (${data.platform})`);
        // Send registration confirmation
        socket.emit('registered', {
            sessionId: socket.id,
            timestamp: new Date().toISOString()
        });
    }
    subscribeToEvent(socketId, eventId) {
        if (!this.eventSubscriptions.has(eventId)) {
            this.eventSubscriptions.set(eventId, new Set());
        }
        this.eventSubscriptions.get(eventId).add(socketId);
        const session = this.sessions.get(socketId);
        if (session) {
            session.eventId = eventId;
        }
        logger_1.logger.info(`Client ${socketId} subscribed to event ${eventId}`);
    }
    unsubscribeFromEvent(socketId, eventId) {
        const subscribers = this.eventSubscriptions.get(eventId);
        if (subscribers) {
            subscribers.delete(socketId);
            if (subscribers.size === 0) {
                this.eventSubscriptions.delete(eventId);
            }
        }
        logger_1.logger.info(`Client ${socketId} unsubscribed from event ${eventId}`);
    }
    async handleSyncRequest(socket, eventId) {
        try {
            // Get latest data for the event
            const syncData = await this.getEventSyncData(eventId);
            socket.emit('sync_data', {
                eventId,
                data: syncData,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info(`Sync data sent to client ${socket.id} for event ${eventId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to handle sync request for ${socket.id}:`, error);
            socket.emit('sync_error', {
                eventId,
                error: 'Failed to retrieve sync data'
            });
        }
    }
    handleConflictResolution(socket, data) {
        // Broadcast conflict resolution to other clients
        this.broadcastToEvent(data.eventId, 'conflict_resolved', {
            resolution: data.resolution,
            resolvedBy: socket.id,
            timestamp: new Date().toISOString()
        }, socket.id);
        logger_1.logger.info(`Conflict resolved by ${socket.id} for event ${data.eventId}`);
    }
    updateSessionActivity(socketId) {
        const session = this.sessions.get(socketId);
        if (session) {
            session.lastActivity = new Date();
        }
    }
    handleDisconnection(socketId) {
        const session = this.sessions.get(socketId);
        if (session && session.eventId) {
            this.unsubscribeFromEvent(socketId, session.eventId);
        }
        this.sessions.delete(socketId);
        logger_1.logger.info(`Client disconnected: ${socketId}`);
    }
    // Public methods for broadcasting events
    broadcastSyncEvent(syncEvent) {
        this.broadcastToEvent(syncEvent.eventId, 'sync_event', syncEvent);
    }
    broadcastToEvent(eventId, eventName, data, excludeSocketId) {
        const subscribers = this.eventSubscriptions.get(eventId);
        if (!subscribers)
            return;
        subscribers.forEach(socketId => {
            if (socketId !== excludeSocketId) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.emit(eventName, data);
                }
            }
        });
        logger_1.logger.info(`Broadcasted ${eventName} to ${subscribers.size} clients for event ${eventId}`);
    }
    getActiveSessionsForEvent(eventId) {
        const subscribers = this.eventSubscriptions.get(eventId);
        if (!subscribers)
            return [];
        return Array.from(subscribers)
            .map(socketId => this.sessions.get(socketId))
            .filter((session) => session !== undefined);
    }
    getSessionCount() {
        return this.sessions.size;
    }
    async getEventSyncData(eventId) {
        // Import services dynamically to avoid circular dependencies
        const { DemoDataService } = await Promise.resolve().then(() => __importStar(require('./DemoDataService')));
        if (process.env.SKIP_DB_SETUP === 'true') {
            const demoService = DemoDataService.getInstance();
            return {
                guests: demoService.getGuests(eventId),
                tables: demoService.getTables(eventId),
                venueLayout: null, // DemoDataService doesn't have getVenueLayout method yet
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
    cleanupInactiveSessions(maxInactiveMinutes = 30) {
        const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
        for (const [socketId, session] of this.sessions.entries()) {
            if (session.lastActivity < cutoffTime) {
                if (session.eventId) {
                    this.unsubscribeFromEvent(socketId, session.eventId);
                }
                this.sessions.delete(socketId);
                logger_1.logger.info(`Cleaned up inactive session: ${socketId}`);
            }
        }
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=WebSocketService.js.map