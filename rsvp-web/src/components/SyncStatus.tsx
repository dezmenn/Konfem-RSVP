import React from 'react';
import { useSync } from '../hooks/useSync';
import './SyncStatus.css';

interface SyncStatusProps {
  eventId: string;
  showDetails?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ eventId, showDetails = false }) => {
  const { syncStatus, retryFailedOperations, clearSyncedOperations, requestFullSync } = useSync();

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'offline';
    if (!syncStatus.webSocketConnected) return 'disconnected';
    if (syncStatus.failedCount > 0) return 'error';
    if (syncStatus.pendingCount > 0 || syncStatus.syncInProgress) return 'syncing';
    return 'online';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (!syncStatus.webSocketConnected) return 'Disconnected';
    if (syncStatus.failedCount > 0) return `${syncStatus.failedCount} Failed`;
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} Pending`;
    return 'Online';
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailedOperations();
    } catch (error) {
      console.error('Failed to retry operations:', error);
    }
  };

  const handleRequestSync = async () => {
    try {
      await requestFullSync(eventId);
    } catch (error) {
      console.error('Failed to request sync:', error);
    }
  };

  const handleClearSynced = () => {
    try {
      clearSyncedOperations();
    } catch (error) {
      console.error('Failed to clear synced operations:', error);
    }
  };

  return (
    <div className={`sync-status sync-status--${getStatusColor()}`}>
      <div className="sync-status__indicator">
        <div className="sync-status__dot"></div>
        <span className="sync-status__text">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="sync-status__details">
          <div className="sync-status__info">
            <div className="sync-status__info-item">
              <span className="sync-status__label">Network:</span>
              <span className={`sync-status__value ${syncStatus.isOnline ? 'online' : 'offline'}`}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="sync-status__info-item">
              <span className="sync-status__label">WebSocket:</span>
              <span className={`sync-status__value ${syncStatus.webSocketConnected ? 'connected' : 'disconnected'}`}>
                {syncStatus.webSocketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="sync-status__info-item">
              <span className="sync-status__label">Pending:</span>
              <span className="sync-status__value">{syncStatus.pendingCount}</span>
            </div>
            <div className="sync-status__info-item">
              <span className="sync-status__label">Failed:</span>
              <span className="sync-status__value">{syncStatus.failedCount}</span>
            </div>
          </div>

          <div className="sync-status__actions">
            {syncStatus.failedCount > 0 && (
              <button 
                className="sync-status__button sync-status__button--retry"
                onClick={handleRetryFailed}
                disabled={syncStatus.syncInProgress}
              >
                Retry Failed
              </button>
            )}
            
            <button 
              className="sync-status__button sync-status__button--sync"
              onClick={handleRequestSync}
              disabled={!syncStatus.webSocketConnected || syncStatus.syncInProgress}
            >
              Force Sync
            </button>
            
            <button 
              className="sync-status__button sync-status__button--clear"
              onClick={handleClearSynced}
              disabled={syncStatus.syncInProgress}
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;