import { logger } from '../utils/logger';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'guest' | 'table' | 'venue' | 'rsvp';
  entityId: string;
  data: any;
  timestamp: Date;
  userId?: string;
  eventId: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ConflictResolution {
  operationId: string;
  resolution: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  mergedData?: any;
  timestamp: Date;
}

export class SyncQueueService {
  private static instance: SyncQueueService;
  private queue: Map<string, SyncOperation> = new Map();
  private processingQueue: Set<string> = new Set();
  private conflictQueue: Map<string, SyncOperation[]> = new Map();

  private constructor() {}

  public static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  public addOperation(operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status'>): string {
    const id = this.generateOperationId();
    const syncOperation: SyncOperation = {
      ...operation,
      id,
      retryCount: 0,
      status: 'pending'
    };

    this.queue.set(id, syncOperation);
    logger.info(`Added sync operation: ${id} (${operation.type} ${operation.entity})`);
    
    // Process immediately if not in batch mode
    this.processOperation(id);
    
    return id;
  }

  public async processOperation(operationId: string): Promise<boolean> {
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
        logger.info(`Sync operation completed: ${operationId}`);
        return true;
      } else if (result.conflict) {
        await this.handleConflict(operation, result.conflictData);
        return false;
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      operation.retryCount++;
      
      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed';
        logger.error(`Sync operation failed permanently: ${operationId}`, error);
      } else {
        operation.status = 'pending';
        logger.warn(`Sync operation failed, will retry: ${operationId} (attempt ${operation.retryCount})`);
        
        // Schedule retry with exponential backoff
        setTimeout(() => {
          this.processOperation(operationId);
        }, Math.pow(2, operation.retryCount) * 1000);
      }
    } finally {
      this.processingQueue.delete(operationId);
    }

    return false;
  }

  private async executeOperation(operation: SyncOperation): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
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
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeGuestOperation(operation: SyncOperation): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    const { DemoDataService } = await import('./DemoDataService');
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
          demoService.addGuest({ ...operation.data, id: operation.entityId });
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
          
          demoService.updateGuest(operation.entityId, operation.data);
          return { success: true };

        case 'delete':
          demoService.deleteGuest(operation.entityId);
          return { success: true };

        default:
          return { success: false, error: `Unknown operation type: ${operation.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeTableOperation(operation: SyncOperation): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    const { DemoDataService } = await import('./DemoDataService');
    const demoService = DemoDataService.getInstance();

    try {
      switch (operation.type) {
        case 'create':
          demoService.addTable({ ...operation.data, id: operation.entityId });
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
          
          demoService.updateTable(operation.entityId, operation.data);
          return { success: true };

        case 'delete':
          demoService.deleteTable(operation.entityId);
          return { success: true };

        default:
          return { success: false, error: `Unknown operation type: ${operation.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeVenueOperation(operation: SyncOperation): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    // Venue operations implementation
    return { success: true };
  }

  private async executeRSVPOperation(operation: SyncOperation): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    // RSVP operations implementation
    return { success: true };
  }

  private async handleConflict(operation: SyncOperation, conflictData: any): Promise<void> {
    const conflictKey = `${operation.entity}_${operation.entityId}`;
    
    if (!this.conflictQueue.has(conflictKey)) {
      this.conflictQueue.set(conflictKey, []);
    }
    
    this.conflictQueue.get(conflictKey)!.push(operation);
    
    logger.warn(`Conflict detected for ${conflictKey}`, {
      operation: operation.id,
      conflictData
    });

    // In a real implementation, this would notify clients about the conflict
    // For now, we'll use a simple last-write-wins strategy
    await this.resolveConflictAutomatically(operation, conflictData);
  }

  private async resolveConflictAutomatically(operation: SyncOperation, conflictData: any): Promise<void> {
    // Simple last-write-wins resolution
    const resolution: ConflictResolution = {
      operationId: operation.id,
      resolution: 'client_wins', // Favor the incoming operation
      timestamp: new Date()
    };

    await this.applyConflictResolution(resolution);
  }

  public async applyConflictResolution(resolution: ConflictResolution): Promise<void> {
    const operation = this.queue.get(resolution.operationId);
    if (!operation) return;

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

    logger.info(`Applied conflict resolution: ${resolution.resolution} for operation ${resolution.operationId}`);
  }

  public getPendingOperations(): SyncOperation[] {
    return Array.from(this.queue.values()).filter(op => op.status === 'pending');
  }

  public getFailedOperations(): SyncOperation[] {
    return Array.from(this.queue.values()).filter(op => op.status === 'failed');
  }

  public getConflicts(): Map<string, SyncOperation[]> {
    return new Map(this.conflictQueue);
  }

  public clearCompletedOperations(): void {
    for (const [id, operation] of this.queue.entries()) {
      if (operation.status === 'completed') {
        this.queue.delete(id);
      }
    }
  }

  public getQueueStatus(): { pending: number; processing: number; completed: number; failed: number } {
    const operations = Array.from(this.queue.values());
    return {
      pending: operations.filter(op => op.status === 'pending').length,
      processing: operations.filter(op => op.status === 'processing').length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length
    };
  }

  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}