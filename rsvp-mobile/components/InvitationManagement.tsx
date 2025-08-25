import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import config from '../config';

interface InvitationSchedule {
  id: string;
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InvitationExecution {
  id: string;
  invitationScheduleId: string;
  eventId: string;
  executedAt: string;
  guestsProcessed: number;
  invitationsScheduled: number;
  invitationsSkipped: number;
  errors: string[];
}

interface InvitationStatus {
  eventId: string;
  eventTitle: string;
  rsvpDeadline: string;
  totalGuests: number;
  notInvitedGuests: number;
  pendingGuests: number;
  activeSchedules: number;
  nextInvitationDate?: string;
  lastExecutionDate?: string;
  totalInvitationsScheduled: number;
  totalInvitationsSent: number;
}

interface InvitationManagementProps {
  eventId: string;
}

const InvitationManagement: React.FC<InvitationManagementProps> = ({ eventId }) => {
  const [schedules, setSchedules] = useState<InvitationSchedule[]>([]);
  const [executions, setExecutions] = useState<InvitationExecution[]>([]);
  const [status, setStatus] = useState<InvitationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InvitationSchedule | null>(null);
  const [executing, setExecuting] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    triggerDays: 0,
    messageTemplate: '',
    isActive: true
  });

  const defaultTemplate = `Hi {{guestName}},

You're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}!

We're excited to celebrate with you. Please let us know if you can make it by {{rsvpDeadline}} by clicking the link below:

{{rsvpLink}}

Looking forward to seeing you there!

Best regards,
{{organizerName}}`;

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    console.log('loadData started');
    try {
      setError(null);

      const schedulesUrl = config.apiBaseUrl + '/api/invitations/event/' + eventId;
      const statusUrl = config.apiBaseUrl + '/api/invitations/status/' + eventId;
      const executionsUrl = config.apiBaseUrl + '/api/invitations/executions/' + eventId;

      console.log('Fetching schedules from URL:', schedulesUrl);
      console.log('Fetching status from URL:', statusUrl);
      console.log('Fetching executions from URL:', executionsUrl);

      const [schedulesRes, statusRes, executionsRes] = await Promise.all([
        fetch(schedulesUrl),
        fetch(statusUrl),
        fetch(executionsUrl)
      ]);

      console.log('Schedules Response OK:', schedulesRes.ok);
      console.log('Status Response OK:', statusRes.ok);
      console.log('Executions Response OK:', executionsRes.ok);

      if (!schedulesRes.ok || !statusRes.ok || !executionsRes.ok) {
        throw new Error('Failed to load invitation data');
      }

      const [schedulesData, statusData, executionsData] = await Promise.all([
        schedulesRes.json(),
        statusRes.json(),
        executionsRes.json()
      ]);

      console.log('Schedules Data:', schedulesData);
      console.log('Status Data:', statusData);
      console.log('Executions Data:', executionsData);

      setSchedules(schedulesData.data || []);
      setStatus(statusData.data);
      setExecutions(executionsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation data');
      console.error('Error loading invitation data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('Current error state:', error);
      console.log('loadData finished');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateSchedule = async () => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/invitations/configure';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          schedules: [formData]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invitation schedule');
      }

      setShowCreateModal(false);
      setFormData({
        triggerDays: 0,
        messageTemplate: '',
        isActive: true
      });
      await loadData();
      Alert.alert('Success', 'Invitation schedule created successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create invitation schedule');
    }
  };

  const handleEditSchedule = async () => {
    if (!editingSchedule) return;

    try {
      const apiUrl = config.apiBaseUrl + '/api/invitations/schedule/' + editingSchedule.id;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invitation schedule');
      }

      setShowEditModal(false);
      setEditingSchedule(null);
      await loadData();
      Alert.alert('Success', 'Invitation schedule updated successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update invitation schedule');
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    Alert.alert(
      'Delete Invitation',
      'Are you sure you want to delete this invitation schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const apiUrl = config.apiBaseUrl + '/api/invitations/schedule/' + scheduleId;
              const response = await fetch(apiUrl, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete invitation schedule');
              }

              await loadData();
              Alert.alert('Success', 'Invitation schedule deleted successfully');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete invitation schedule');
            }
          }
        }
      ]
    );
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/invitations/schedule/' + scheduleId + '/toggle';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle invitation schedule');
      }

      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to toggle invitation schedule');
    }
  };

  const handleExecuteInvitations = async () => {
    Alert.alert(
      'Execute Invitations',
      'This will send invitations based on active schedules. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: async () => {
            try {
              setExecuting(true);
              const apiUrl = config.apiBaseUrl + '/api/invitations/execute-all/' + eventId;
              const response = await fetch(apiUrl, {
                method: 'POST',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to execute invitations');
              }

              const result = await response.json();
              Alert.alert(
                'Success',
                `Executed ${result.data.length} invitation schedules. ${result.message}`
              );
              await loadData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to execute invitations');
            } finally {
              setExecuting(false);
            }
          }
        }
      ]
    );
  };

  const handleBulkInvitation = async () => {
    if (!status || status.notInvitedGuests === 0) {
      Alert.alert('Info', 'No guests available to invite.');
      return;
    }

    Alert.alert(
      'Send Bulk Invitations',
      `This will send invitations to ${status.notInvitedGuests} guests who have not been invited yet. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSendingBulk(true);
              const apiUrl = config.apiBaseUrl + '/api/invitations/bulk-invite/' + eventId;
              const response = await fetch(apiUrl, {
                method: 'POST',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send bulk invitations');
              }

              const result = await response.json();
              Alert.alert(
                'Success',
                `Successfully sent ${result.data.invitationsSent} invitations to ${result.data.guestsInvited} guests.`
              );
              await loadData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send bulk invitations');
            } finally {
              setSendingBulk(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateDefaults = async () => {
    try {
      const apiUrl = config.apiBaseUrl + '/api/invitations/defaults/' + eventId;
      const response = await fetch(apiUrl, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create default invitations');
      }

      await loadData();
      Alert.alert('Success', 'Default invitation schedules created successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create default invitations');
    }
  };

  const openEditModal = (schedule: InvitationSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      triggerDays: schedule.triggerDays,
      messageTemplate: schedule.messageTemplate,
      isActive: schedule.isActive
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      triggerDays: 0,
      messageTemplate: defaultTemplate,
      isActive: true
    });
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading invitation data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Invitation Management</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.successButton, (sendingBulk || (status && status.notInvitedGuests === 0)) && styles.disabledButton]} 
          onPress={handleBulkInvitation}
          disabled={sendingBulk || (status?.notInvitedGuests === 0)}
        >
          <Text style={styles.buttonText}>
            {sendingBulk ? '⏳ Sending...' : '📧 Send Bulk Invitations'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
          <Text style={styles.buttonText}>➕ Create Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateDefaults}>
          <Text style={styles.buttonText}>🔧 Create Defaults</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.warningButton, executing && styles.disabledButton]} 
          onPress={handleExecuteInvitations}
          disabled={executing}
        >
          <Text style={styles.buttonText}>
            {executing ? '⏳ Executing...' : '▶️ Execute Schedules'}
          </Text>
        </TouchableOpacity>
      </View>

      {status && (
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Total Guests</Text>
            <Text style={styles.statusValue}>{status.totalGuests}</Text>
          </View>
          <View style={[styles.statusCard, styles.warningCard]}>
            <Text style={styles.statusLabel}>Not Invited</Text>
            <Text style={styles.statusValue}>{status.notInvitedGuests}</Text>
            <Text style={styles.statusSubtitle}>Ready to invite</Text>
          </View>
          <View style={[styles.statusCard, styles.infoCard]}>
            <Text style={styles.statusLabel}>Pending RSVPs</Text>
            <Text style={styles.statusValue}>{status.pendingGuests}</Text>
            <Text style={styles.statusSubtitle}>Awaiting response</Text>
          </View>
          <View style={[styles.statusCard, styles.successCard]}>
            <Text style={styles.statusLabel}>Active Schedules</Text>
            <Text style={styles.statusValue}>{status.activeSchedules}</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Invitations Sent</Text>
            <Text style={styles.statusValue}>{status.totalInvitationsSent}</Text>
            <Text style={styles.statusSubtitle}>of {status.totalInvitationsScheduled} scheduled</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invitation Schedules</Text>
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No invitation schedules configured</Text>
            <Text style={styles.emptySubtitle}>
              Create invitation schedules to automatically send invitations to your guests, or send bulk invitations immediately.
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={styles.successButton} onPress={handleBulkInvitation}>
                <Text style={styles.buttonText}>Send Bulk Invitations Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
                <Text style={styles.buttonText}>Create Your First Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          schedules.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTrigger}>
                  {schedule.triggerDays === 0 ? 'Send immediately' : `${schedule.triggerDays} days before RSVP deadline`}
                </Text>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => openEditModal(schedule)}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDeleteSchedule(schedule.id)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.scheduleTemplate} numberOfLines={2}>
                {schedule.messageTemplate}
              </Text>
              <View style={styles.scheduleFooter}>
                <View style={styles.scheduleStatus}>
                  <Text style={[
                    styles.statusBadge, 
                    schedule.isActive ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    {schedule.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                  <Text style={styles.scheduleDate}>
                    Created {formatDate(schedule.createdAt)}
                  </Text>
                </View>
                <Switch
                  value={schedule.isActive}
                  onValueChange={(value) => handleToggleSchedule(schedule.id, value)}
                />
              </View>
            </View>
          ))
        )}
      </View>

      {executions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Executions</Text>
          {executions.slice(0, 5).map((execution) => (
            <View key={execution.id} style={styles.executionCard}>
            <Text style={styles.executionDate}>
                {formatDate(execution.executedAt)}
              </Text>
              <Text style={styles.executionStats}>
                {execution.guestsProcessed} guests processed • {execution.invitationsScheduled} invitations sent • {execution.invitationsSkipped} skipped
              </Text>
              {execution.errors.length > 0 && (
                <Text style={styles.executionErrors}>
                  {execution.errors.length} errors occurred
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Invitation Schedule</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Trigger Days Before RSVP Deadline</Text>
              <TextInput
                style={styles.input}
                value={formData.triggerDays.toString()}
                onChangeText={(text) => setFormData({ ...formData, triggerDays: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.helpText}>Number of days before the RSVP deadline to send the invitation (0 = send immediately)</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message Template</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.messageTemplate}
                onChangeText={(text) => setFormData({ ...formData, messageTemplate: text })}
                multiline
                numberOfLines={8}
                placeholder="Enter your invitation message..."
              />
              <Text style={styles.helpText}>
                Available variables: {'{{guestName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'}, {'{{rsvpDeadline}}'}, {'{{rsvpLink}}'}, {'{{organizerName}}'}
              </Text>
            </View>
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active (start sending invitations immediately)</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateSchedule}>
              <Text style={styles.buttonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Invitation Schedule</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Trigger Days Before RSVP Deadline</Text>
              <TextInput
                style={styles.input}
                value={formData.triggerDays.toString()}
                onChangeText={(text) => setFormData({ ...formData, triggerDays: parseInt(text) || 0 })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message Template</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.messageTemplate}
                onChangeText={(text) => setFormData({ ...formData, messageTemplate: text })}
                multiline
                numberOfLines={8}
              />
              <Text style={styles.helpText}>
                Available variables: {'{{guestName}}'}, {'{{eventTitle}}'}, {'{{eventDate}}'}, {'{{eventLocation}}'}, {'{{rsvpDeadline}}'}, {'{{rsvpLink}}'}, {'{{organizerName}}'}
              </Text>
            </View>
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleEditSchedule}>
              <Text style={styles.buttonText}>Update Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    flex: 1,
  },
  errorClose: {
    color: '#721c24',
    fontSize: 20,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  successButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  warningButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    minWidth: 150,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  warningCard: {
    borderLeftColor: '#ffc107',
  },
  successCard: {
    borderLeftColor: '#28a745',
  },
  infoCard: {
    borderLeftColor: '#17a2b8',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyActions: {
    gap: 15,
    alignItems: 'center',
  },
  scheduleCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleTrigger: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 16,
  },
  scheduleTemplate: {
    color: '#666',
    fontSize: 14,
    marginBottom: 15,
  },
  scheduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleStatus: {
    flex: 1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  scheduleDate: {
    fontSize: 12,
    color: '#888',
  },
  executionCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  executionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  executionStats: {
    fontSize: 12,
    color: '#666',
  },
  executionErrors: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default InvitationManagement;