import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SyncService } from '../services/SyncService';

interface SyncStatusProps {
  eventId: string;
  showDetails?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  webSocketConnected: boolean;
  pendingCount: number;
  failedCount: number;
  syncInProgress: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ eventId, showDetails = false }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    webSocketConnected: false,
    pendingCount: 0,
    failedCount: 0,
    syncInProgress: false
  });

  const syncService = SyncService.getInstance();

  useEffect(() => {
    const updateSyncStatus = () => {
      const status = syncService.getSyncStatus();
      setSyncStatus(status);
    };

    // Initial update
    updateSyncStatus();

    // Update periodically
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, [syncService]);

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#6c757d';
    if (!syncStatus.webSocketConnected) return '#6c757d';
    if (syncStatus.failedCount > 0) return '#dc3545';
    if (syncStatus.pendingCount > 0 || syncStatus.syncInProgress) return '#ffc107';
    return '#28a745';
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
      await syncService.retryFailedOperations();
    } catch (error) {
      console.error('Failed to retry operations:', error);
    }
  };

  const handleRequestSync = async () => {
    try {
      await syncService.requestFullSync(eventId);
    } catch (error) {
      console.error('Failed to request sync:', error);
    }
  };

  const handleClearSynced = async () => {
    try {
      await syncService.clearSyncedOperations();
    } catch (error) {
      console.error('Failed to clear synced operations:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {syncStatus.syncInProgress && (
          <ActivityIndicator size="small" color={getStatusColor()} style={styles.spinner} />
        )}
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.info}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Network:</Text>
              <Text style={[styles.value, { color: syncStatus.isOnline ? '#28a745' : '#dc3545' }]}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>WebSocket:</Text>
              <Text style={[styles.value, { color: syncStatus.webSocketConnected ? '#28a745' : '#dc3545' }]}>
                {syncStatus.webSocketConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pending:</Text>
              <Text style={styles.value}>{syncStatus.pendingCount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Failed:</Text>
              <Text style={styles.value}>{syncStatus.failedCount}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {syncStatus.failedCount > 0 && (
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]}
                onPress={handleRetryFailed}
                disabled={syncStatus.syncInProgress}
              >
                <Text style={[styles.buttonText, styles.retryButtonText]}>Retry Failed</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.syncButton]}
              onPress={handleRequestSync}
              disabled={!syncStatus.webSocketConnected || syncStatus.syncInProgress}
            >
              <Text style={[styles.buttonText, styles.syncButtonText]}>Force Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.clearButton]}
              onPress={handleClearSynced}
              disabled={syncStatus.syncInProgress}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    margin: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    flex: 1,
  },
  spinner: {
    marginLeft: 8,
  },
  details: {
    marginTop: 12,
    gap: 12,
  },
  info: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#6c757d',
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  retryButton: {
    borderColor: '#dc3545',
  },
  retryButtonText: {
    color: '#dc3545',
  },
  syncButton: {
    borderColor: '#007bff',
  },
  syncButtonText: {
    color: '#007bff',
  },
  clearButton: {
    borderColor: '#6c757d',
  },
  clearButtonText: {
    color: '#6c757d',
  },
});

export default SyncStatus;