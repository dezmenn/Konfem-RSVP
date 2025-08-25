import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Position, Guest } from '../../../shared/src/types';
import './TableManagement.css';

interface TableManagementProps {
  eventId: string;
  onTableSelect?: (table: Table | null) => void;
  onTableChange?: (tables: Table[]) => void;
}

interface DragState {
  isDragging: boolean;
  draggedTable: Table | null;
  dragOffset: Position;
  isCreating: boolean;
}

interface TableValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: Array<{
    tableId: string;
    issue: string;
    severity: 'error' | 'warning';
  }>;
}

interface TableCapacityInfo {
  tableId: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  isOverCapacity: boolean;
}

const TableManagement: React.FC<TableManagementProps> = ({
  eventId,
  onTableSelect,
  onTableChange
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTable: null,
    dragOffset: { x: 0, y: 0 },
    isCreating: false
  });
  const [validation, setValidation] = useState<TableValidation | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<TableCapacityInfo[]>([]);
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Load tables on component mount
  useEffect(() => {
    loadTables();
    loadCapacityInfo();
  }, [eventId]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
        onTableChange?.(data);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadCapacityInfo = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}/capacity`);
      if (response.ok) {
        const data = await response.json();
        setCapacityInfo(data);
      }
    } catch (error) {
      console.error('Error loading capacity info:', error);
    }
  };

  const validateTables = async () => {
    try {
      const response = await fetch(`/api/tables/events/${eventId}/validate`);
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
        setShowValidationPanel(true);
      }
    } catch (error) {
      console.error('Error validating tables:', error);
    }
  };

  const createTable = async (position: Position) => {
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: `Table ${tables.length + 1}`,
          capacity: 8,
          position
        })
      });

      if (response.ok) {
        const newTable = await response.json();
        const updatedTables = [...tables, newTable];
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        await loadCapacityInfo();
        return newTable;
      }
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === tableId) {
          setSelectedTable(updatedTable);
        }
        
        await loadCapacityInfo();
        return updatedTable;
      }
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedTables = tables.filter(t => t.id !== tableId);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === tableId) {
          setSelectedTable(null);
          onTableSelect?.(null);
        }
        
        await loadCapacityInfo();
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table. It may have assigned guests.');
    }
  };

  const lockTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/lock`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === tableId) {
          setSelectedTable(updatedTable);
        }
      }
    } catch (error) {
      console.error('Error locking table:', error);
    }
  };

  const unlockTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/unlock`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedTable = await response.json();
        const updatedTables = tables.map(t => t.id === tableId ? updatedTable : t);
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        
        if (selectedTable?.id === tableId) {
          setSelectedTable(updatedTable);
        }
      }
    } catch (error) {
      console.error('Error unlocking table:', error);
    }
  };

  const duplicateTable = async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 50, y: 50 } })
      });

      if (response.ok) {
        const duplicatedTable = await response.json();
        const updatedTables = [...tables, duplicatedTable];
        setTables(updatedTables);
        onTableChange?.(updatedTables);
        await loadCapacityInfo();
      }
    } catch (error) {
      console.error('Error duplicating table:', error);
    }
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setDragState({
      isDragging: true,
      draggedTable: table,
      dragOffset: {
        x: mouseX - table.position.x,
        y: mouseY - table.position.y
      },
      isCreating: false
    });

    setSelectedTable(table);
    onTableSelect?.(table);
  }, [scale, onTableSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedTable) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    const newPosition = {
      x: Math.max(0, mouseX - dragState.dragOffset.x),
      y: Math.max(0, mouseY - dragState.dragOffset.y)
    };

    // Update table position temporarily for visual feedback
    setTables(prev => prev.map(t => 
      t.id === dragState.draggedTable!.id 
        ? { ...t, position: newPosition }
        : t
    ));
  }, [dragState, scale]);

  const handleMouseUp = useCallback(async () => {
    if (!dragState.isDragging || !dragState.draggedTable) return;

    const table = tables.find(t => t.id === dragState.draggedTable!.id);
    if (table) {
      await updateTable(table.id, { position: table.position });
    }

    setDragState({
      isDragging: false,
      draggedTable: null,
      dragOffset: { x: 0, y: 0 },
      isCreating: false
    });
  }, [dragState, tables, updateTable]);

  const handleCanvasClick = useCallback(async (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const position = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      };

      // If double-click, create a new table
      if (e.detail === 2) {
        await createTable(position);
      } else {
        // Single click - deselect
        setSelectedTable(null);
        onTableSelect?.(null);
      }
    }
  }, [scale, createTable, onTableSelect]);

  const getTableCapacityInfo = (tableId: string) => {
    return capacityInfo.find(info => info.tableId === tableId);
  };

  return (
    <div className="table-management">
      <div className="table-toolbar">
        <button onClick={loadTables}>Refresh Tables</button>
        <button onClick={validateTables}>Validate Arrangement</button>
        <button onClick={() => setShowCapacityPanel(!showCapacityPanel)}>
          {showCapacityPanel ? 'Hide' : 'Show'} Capacity Info
        </button>
        <div className="zoom-controls">
          <button onClick={() => setScale(Math.max(0.25, scale - 0.25))}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2, scale + 0.25))}>+</button>
        </div>
        <div className="table-stats">
          <span>Tables: {tables.length}</span>
          <span>Locked: {tables.filter(t => t.isLocked).length}</span>
        </div>
      </div>

      <div className="table-content">
        {showCapacityPanel && (
          <div className="capacity-panel">
            <h3>Table Capacity</h3>
            <div className="capacity-list">
              {capacityInfo.map(info => (
                <div 
                  key={info.tableId} 
                  className={`capacity-item ${info.isOverCapacity ? 'over-capacity' : ''}`}
                >
                  <span className="table-name">{info.name}</span>
                  <span className="capacity-info">
                    {info.occupied}/{info.capacity}
                    {info.isOverCapacity && ' ⚠️'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-canvas-container">
          <div
            ref={canvasRef}
            className="table-canvas"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: 1000,
              height: 800
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="canvas-instructions">
              Double-click to create a new table
            </div>
            
            {tables.map(table => {
              const capacityInfo = getTableCapacityInfo(table.id);
              return (
                <div
                  key={table.id}
                  className={`table-element ${selectedTable?.id === table.id ? 'selected' : ''} ${table.isLocked ? 'locked' : ''} ${capacityInfo?.isOverCapacity ? 'over-capacity' : ''}`}
                  style={{
                    position: 'absolute',
                    left: table.position.x,
                    top: table.position.y,
                    width: 80,
                    height: 80,
                    cursor: dragState.isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                >
                  <div className="table-label">{table.name}</div>
                  <div className="table-capacity">
                    {capacityInfo ? `${capacityInfo.occupied}/${capacityInfo.capacity}` : `0/${table.capacity}`}
                  </div>
                  {table.isLocked && <div className="lock-indicator">🔒</div>}
                </div>
              );
            })}
          </div>
        </div>

        {selectedTable && (
          <div className="table-properties">
            <h3>Table Properties</h3>
            <div className="property-group">
              <label>Name:</label>
              <input
                type="text"
                value={selectedTable.name}
                onChange={(e) => {
                  const updated = { ...selectedTable, name: e.target.value };
                  setSelectedTable(updated);
                  updateTable(selectedTable.id, { name: e.target.value });
                }}
              />
            </div>
            <div className="property-group">
              <label>Capacity:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={selectedTable.capacity}
                onChange={(e) => {
                  const capacity = parseInt(e.target.value);
                  const updated = { ...selectedTable, capacity };
                  setSelectedTable(updated);
                  updateTable(selectedTable.id, { capacity });
                }}
              />
            </div>
            <div className="property-group">
              <label>Position:</label>
              <div className="position-inputs">
                <input
                  type="number"
                  placeholder="X"
                  value={Math.round(selectedTable.position.x)}
                  onChange={(e) => {
                    const x = parseInt(e.target.value) || 0;
                    const position = { ...selectedTable.position, x };
                    const updated = { ...selectedTable, position };
                    setSelectedTable(updated);
                    updateTable(selectedTable.id, { position });
                  }}
                />
                <input
                  type="number"
                  placeholder="Y"
                  value={Math.round(selectedTable.position.y)}
                  onChange={(e) => {
                    const y = parseInt(e.target.value) || 0;
                    const position = { ...selectedTable.position, y };
                    const updated = { ...selectedTable, position };
                    setSelectedTable(updated);
                    updateTable(selectedTable.id, { position });
                  }}
                />
              </div>
            </div>
            <div className="property-actions">
              <button 
                onClick={() => selectedTable.isLocked ? unlockTable(selectedTable.id) : lockTable(selectedTable.id)}
                className={selectedTable.isLocked ? 'unlock-button' : 'lock-button'}
              >
                {selectedTable.isLocked ? 'Unlock' : 'Lock'} Table
              </button>
              <button onClick={() => duplicateTable(selectedTable.id)}>
                Duplicate
              </button>
              <button 
                onClick={() => deleteTable(selectedTable.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {showValidationPanel && validation && (
        <div className="validation-panel">
          <div className="validation-header">
            <h3>Table Arrangement Validation</h3>
            <button onClick={() => setShowValidationPanel(false)}>×</button>
          </div>
          <div className={`validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
            {validation.isValid ? '✓ Arrangement is valid' : '⚠ Arrangement has issues'}
          </div>
          {validation.errors.length > 0 && (
            <div className="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableManagement;