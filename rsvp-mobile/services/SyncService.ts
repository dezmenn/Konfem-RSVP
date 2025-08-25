import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebSocketClient } from './WebSocketClient';
import config from '../config';
import { SyncData, SyncEvent, ConflictData } from './WebSocketClient';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'guest' | 'table' | 'venue' | 'rsvp';
  entityId: string;
  data: any;
  timestamp: Date;
  eventId: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

export class SyncService {
  private static instance: SyncService;
  private webSocketClient: WebSocketClient;
  private offlineOperations: Map<string, OfflineOperation> = new Map();
  private isOnline: boolean = true; // Assume online by default
  private syncInProgress: boolean = false;
  private storageKey: string = 'offline_operations';

  private constructor() {
    this.webSocketClient = WebSocketClient.getInstance();
    this.setupEventListeners();
    this.loadOperationsFromStorage();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private setupEventListeners(): void {
    // Listen for WebSocket events
    this.webSocketClient.on('sync_event', (syncEvent: SyncEvent) => {
      this.handleRemoteSyncEvent(syncEvent);
    });

    this.webSocketClient.on('sync_data', (syncData: SyncData) => {
      this.handleSyncData(syncData);
    });

    this.webSocketClient.on('conflict_resolved', (conflictData: ConflictData) => {
      this.handleConflictResolution(conflictData);
    });
  }

  public async performOperation(
    type: 'create' | 'update' | 'delete',
    entity: 'guest' | 'table' | 'venue' | 'rsvp',
    entityId: string,
    data: any,
    eventId: string
  ): Promise<{ success: boolean; operationId?: string; error?: string }> {
    const operationId = this.generateOperationId();
    const operation: OfflineOperation = {
      id: operationId,
      type,
      entity,
      entityId,
      data,
      timestamp: new Date(),
      eventId,
      status: 'pending',
      retryCount: 0
    };

    // Store operation locally
    this.offlineOperations.set(operationId, operation);
    await this.saveOperationsToStorage();

    // Try to sync immediately if online
    if (this.isOnline && this.webSocketClient.isOnline()) {
      try {
        await this.syncOperation(operation);
        return { success: true, operationId };
      } catch (error) {
        console.error('Failed to sync operation immediately:', error);
        return { 
          success: false, 
          operationId, 
          error: error instanceof Error ? error.message : 'Sync failed' 
        };
      }
    } else {
      // Queue for later sync
      console.log('Operation queued for offline sync:', operationId);
      return { success: true, operationId };
    }
  }

  private async syncOperation(operation: OfflineOperation): Promise<void> {
    operation.status = 'syncing';
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/sync/operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: operation.type,
          entity: operation.entity,
          entityId: operation.entityId,
          data: operation.data,
          eventId: operation.eventId,
          userId: 'current-user', // TODO: Get from auth context
          maxRetries: 3
        })
      });

      if (response.ok) {
        operation.status = 'synced';
        this.offlineOperations.delete(operation.id);
        console.log('Operation synced successfully:', operation.id);
      } else {
        throw new Error(`Sync failed with status: ${response.status}`);
      }
    } catch (error) {
      operation.status = 'failed';
      operation.retryCount++;
      console.error('Failed to sync operation:', operation.id, error);
      throw error;
    } finally {
      await this.saveOperationsToStorage();
    }
  }

  public async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || !this.webSocketClient.isOnline()) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync of pending operations');

    const pendingOperations = Array.from(this.offlineOperations.values())
      .filter(op => op.status === 'pending' || op.status === 'failed');

    for (const operation of pendingOperations) {
      try {
        await this.syncOperation(operation);
      } catch (error) {
        console.error('Failed to sync operation during batch sync:', operation.id, error);
        
        // If retry count exceeds limit, mark as permanently failed
        if (operation.retryCount >= 3) {
          operation.status = 'failed';
          console.error('Operation permanently failed:', operation.id);
        }
      }
    }

    this.syncInProgress = false;
    console.log('Finished syncing pending operations');
  }

  public async requestFullSync(eventId: string): Promise<void> {
    if (this.webSocketClient.isOnline()) {
      this.webSocketClient.requestSync(eventId);
    } else {
      console.warn('Cannot request full sync: WebSocket not connected');
    }
  }

  public getPendingOperations(): OfflineOperation[] {
    return Array.from(this.offlineOperations.values())
      .filter(op => op.status === 'pending');
  }

  public getFailedOperations(): OfflineOperation[] {
    return Array.from(this.offlineOperations.values())
      .filter(op => op.status === 'failed');
  }

  public async retryFailedOperations(): Promise<void> {
    const failedOperations = this.getFailedOperations();
    
    for (const operation of failedOperations) {
      operation.status = 'pending';
      operation.retryCount = 0;
    }

    await this.syncPendingOperations();
  }

  public async clearSyncedOperations(): Promise<void> {
    for (const [id, operation] of this.offlineOperations.entries()) {
      if (operation.status === 'synced') {
        this.offlineOperations.delete(id);
      }
    }
    await this.saveOperationsToStorage();
  }

  public getSyncStatus(): {
    isOnline: boolean;
    webSocketConnected: boolean;
    pendingCount: number;
    failedCount: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      webSocketConnected: this.webSocketClient.isOnline(),
      pendingCount: this.getPendingOperations().length,
      failedCount: this.getFailedOperations().length,
      syncInProgress: this.syncInProgress
    };
  }

  private handleRemoteSyncEvent(syncEvent: any): void {
    console.log('Handling remote sync event:', syncEvent);
    
    // Emit event for components to listen to
    // In React Native, we could use EventEmitter or a state management solution
    this.emit('remote_sync_event', syncEvent);
  }

  private handleSyncData(syncData: any): void {
    console.log('Handling sync data:', syncData);
    
    // Update local data with server data
    this.emit('sync_data_received', syncData);
  }

  private handleConflictResolution(conflictData: any): void {
    console.log('Handling conflict resolution:', conflictData);
    
    // Notify components about conflict resolution
    this.emit('conflict_resolved', conflictData);
  }

  private async saveOperationsToStorage(): Promise<void> {
    try {
      const operations = Array.from(this.offlineOperations.entries());
      const serialized = JSON.stringify(operations);
      await AsyncStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save operations to storage:', error);
    }
  }

  private async loadOperationsFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const operations = JSON.parse(stored);
        this.offlineOperations = new Map(operations.map(([id, op]: [string, any]) => [
          id,
          {
            ...op,
            timestamp: new Date(op.timestamp)
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load operations from storage:', error);
    }
  }

  private generateOperationId(): string {
    return `mobile_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simple event emitter for React Native
  private eventListeners: Map<string, Set<Function>> = new Map();

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

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Initialize the service
  public async initialize(eventId: string, userId?: string): Promise<void> {
    await this.loadOperationsFromStorage();
    
    try {
      await this.webSocketClient.connect(eventId, userId);
      console.log('Mobile SyncService initialized successfully');
      
      // Sync any pending operations
      await this.syncPendingOperations();
    } catch (error) {
      console.error('Failed to initialize Mobile SyncService:', error);
    }
  }

  public async destroy(): Promise<void> {
    this.webSocketClient.disconnect();
    await this.saveOperationsToStorage();
  }

  // Network status methods (would integrate with NetInfo in a real app)
  public setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;
    
    if (wasOffline && isOnline) {
      // Just came back online, sync pending operations
      this.syncPendingOperations();
    }
  }
}