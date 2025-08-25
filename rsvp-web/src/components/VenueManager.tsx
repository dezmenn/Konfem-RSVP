import React, { useState, useEffect } from 'react';
import IntegratedVenueManager from './IntegratedVenueManager';
import AutoTableArrangement from './AutoTableArrangement';
import { Table, VenueLayout } from '../../../shared/src/types';
import SyncService from '../services/SyncService';
import './VenueManager.css';

interface VenueManagerProps {
  eventId: string;
}

const VenueManager: React.FC<VenueManagerProps> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState<'venue' | 'arrangement'>('venue');
  const [tables, setTables] = useState<Table[]>([]);
  const [syncService, setSyncService] = useState<SyncService | null>(null);

  useEffect(() => {
    const service = new SyncService(eventId);
    setSyncService(service);

    service.onLayoutUpdate((layout: VenueLayout) => {
      setTables(layout.tables);
    });

    return () => {
      service.disconnect();
    };
  }, [eventId]);

  const handleLayoutChange = (layout: VenueLayout) => {
    syncService?.sendLayoutUpdate(layout);
  };

  const handleTablesChange = (updatedTables: Table[]) => {
    setTables(updatedTables);
  };

  // Load tables data when switching to arrangement tab
  const loadTables = async () => {
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

  // Load tables when arrangement tab becomes active
  useEffect(() => {
    if (activeTab === 'arrangement') {
      loadTables();
    }
  }, [activeTab, eventId]);

  return (
    <div className="venue-manager">
      <div className="venue-manager-header">
        <h2>Venue Management</h2>
        <div className="venue-tabs">
          <button
            className={`tab-button ${activeTab === 'venue' ? 'active' : ''}`}
            onClick={() => setActiveTab('venue')}
          >
            Venue Layout & Tables
          </button>
          <button
            className={`tab-button ${activeTab === 'arrangement' ? 'active' : ''}`}
            onClick={() => setActiveTab('arrangement')}
          >
            Auto Arrangement
          </button>
        </div>
      </div>

      <div className="venue-manager-content">
        {activeTab === 'venue' && (
          <IntegratedVenueManager eventId={eventId} onLayoutChange={handleLayoutChange} />
        )}
        
        {activeTab === 'arrangement' && (
          <AutoTableArrangement
            eventId={eventId}
            tables={tables}
            onTablesChange={handleTablesChange}
          />
        )}
      </div>
    </div>
  );
};

export default VenueManager;