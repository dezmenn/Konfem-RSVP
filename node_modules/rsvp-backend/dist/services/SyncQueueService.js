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
exports.SyncQueueService = void 0;
const logger_1 = require("../utils/logger");
class SyncQueueService {
    constructor() {
        this.queue = new Map();
        this.processingQueue = new Set();
        this.conflictQueue = new Map();
    }
    static getInstance() {
        if (!SyncQueueService.instance) {
            SyncQueueService.instance = new SyncQueueService();
        }
        return SyncQueueService.instance;
    }
    addOperation(operation) {
        const id = this.generateOperationId();
        const syncOperation = {
            ...operation,
            id,
            retryCount: 0,
            status: 'pending'
        };
        this.queue.set(id, syncOperation);
        logger_1.logger.info(`Added sync operation: ${id} (${operation.type} ${operation.entity})`);
        // Process immediately if not in batch mode
        this.processOperation(id);
        return id;
    }
    async processOperation(operationId) {
        const operation = this.queue.get(operationId);
        if (!operation || this.processingQueue.has(operationId)) {
            return false;
        }
        this.processingQueue.add(operationId);
        operation.status = 'processing';
        try {
            const result = await this.executeOperation(operation);
            if (result.success) {
                operation.status = 'completed';
                this.queue.delete(operationId);
                logger_1.logger.info(`Sync operation completed: ${operationId}`);
                return true;
            }
            else if (result.conflict) {
                await this.handleConflict(operation, result.conflictData);
                return false;
            }
            else {
                throw new Error(result.error || 'Operation failed');
            }
        }
        catch (error) {
            operation.retryCount++;
            if (operation.retryCount >= operation.maxRetries) {
                operation.status = 'failed';
                logger_1.logger.error(`Sync operation failed permanently: ${operationId}`, error);
            }
            else {
                operation.status = 'pending';
                logger_1.logger.warn(`Sync operation failed, will retry: ${operationId} (attempt ${operation.retryCount})`);
                // Schedule retry with exponential backoff
                setTimeout(() => {
                    this.processOperation(operationId);
                }, Math.pow(2, operation.retryCount) * 1000);
            }
        }
        finally {
            this.processingQueue.delete(operationId);
        }
        return false;
    }
    async executeOperation(operation) {
        try {
            switch (operation.entity) {
                case 'guest':
                    return await this.executeGuestOperation(operation);
                case 'table':
                    return await this.executeTableOperation(operation);
                case 'venue':
                    return await this.executeVenueOperation(operation);
                case 'rsvp':
                    return await this.executeRSVPOperation(operation);
                default:
                    return { success: false, error: `Unknown entity type: ${operation.entity}` };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async executeGuestOperation(operation) {
        const { DemoDataService } = await Promise.resolve().then(() => __importStar(require('./DemoDataService')));
        const demoService = DemoDataService.getInstance();
        try {
            switch (operation.type) {
                case 'create':
                    const existingGuest = demoService.getGuests(operation.eventId).find(g => g.id === operation.entityId);
                    if (existingGuest) {
                        return {
                            success: false,
                            conflict: true,
                            conflictData: { existing: existingGuest, incoming: operation.data }
                        };
                    }
                    demoService.addGuest(operation.eventId, operation.data);
                    return { success: true };
                case 'update':
                    const guestToUpdate = demoService.getGuests(operation.eventId).find(g => g.id === operation.entityId);
                    if (!guestToUpdate) {
                        return { success: false, error: 'Guest not found' };
                    }
                    // Check for conflicts based on timestamp
                    if (guestToUpdate.updatedAt && new Date(guestToUpdate.updatedAt) > operation.timestamp) {
                        return {
                            success: false,
                            conflict: true,
                            conflictData: { existing: guestToUpdate, incoming: operation.data }
                        };
                    }
                    demoService.updateGuest(operation.eventId, operation.entityId, operation.data);
                    return { success: true };
                case 'delete':
                    demoService.deleteGuest(operation.eventId, operation.entityId);
                    return { success: true };
                default:
                    return { success: false, error: `Unknown operation type: ${operation.type}` };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async executeTableOperation(operation) {
        const { DemoDataService } = await Promise.resolve().then(() => __importStar(require('./DemoDataService')));
        const demoService = DemoDataService.getInstance();
        try {
            switch (operation.type) {
                case 'create':
                    demoService.addTable(operation.eventId, operation.data);
                    return { success: true };
                case 'update':
                    const tableToUpdate = demoService.getTables(operation.eventId).find(t => t.id === operation.entityId);
                    if (!tableToUpdate) {
                        return { success: false, error: 'Table not found' };
                    }
                    // Check for conflicts
                    if (tableToUpdate.updatedAt && new Date(tableToUpdate.updatedAt) > operation.timestamp) {
                        return {
                            success: false,
                            conflict: true,
                            conflictData: { existing: tableToUpdate, incoming: operation.data }
                        };
                    }
                    demoService.updateTable(operation.eventId, operation.entityId, operation.data);
                    return { success: true };
                case 'delete':
                    demoService.deleteTable(operation.eventId, operation.entityId);
                    return { success: true };
                default:
                    return { success: false, error: `Unknown operation type: ${operation.type}` };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async executeVenueOperation(operation) {
        // Venue operations implementation
        return { success: true };
    }
    async executeRSVPOperation(operation) {
        // RSVP operations implementation
        return { success: true };
    }
    async handleConflict(operation, conflictData) {
        const conflictKey = `${operation.entity}_${operation.entityId}`;
        if (!this.conflictQueue.has(conflictKey)) {
            this.conflictQueue.set(conflictKey, []);
        }
        this.conflictQueue.get(conflictKey).push(operation);
        logger_1.logger.warn(`Conflict detected for ${conflictKey}`, {
            operation: operation.id,
            conflictData
        });
        // In a real implementation, this would notify clients about the conflict
        // For now, we'll use a simple last-write-wins strategy
        await this.resolveConflictAutomatically(operation, conflictData);
    }
    async resolveConflictAutomatically(operation, conflictData) {
        // Simple last-write-wins resolution
        const resolution = {
            operationId: operation.id,
            resolution: 'client_wins', // Favor the incoming operation
            timestamp: new Date()
        };
        await this.applyConflictResolution(resolution);
    }
    async applyConflictResolution(resolution) {
        const operation = this.queue.get(resolution.operationId);
        if (!operation)
            return;
        switch (resolution.resolution) {
            case 'client_wins':
                // Force the operation to succeed
                operation.retryCount = 0;
                await this.processOperation(operation.id);
                break;
            case 'server_wins':
                // Discard the operation
                operation.status = 'completed';
                this.queue.delete(operation.id);
                break;
            case 'merge':
                // Apply merged data
                if (resolution.mergedData) {
                    operation.data = resolution.mergedData;
                    operation.retryCount = 0;
                    await this.processOperation(operation.id);
                }
                break;
            case 'manual':
                // Keep in conflict queue for manual resolution
                break;
        }
        logger_1.logger.info(`Applied conflict resolution: ${resolution.resolution} for operation ${resolution.operationId}`);
    }
    getPendingOperations() {
        return Array.from(this.queue.values()).filter(op => op.status === 'pending');
    }
    getFailedOperations() {
        return Array.from(this.queue.values()).filter(op => op.status === 'failed');
    }
    getConflicts() {
        return new Map(this.conflictQueue);
    }
    clearCompletedOperations() {
        for (const [id, operation] of this.queue.entries()) {
            if (operation.status === 'completed') {
                this.queue.delete(id);
            }
        }
    }
    getQueueStatus() {
        const operations = Array.from(this.queue.values());
        return {
            pending: operations.filter(op => op.status === 'pending').length,
            processing: operations.filter(op => op.status === 'processing').length,
            completed: operations.filter(op => op.status === 'completed').length,
            failed: operations.filter(op => op.status === 'failed').length
        };
    }
    generateOperationId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SyncQueueService = SyncQueueService;
//# sourceMappingURL=SyncQueueService.js.map