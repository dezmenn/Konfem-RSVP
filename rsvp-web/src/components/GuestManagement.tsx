import React, { useState, useEffect } from 'react';
import { Guest, ImportResult, Table } from '../types';
import GuestList from './GuestList';
import GuestForm from './GuestForm';
import { CSVImport } from './CSVImport';
import './GuestManagement.css';

interface GuestManagementProps {
  eventId: string;
}

const GuestManagement: React.FC<GuestManagementProps> = ({ eventId }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tables, setTables] = useState<Table[]>([]);
  const [showTableAssignment, setShowTableAssignment] = useState(false);
  const [guestToAssign, setGuestToAssign] = useState<Guest | null>(null);

  // Load tables when component mounts
  useEffect(() => {
    loadTables();
  }, [eventId]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const handleAddGuest = () => {
    setEditingGuest(null);
    setShowForm(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setShowForm(true);
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the guest list
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Failed to delete guest');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Error deleting guest');
    }
  };

  const handleSaveGuest = (guest: Guest) => {
    setShowForm(false);
    setEditingGuest(null);
    // Refresh the guest list
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGuest(null);
  };

  const handleImportCSV = () => {
    setShowCSVImport(true);
  };

  const handleImportComplete = (result: ImportResult) => {
    setShowCSVImport(false);
    
    if (result.success) {
      alert(`Successfully imported ${result.successfulImports} guests!`);
    } else {
      const message = `Import completed with ${result.successfulImports} successful and ${result.failedImports} failed imports.`;
      alert(message);
    }
    
    // Refresh the guest list
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelImport = () => {
    setShowCSVImport(false);
  };

  const handleViewTableLayout = (tableName: string) => {
    // This could trigger navigation to the venue layout view
    // For now, we'll show an alert with table information
    const table = tables.find(t => t.name === tableName);
    if (table) {
      const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
      alert(`Table: ${table.name}\nCapacity: ${table.capacity}\nAssigned Guests: ${assignedCount}\nAvailable Spots: ${table.capacity - assignedCount}`);
    } else {
      alert(`Table "${tableName}" not found`);
    }
  };

  const handleAssignGuestToTable = (guest: Guest) => {
    setGuestToAssign(guest);
    setShowTableAssignment(true);
  };

  const handleTableAssignmentComplete = async (tableId: string) => {
    if (!guestToAssign) return;

    try {
      const response = await fetch(`/api/guests/${guestToAssign.id}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });

      const result = await response.json();

      if (result.success) {
        setShowTableAssignment(false);
        setGuestToAssign(null);
        
        // Comprehensive data refresh to ensure consistency across all components
        await loadTables(); // Refresh table data first
        setRefreshKey(prev => prev + 1); // This will trigger GuestList to refresh both guests and tables
        
        const tableName = tables.find(t => t.id === tableId)?.name || 'selected table';
        alert(`${guestToAssign.name} has been assigned to ${tableName}.`);
      } else {
        alert('Failed to assign guest to table: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      alert('Error assigning guest to table');
    }
  };

  const handleCancelTableAssignment = () => {
    setShowTableAssignment(false);
    setGuestToAssign(null);
  };

  return (
    <div className="guest-management">
      <GuestList
        key={refreshKey}
        eventId={eventId}
        onAddGuest={handleAddGuest}
        onEditGuest={handleEditGuest}
        onDeleteGuest={handleDeleteGuest}
        onImportCSV={handleImportCSV}
        onViewTableLayout={handleViewTableLayout}
        onAssignGuestToTable={handleAssignGuestToTable}
      />

      {showForm && (
        <GuestForm
          eventId={eventId}
          guest={editingGuest}
          onSave={handleSaveGuest}
          onCancel={handleCancelForm}
        />
      )}

      {showCSVImport && (
        <CSVImport
          eventId={eventId}
          onImportComplete={handleImportComplete}
          onCancel={handleCancelImport}
        />
      )}

      {showTableAssignment && guestToAssign && (
        <div className="modal-overlay" onClick={handleCancelTableAssignment}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign {guestToAssign.name} to Table</h3>
              <button 
                className="modal-close" 
                onClick={handleCancelTableAssignment}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="guest-info">
                <p><strong>Guest:</strong> {guestToAssign.name}</p>
                <p><strong>Phone:</strong> {guestToAssign.phoneNumber}</p>
                <p><strong>Side:</strong> {guestToAssign.brideOrGroomSide}</p>
                <p><strong>Relationship:</strong> {guestToAssign.relationshipType}</p>
                {guestToAssign.tableAssignment && (
                  <p><strong>Current Table:</strong> {guestToAssign.tableAssignment}</p>
                )}
              </div>

              <div className="table-selection">
                <h4>Select a Table:</h4>
                <div className="table-grid">
                  {tables.map(table => {
                    const assignedCount = table.assignedGuests ? table.assignedGuests.length : 0;
                    const availableSpots = table.capacity - assignedCount;
                    const isOverCapacity = assignedCount > table.capacity;
                    const isCurrentTable = guestToAssign.tableAssignment === table.name;
                    
                    return (
                      <div
                        key={table.id}
                        className={`table-option ${isOverCapacity ? 'over-capacity' : ''} ${isCurrentTable ? 'current-table' : ''} ${table.isLocked ? 'locked' : ''}`}
                        onClick={() => !table.isLocked && handleTableAssignmentComplete(table.id)}
                        style={{
                          cursor: table.isLocked ? 'not-allowed' : 'pointer',
                          opacity: table.isLocked ? 0.6 : 1
                        }}
                      >
                        <div className="table-name">{table.name}</div>
                        <div className="table-capacity">
                          {assignedCount}/{table.capacity}
                          {isOverCapacity && ' ⚠️'}
                          {table.isLocked && ' 🔒'}
                        </div>
                        <div className="table-status">
                          {isCurrentTable ? 'Current Table' : 
                           table.isLocked ? 'Locked' :
                           availableSpots > 0 ? `${availableSpots} spots available` : 'Full'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {tables.length === 0 && (
                  <p className="no-tables">No tables available. Please create tables first.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCancelTableAssignment}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestManagement;