import React, { useState, useEffect } from 'react';
import './ReminderManagement.css';

// Type definitions
interface ReminderSchedule {
  id: string;
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReminderStatus {
  eventId: string;
  eventTitle: string;
  rsvpDeadline: string;
  totalGuests: number;
  pendingGuests: number;
  activeSchedules: number;
  nextReminderDate?: string;
  lastExecutionDate?: string;
  totalRemindersScheduled: number;
  totalRemindersSent: number;
}

interface ReminderManagementProps {
  eventId: string;
}

interface FormData {
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
}

// Default template constant
const DEFAULT_TEMPLATE = `Hi {{guestName}},

This is a friendly reminder about {{eventTitle}} on {{eventDate}} at {{eventLocation}}.

We haven't received your RSVP yet and the deadline is {{rsvpDeadline}}. Please let us know if you can make it by clicking the link below:

{{rsvpLink}}

Looking forward to celebrating with you!

Best regards,
{{organizerName}}`;

// Main component
const ReminderManagement: React.FC<ReminderManagementProps> = ({ eventId }) => {
  // State management
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([]);
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    triggerDays: 7,
    messageTemplate: '',
    isActive: true
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [eventId]);

  // API functions
  const loadData = async (): Promise<void> => {
    try {
      console.log('loadData: Starting to fetch data...');
      setLoading(true);
      setError(null);

      const [schedulesRes, statusRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reminders/event/${eventId}`),
        fetch(`http://localhost:5000/api/reminders/status/${eventId}`)
      ]);

      console.log('loadData: Fetch responses received', { 
        schedulesOk: schedulesRes.ok, 
        statusOk: statusRes.ok 
      });

      if (!schedulesRes.ok || !statusRes.ok) {
        throw new Error('Failed to load reminder data');
      }

      const [schedulesData, statusData] = await Promise.all([
        schedulesRes.json(),
        statusRes.json()
      ]);

      console.log('loadData: Received data', { 
        schedules: schedulesData.data, 
        status: statusData.data 
      });

      setSchedules(schedulesData.data || []);
      setStatus(statusData.data);
      console.log('loadData: State updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminder data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Event ID:', eventId);
    
    try {
      const response = await fetch('http://localhost:5000/api/reminders/configure', {
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
        triggerDays: 7,
        messageTemplate: '',
        isActive: true
      });
      console.log('About to call loadData...');
      await loadData();
      console.log('loadData completed');
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this reminder schedule?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reminders/schedule/${scheduleId}`, {
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
      const response = await fetch(`http://localhost:5000/api/reminders/schedule/${scheduleId}/toggle`, {
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

  const handleExecuteReminders = async (): Promise<void> => {
    try {
      setExecuting(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/reminders/execute-all/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute reminders');
      }

      const result = await response.json();
      console.log('Reminders executed:', result);
      
      // Show success message
      alert(`Successfully executed reminders!\n${result.message}`);
      
      // Reload data to show updated status
      await loadData();
    } catch (err) {
      console.error('Error executing reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute reminders');
    } finally {
      setExecuting(false);
    }
  };

  const handleExecuteSpecificReminder = async (scheduleId: string): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`http://localhost:5000/api/reminders/execute/${scheduleId}`, {
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
      console.log('Reminder executed:', result);
      
      // Show success message
      alert(`Successfully executed reminder!\nSent ${result.data.remindersScheduled} reminders to guests.`);
      
      // Reload data to show updated status
      await loadData();
    } catch (err) {
      console.error('Error executing reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute reminder');
    }
  };

  const handleCreateDefaults = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/defaults/${eventId}`, {
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
      messageTemplate: DEFAULT_TEMPLATE,
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
      <div className="reminder-management">
        <div className="loading">Loading reminder data...</div>
      </div>
    );
  }

  // Main render
  return (
    <div className="reminder-management">
      <div className="reminder-header">
        <h2>Reminder Management</h2>
        <div className="reminder-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            ➕ Create Reminder
          </button>
          <button className="btn btn-secondary" onClick={handleCreateDefaults}>
            🔧 Create Defaults
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleExecuteReminders}
            disabled={executing}
          >
            {executing ? '⏳ Executing...' : '▶️ Execute Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {status && (
        <div className="reminder-status">
          <div className="status-card">
            <h3>Total Guests</h3>
            <div className="value">{status.totalGuests}</div>
          </div>
          <div className="status-card warning">
            <h3>Pending RSVPs</h3>
            <div className="value">{status.pendingGuests}</div>
            <div className="subtitle">Need reminders</div>
          </div>
          <div className="status-card success">
            <h3>Active Schedules</h3>
            <div className="value">{status.activeSchedules}</div>
          </div>
          <div className="status-card">
            <h3>Reminders Sent</h3>
            <div className="value">{status.totalRemindersSent}</div>
            <div className="subtitle">of {status.totalRemindersScheduled} scheduled</div>
          </div>
          {status.nextReminderDate && (
            <div className="status-card warning">
              <h3>Next Reminder</h3>
              <div className="value" style={{ fontSize: '16px' }}>
                {formatDate(status.nextReminderDate)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reminder-schedules">
        <div className="schedules-header">
          <h3>Reminder Schedules</h3>
        </div>
        {schedules.length === 0 ? (
          <div className="empty-state">
            <h4>No reminder schedules configured</h4>
            <p>Create reminder schedules to automatically send RSVP reminders to your guests.</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              Create Your First Reminder
            </button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-info">
                <div className="schedule-trigger">
                  {schedule.triggerDays} days before RSVP deadline
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
                  onClick={() => handleExecuteSpecificReminder(schedule.id)}
                  disabled={!schedule.isActive}
                  title={schedule.isActive ? 'Send reminders now' : 'Schedule must be active to execute'}
                >
                  📤 Send Now
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
                <div className="form-help">Number of days before the RSVP deadline to send the reminder</div>
              </div>
              <div className="form-group">
                <label htmlFor="messageTemplate">Message Template</label>
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
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderManagement;