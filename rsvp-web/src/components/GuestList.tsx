import React, { useState, useEffect, useCallback } from 'react';
import { Guest, RelationshipType } from '../types';
import './GuestList.css';

interface GuestListProps {
  eventId: string;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (guestId: string) => void;
  onAddGuest: () => void;
  onImportCSV?: () => void;
  onViewTableLayout?: (tableName: string) => void;
  onAssignGuestToTable?: (guest: Guest) => void;
}

interface GuestFilters {
  search: string;
  rsvpStatus: string[];
  relationshipType: string[];
  brideOrGroomSide: string;
}

const GuestList: React.FC<GuestListProps> = ({
  eventId,
  onEditGuest,
  onDeleteGuest,
  onAddGuest,
  onImportCSV,
  onViewTableLayout,
  onAssignGuestToTable
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<GuestFilters>({
    search: '',
    rsvpStatus: [],
    relationshipType: [],
    brideOrGroomSide: ''
  });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<'invitation' | 'reminder' | 'custom'>('custom');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    fetchGuests();
    fetchTables();
  }, [eventId, filters]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.multi-select-dropdown')) {
        document.querySelectorAll('.multi-select-options').forEach(dropdown => {
          dropdown.classList.remove('show');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.rsvpStatus.length > 0) {
        filters.rsvpStatus.forEach(status => queryParams.append('rsvpStatus', status));
      }
      if (filters.relationshipType.length > 0) {
        filters.relationshipType.forEach(type => queryParams.append('relationshipType', type));
      }
      if (filters.brideOrGroomSide) queryParams.append('brideOrGroomSide', filters.brideOrGroomSide);

      const url = queryParams.toString() 
        ? `/api/guests/${eventId}/search?${queryParams.toString()}`
        : `/api/guests/${eventId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setGuests(data.data);
      } else {
        setError('Failed to fetch guests');
      }
    } catch (err) {
      setError('Error fetching guests');
      console.error('Error fetching guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}`);
      if (response.ok) {
        const tableData = await response.json();
        setTables(tableData);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  // Helper function to get table assignment using the same logic as AutoTableArrangement
  const getGuestTableAssignment = (guest: Guest) => {
    // Use ONLY the table's assignedGuests array as the single source of truth
    const assignedTable = tables.find(table => 
      table.assignedGuests && table.assignedGuests.includes(guest.id)
    );
    
    return assignedTable ? {
      tableId: assignedTable.id,
      tableName: assignedTable.name
    } : null;
  };

  const handleFilterChange = (key: keyof GuestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectChange = (key: 'rsvpStatus' | 'relationshipType', value: string) => {
    setFilters(prev => {
      const currentValues = prev[key];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  const getMultiSelectDisplayText = (values: string[], allOptions: string[], defaultText: string) => {
    if (values.length === 0) return defaultText;
    if (values.length === 1) return values[0];
    if (values.length === allOptions.length) return 'All Selected';
    return `${values.length} Selected`;
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      rsvpStatus: [],
      relationshipType: [],
      brideOrGroomSide: ''
    });
  };

  const handleSendMessage = (guest: Guest) => {
    setSelectedGuest(guest);
    setMessageContent('');
    setMessageType('custom');
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!selectedGuest || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      let endpoint = '';
      let payload: any = {
        eventId: eventId
      };

      if (messageType === 'invitation') {
        endpoint = `/api/messaging/guests/${selectedGuest.id}/invitation`;
      } else if (messageType === 'reminder') {
        endpoint = `/api/messaging/guests/${selectedGuest.id}/reminder`;
        payload.content = messageContent;
      } else {
        // For custom messages, use the reminder endpoint
        endpoint = `/api/messaging/guests/${selectedGuest.id}/reminder`;
        payload.content = messageContent;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Message sent successfully to ${selectedGuest.name}!`);
        setShowMessageModal(false);
        setSelectedGuest(null);
        setMessageContent('');
      } else {
        alert(`Failed to send message: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getMessageTemplate = (type: string) => {
    switch (type) {
      case 'invitation':
        return 'You will receive an invitation message with event details.';
      case 'reminder':
        return `Hi ${selectedGuest?.name}, this is a friendly reminder about our upcoming event. Please confirm your attendance.`;
      default:
        return '';
    }
  };

  const handleViewTableLayout = (tableName: string) => {
    if (onViewTableLayout) {
      onViewTableLayout(tableName);
    }
  };

  const handleAssignToTable = (guest: Guest) => {
    if (onAssignGuestToTable) {
      onAssignGuestToTable(guest);
    }
  };

  const handleUnassignFromTable = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to unassign this guest from their table?')) {
      return;
    }

    try {
      const response = await fetch(`/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh both guest list and tables to show updated assignments
        await Promise.all([
          fetchGuests(),
          fetchTables()
        ]);
      } else {
        alert('Failed to unassign guest from table');
      }
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      alert('Error unassigning guest from table');
    }
  };

  const getRSVPStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      declined: 'badge-declined',
      no_response: 'badge-no-response'
    };
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-default'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading guests...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchGuests}>Retry</button>
      </div>
    );
  }

  return (
    <div className="guest-list-container">
      <div className="guest-list-header">
        <h2>Guest List ({guests.length})</h2>
        <div className="header-actions">
          {onImportCSV && (
            <button className="btn-secondary" onClick={onImportCSV}>
              Import CSV
            </button>
          )}
          <button className="btn-primary" onClick={onAddGuest}>
            Add Guest
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search guests..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
            aria-label="Search guests by name or phone number"
          />
          
          <div className="multi-select-container">
            <div className="multi-select-dropdown">
              <button 
                type="button" 
                className="multi-select-button"
                onClick={() => {
                  const dropdown = document.getElementById('rsvp-status-dropdown');
                  dropdown?.classList.toggle('show');
                }}
              >
                {getMultiSelectDisplayText(
                  filters.rsvpStatus, 
                  ['not_invited', 'pending', 'accepted', 'declined', 'no_response'], 
                  'All RSVP Status'
                )}
                <span className="dropdown-arrow">▼</span>
              </button>
              <div id="rsvp-status-dropdown" className="multi-select-options">
                {['not_invited', 'pending', 'accepted', 'declined', 'no_response'].map(status => (
                  <label key={status} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={filters.rsvpStatus.includes(status)}
                      onChange={() => handleMultiSelectChange('rsvpStatus', status)}
                    />
                    <span className="checkmark"></span>
                    {status.replace('_', ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="multi-select-container">
            <div className="multi-select-dropdown">
              <button 
                type="button" 
                className="multi-select-button"
                onClick={() => {
                  const dropdown = document.getElementById('relationship-dropdown');
                  dropdown?.classList.toggle('show');
                }}
              >
                {getMultiSelectDisplayText(
                  filters.relationshipType, 
                  Object.values(RelationshipType), 
                  'All Relationships'
                )}
                <span className="dropdown-arrow">▼</span>
              </button>
              <div id="relationship-dropdown" className="multi-select-options">
                {Object.values(RelationshipType).map(type => (
                  <label key={type} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={filters.relationshipType.includes(type)}
                      onChange={() => handleMultiSelectChange('relationshipType', type)}
                    />
                    <span className="checkmark"></span>
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <select
            value={filters.brideOrGroomSide}
            onChange={(e) => handleFilterChange('brideOrGroomSide', e.target.value)}
            className="filter-select"
            aria-label="Filter by Bride or Groom's side"
          >
            <option value="">All Sides</option>
            <option value="bride">Bride's Side</option>
            <option value="groom">Groom's Side</option>
          </select>

          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {guests.length === 0 ? (
        <div className="empty-state">
          <p>No guests found</p>
          <button className="btn-primary" onClick={onAddGuest}>
            Add Your First Guest
          </button>
        </div>
      ) : (
        <div className="guest-table-container">
          <table className="guest-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>RSVP Status</th>
                <th>Relationship</th>
                <th>Side</th>
                <th>Additional Guests</th>
                <th>Dietary Restrictions</th>
                <th>Table</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td className="guest-name">{guest.name}</td>
                  <td>{guest.phoneNumber}</td>
                  <td>{getRSVPStatusBadge(guest.rsvpStatus)}</td>
                  <td>{guest.relationshipType}</td>
                  <td className="side-badge">
                    <span className={`side-indicator ${guest.brideOrGroomSide}`}>
                      {guest.brideOrGroomSide === 'bride' ? 'B' : 'G'}
                    </span>
                    {guest.brideOrGroomSide}
                  </td>
                  <td className="text-center">{guest.additionalGuestCount}</td>
                  <td>
                    {guest.dietaryRestrictions.length > 0 ? (
                      <div className="dietary-restrictions">
                        {guest.dietaryRestrictions.map((restriction, index) => (
                          <span key={index} className="dietary-tag">
                            {restriction}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const tableAssignment = getGuestTableAssignment(guest);
                      return tableAssignment ? (
                        <div className="table-assignment-container">
                          <span className="table-assignment">{tableAssignment.tableName}</span>
                          <button
                            onClick={() => handleViewTableLayout(tableAssignment.tableName)}
                            className="btn-view-table"
                            title="View table in layout"
                          >
                            📍
                          </button>
                          <button
                            onClick={() => handleUnassignFromTable(guest.id)}
                            className="btn-unassign"
                            title="Remove from table"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="table-assignment-container">
                          <span className="text-muted">Unassigned</span>
                          <button
                            onClick={() => handleAssignToTable(guest)}
                            className="btn-assign"
                            title="Assign to table"
                          >
                            +
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEditGuest(guest)}
                        className="btn-edit"
                        aria-label={`Edit guest ${guest.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSendMessage(guest)}
                        className="btn-message"
                        aria-label={`Send WhatsApp message to ${guest.name}`}
                      >
                        Send Message
                      </button>
                      <button
                        onClick={() => onDeleteGuest(guest.id)}
                        className="btn-delete"
                        aria-label={`Delete guest ${guest.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedGuest && (
        <div
          className="modal-overlay"
          onClick={() => setShowMessageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="modal-title">Send Message to {selectedGuest.name}</h3>
              <button
                className="modal-close"
                onClick={() => setShowMessageModal(false)}
                aria-label="Close message dialog"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="guest-info">
                <p><strong>Phone:</strong> {selectedGuest.phoneNumber}</p>
                <p><strong>RSVP Status:</strong> {selectedGuest.rsvpStatus}</p>
              </div>

              <div className="message-type-selector">
                <label>Message Type:</label>
                <select 
                  value={messageType} 
                  onChange={(e) => setMessageType(e.target.value as 'invitation' | 'reminder' | 'custom')}
                  className="message-type-select"
                >
                  <option value="custom">Custom Message</option>
                  <option value="invitation">Invitation</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div className="message-content">
                <label>Message Content:</label>
                {messageType === 'invitation' ? (
                  <div className="template-message">
                    <p>{getMessageTemplate('invitation')}</p>
                    <small>This will send a pre-formatted invitation with event details.</small>
                  </div>
                ) : (
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={getMessageTemplate(messageType) || "Enter your message here..."}
                    rows={4}
                    className="message-textarea"
                  />
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowMessageModal(false)}
                disabled={sendingMessage}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={sendMessage}
                disabled={sendingMessage || (messageType !== 'invitation' && !messageContent.trim())}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;