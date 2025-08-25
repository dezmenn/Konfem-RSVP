import { useState, useEffect, useCallback } from 'react';
import SyncService from '../services/SyncService';
import { WebSocketClient } from '../services/WebSocketClient';

export interface SyncStatus {
  isOnline: boolean;
  webSocketConnected: boolean;
  pendingCount: number;
  failedCount: number;
  syncInProgress: boolean;
}

export interface SyncHookReturn {
  syncStatus: SyncStatus;
  performOperation: (
    type: 'create' | 'update' | 'delete',
    entity: 'guest' | 'table' | 'venue' | 'rsvp',
    entityId: string,
    data: any,
    eventId: string
  ) => Promise<{ success: boolean; operationId?: string; error?: string }>;
  requestFullSync: (eventId: string) => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  clearSyncedOperations: () => void;
  initialize: (eventId: string, userId?: string) => Promise<void>;
  destroy: () => void;
}

export const useSync = (): SyncHookReturn => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    webSocketConnected: false,
    pendingCount: 0,
    failedCount: 0,
    syncInProgress: false
  });

  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const webSocketClient = WebSocketClient.getInstance();

  // Update sync status
  const updateSyncStatus = useCallback(() => {
    if (syncService) {
      const status = syncService.getSyncStatus();
      setSyncStatus(status);
    }
  }, [syncService]);

  // Initialize sync service
  const initialize = useCallback(async (eventId: string, userId?: string) => {
    try {
      const service = new SyncService(eventId);
      setSyncService(service);
      await service.initialize(eventId, userId);
      updateSyncStatus();
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }, [updateSyncStatus]);

  // Perform operation with sync
  const performOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    entity: 'guest' | 'table' | 'venue' | 'rsvp',
    entityId: string,
    data: any,
    eventId: string
  ) => {
    if (!syncService) return { success: false, error: 'Sync service not initialized' };
    const result = await syncService.performOperation(type, entity, entityId, data, eventId);
    updateSyncStatus();
    return result;
  }, [syncService, updateSyncStatus]);

  // Request full sync
  const requestFullSync = useCallback(async (eventId: string) => {
    if (!syncService) return;
    await syncService.requestFullSync(eventId);
    updateSyncStatus();
  }, [syncService, updateSyncStatus]);

  // Retry failed operations
  const retryFailedOperations = useCallback(async () => {
    if (!syncService) return;
    await syncService.retryFailedOperations();
    updateSyncStatus();
  }, [syncService, updateSyncStatus]);

  // Clear synced operations
  const clearSyncedOperations = useCallback(() => {
    if (!syncService) return;
    syncService.clearSyncedOperations();
    updateSyncStatus();
  }, [syncService, updateSyncStatus]);

  // Destroy sync service
  const destroy = useCallback(() => {
    if (!syncService) return;
    syncService.destroy();
  }, [syncService]);

  // Set up event listeners
  useEffect(() => {
    // Listen for sync events
    const handleRemoteSyncEvent = (event: CustomEvent) => {
      console.log('Remote sync event received:', event.detail);
      updateSyncStatus();
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('data_updated', {
        detail: {
          type: event.detail.type,
          eventId: event.detail.eventId,
          data: event.detail.data
        }
      }));
    };

    const handleSyncDataReceived = (event: CustomEvent) => {
      console.log('Sync data received:', event.detail);
      updateSyncStatus();
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('full_sync_received', {
        detail: event.detail
      }));
    };

    const handleConflictResolved = (event: CustomEvent) => {
      console.log('Conflict resolved:', event.detail);
      updateSyncStatus();
    };

    // Add event listeners
    window.addEventListener('remote_sync_event', handleRemoteSyncEvent as EventListener);
    window.addEventListener('sync_data_received', handleSyncDataReceived as EventListener);
    window.addEventListener('conflict_resolved', handleConflictResolved as EventListener);

    // Listen for online/offline events
    const handleOnline = () => updateSyncStatus();
    const handleOffline = () => updateSyncStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update status periodically
    const statusInterval = setInterval(updateSyncStatus, 5000);

    return () => {
      window.removeEventListener('remote_sync_event', handleRemoteSyncEvent as EventListener);
      window.removeEventListener('sync_data_received', handleSyncDataReceived as EventListener);
      window.removeEventListener('conflict_resolved', handleConflictResolved as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, [updateSyncStatus]);

  return {
    syncStatus,
    performOperation,
    requestFullSync,
    retryFailedOperations,
    clearSyncedOperations,
    initialize,
    destroy
  };
};