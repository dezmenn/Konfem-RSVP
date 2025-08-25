import React, { useState, useEffect } from 'react';
import './InvitationManagement.css';

// Type definitions
interface InvitationSchedule {
  id: string;
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

interface FormData {
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
}

// Default template constant
const DEFAULT_REMINDER_TEMPLATE = `Hi {{guestName}},

This is a friendly reminder about {{eventTitle}} on {{eventDate}} at {{eventLocation}}.

We haven't received your RSVP yet and the deadline is {{rsvpDeadline}}. Please let us know if you can make it by clicking the link below:

{{rsvpLink}}

Looking forward to celebrating with you!

Best regards,
{{organizerName}}`;

// Main component
const InvitationManagement: React.FC<InvitationManagementProps> = ({ eventId }) => {
  // State management
  const [schedules, setSchedules] = useState<InvitationSchedule[]>([]);
  const [status, setStatus] = useState<InvitationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    triggerDays: 0,
    messageTemplate: '',
    isActive: true
  });

  // Load data on component mount
  useEffect(() => {
    if (eventId) {
      // Add a small delay to ensure backend is ready
      const timer = setTimeout(() => {
        loadData();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [eventId]);

  // API functions with retry mechanism
  const loadData = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;

    try {
      console.log('loadData: Starting to fetch data for eventId:', eventId, `(attempt ${retryCount + 1})`);
      setLoading(true);
      setError(null);

      // Check if backend is accessible
      try {
        const healthCheck = await fetch('/api', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!healthCheck.ok) {
          throw new Error('Backend server is not accessible. Please make sure the backend is running on port 5000.');
        }
        console.log('loadData: Backend health check passed');
      } catch (healthError) {
        throw new Error('Cannot connect to backend server. Please start the backend with: npm run dev:backend');
      }

      const [schedulesRes, statusRes] = await Promise.all([
        fetch(`http://localhost:5000/api/invitations/event/${eventId}`, {
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`http://localhost:5000/api/invitations/status/${eventId}`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      console.log('loadData: Fetch responses received', {
        schedulesStatus: schedulesRes.status,
        schedulesOk: schedulesRes.ok,
        statusStatus: statusRes.status,
        statusOk: statusRes.ok
      });

      if (!schedulesRes.ok) {
        const schedulesError = await schedulesRes.text();
        console.error('Schedules API error:', schedulesError);
        throw new Error(`Failed to load reminder schedules (${schedulesRes.status}): ${schedulesError}`);
      }

      if (!statusRes.ok) {
        const statusError = await statusRes.text();
        console.error('Status API error:', statusError);
        throw new Error(`Failed to load invitation status (${statusRes.status}): ${statusError}`);
      }

      const [schedulesData, statusData] = await Promise.all([
        schedulesRes.json(),
        statusRes.json()
      ]);

      console.log('loadData: Received data', {
        schedulesSuccess: schedulesData.success,
        schedulesCount: schedulesData.data?.length || 0,
        statusSuccess: statusData.success,
        totalGuests: statusData.data?.totalGuests || 0
      });

      if (!schedulesData.success) {
        throw new Error('Invalid schedules response format');
      }

      if (!statusData.success) {
        throw new Error('Invalid status response format');
      }

      setSchedules(schedulesData.data || []);
      setStatus(statusData.data);
      console.log('loadData: State updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitation data';
      console.error('loadData error:', errorMessage);

      // Retry logic
      if (retryCount < maxRetries && !errorMessage.includes('Cannot connect to backend')) {
        console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          loadData(retryCount + 1);
        }, 2000);
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Event ID:', eventId);

    try {
      const response = await fetch('http://localhost:5000/api/invitations/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          schedules: [formData]
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create reminder schedule');
      }

      const result = await response.json();
      console.log('API Success:', result);

      console.log('Closing modal and reloading data...');
      setShowCreateModal(false);
      setFormData({
        triggerDays: 0,
        messageTemplate: '',
        isActive: true
      });
      console.log('About to call loadData...');
      await loadData();
      console.log('loadData completed');
    } catch (err) {
      console.error('Error creating reminder schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this reminder schedule?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/invitations/schedule/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reminder schedule');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder schedule');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:5000/api/invitations/schedule/${scheduleId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle reminder schedule');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle reminder schedule');
    }
  };

  const handleExecuteInvitations = async (): Promise<void> => {
    try {
      setExecuting(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/invitations/execute-all/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute invitations');
      }

      const result = await response.json();
      console.log('Invitations executed:', result);

      // Show success message
      alert(`Successfully executed reminder schedules!\n${result.message}`);

      // Reload data to show updated status
      await loadData();
    } catch (err) {
      console.error('Error executing invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute invitations');
    } finally {
      setExecuting(false);
    }
  };

  const handleExecuteSpecificInvitation = async (scheduleId: string): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`http://localhost:5000/api/invitations/execute/${scheduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute reminder');
      }

      const result = await response.json();
      console.log('Invitation executed:', result);

      // Show success message
      alert(`Successfully executed reminder schedule!\nSent ${result.data.invitationsScheduled} reminders to pending guests.`);

      // Reload data to show updated status
      await loadData();
    } catch (err) {
      console.error('Error executing reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute reminder');
    }
  };

  const handleBulkInvitation = async (): Promise<void> => {
    if (!window.confirm('This will send invitations to all guests who have not been invited yet. Continue?')) {
      return;
    }

    try {
      setSendingBulk(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/invitations/bulk-invite/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk invitations');
      }

      const result = await response.json();
      console.log('Bulk invitations sent:', result);

      // Show success message
      alert(`Successfully sent bulk invitations!\nSent ${result.data.invitationsSent} invitations to ${result.data.guestsInvited} guests.`);

      // Reload data to show updated status
      await loadData();
    } catch (err) {
      console.error('Error sending bulk invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to send bulk invitations');
    } finally {
      setSendingBulk(false);
    }
  };

  const handleCreateDefaults = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:5000/api/invitations/defaults/${eventId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create default reminders');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default reminders');
    }
  };

  // Helper functions
  const openCreateModal = (): void => {
    setFormData({
      triggerDays: 7,
      messageTemplate: DEFAULT_REMINDER_TEMPLATE,
      isActive: true
    });
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="invitation-management">
        <div className="loading">Loading reminder data...</div>
      </div>
    );
  }

  // Main render
  return (
    <div className="invitation-management">
      <div className="invitation-header">
        <h2>Invitation Management</h2>
        <div className="invitation-actions">
          <button
            className="btn btn-success"
            onClick={handleBulkInvitation}
            disabled={sendingBulk || (status?.notInvitedGuests === 0)}
          >
            {sendingBulk ? '⏳ Sending...' : '📧 Send Bulk Invitations'}
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            ➕ Create Reminder Schedule
          </button>
          <button className="btn btn-secondary" onClick={handleCreateDefaults}>
            🔧 Create Default Reminders
          </button>
          <button
            className="btn btn-warning"
            onClick={handleExecuteInvitations}
            disabled={executing}
          >
            {executing ? '⏳ Executing...' : '▶️ Execute Reminder Schedules'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          <div style={{ marginBottom: '10px' }}>{error}</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-small btn-primary"
              onClick={() => {
                setError(null);
                loadData();
              }}
            >
              🔄 Retry
            </button>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className="invitation-status">
          <div className="status-card">
            <h3>Total Guests</h3>
            <div className="value">{status.totalGuests}</div>
          </div>
          <div className="status-card warning">
            <h3>Not Invited</h3>
            <div className="value">{status.notInvitedGuests}</div>
            <div className="subtitle">Ready to invite</div>
          </div>
          <div className="status-card info">
            <h3>Pending RSVPs</h3>
            <div className="value">{status.pendingGuests}</div>
            <div className="subtitle">Awaiting response</div>
          </div>
          <div className="status-card success">
            <h3>Active Schedules</h3>
            <div className="value">{status.activeSchedules}</div>
          </div>
          <div className="status-card">
            <h3>Invitations Sent</h3>
            <div className="value">{status.totalInvitationsSent}</div>
            <div className="subtitle">of {status.totalInvitationsScheduled} scheduled</div>
          </div>
          {status.nextInvitationDate && (
            <div className="status-card warning">
              <h3>Next Invitation</h3>
              <div className="value" style={{ fontSize: '16px' }}>
                {formatDate(status.nextInvitationDate)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="invitation-schedules">
        <div className="schedules-header">
          <h3>Reminder Schedules</h3>
        </div>
        {schedules.length === 0 ? (
          <div className="empty-state">
            <h4>No reminder schedules configured</h4>
            <p>Create reminder schedules to automatically send reminders to pending guests, or send bulk invitations to uninvited guests immediately.</p>
            <div className="empty-actions">
              <button className="btn btn-success" onClick={handleBulkInvitation}>
                Send Bulk Invitations Now
              </button>
              <button className="btn btn-primary" onClick={openCreateModal}>
                Create Your First Reminder Schedule
              </button>
            </div>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-info">
                <div className="schedule-trigger">
                  {schedule.triggerDays === 0 ? 'Send immediately' : `${schedule.triggerDays} days before RSVP deadline`}
                </div>
                <div className="schedule-template">
                  {schedule.messageTemplate.substring(0, 100)}...
                </div>
                <div className="schedule-status">
                  <span className={`status-badge ${schedule.isActive ? 'active' : 'inactive'}`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    Created {formatDate(schedule.createdAt)}
                  </span>
                </div>
              </div>
              <div className="schedule-actions">
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleExecuteSpecificInvitation(schedule.id)}
                  disabled={!schedule.isActive}
                  title={schedule.isActive ? 'Send reminders now' : 'Schedule must be active to execute'}
                >
                  📤 Send Reminders
                </button>
                <button
                  className={`btn btn-small ${schedule.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleSchedule(schedule.id, !schedule.isActive)}
                >
                  {schedule.isActive ? '⏸️ Pause' : '▶️ Activate'}
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Reminder Schedule</h3>
            <form onSubmit={handleCreateSchedule}>
              <div className="form-group">
                <label htmlFor="triggerDays">Trigger Days Before RSVP Deadline</label>
                <input
                  type="number"
                  id="triggerDays"
                  className="form-control"
                  value={formData.triggerDays}
                  onChange={(e) => setFormData({ ...formData, triggerDays: parseInt(e.target.value) })}
                  min="0"
                  max="365"
                  required
                />
                <div className="form-help">Number of days before the RSVP deadline to send the reminder (0 = send immediately)</div>
              </div>
              <div className="form-group">
                <label htmlFor="messageTemplate">Reminder Message Template</label>
                <textarea
                  id="messageTemplate"
                  className="form-control textarea"
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  required
                />
                <div className="variables-help">
                  <h4>Available Variables:</h4>
                  <div className="variables-list">
                    <span className="variable-item">{'{{guestName}}'}</span>
                    <span className="variable-item">{'{{eventTitle}}'}</span>
                    <span className="variable-item">{'{{eventDate}}'}</span>
                    <span className="variable-item">{'{{eventTime}}'}</span>
                    <span className="variable-item">{'{{eventLocation}}'}</span>
                    <span className="variable-item">{'{{rsvpDeadline}}'}</span>
                    <span className="variable-item">{'{{rsvpLink}}'}</span>
                    <span className="variable-item">{'{{organizerName}}'}</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  {' '}Active (start sending reminders immediately)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Reminder Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationManagement;