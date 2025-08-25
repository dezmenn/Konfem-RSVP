import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VenueElement, Table, Position, Dimensions, Guest, VenueLayout } from '../../../shared/src/types';
import './IntegratedVenueManager.css';

interface ElementLibraryItem {
  type: VenueElement['type'];
  name: string;
  defaultDimensions: Dimensions;
  defaultColor: string;
  description: string;
  icon: string;
}

interface IntegratedVenueManagerProps {
  eventId: string;
  onLayoutChange?: (layout: VenueLayout) => void;
}

const ELEMENT_LIBRARY: ElementLibraryItem[] = [
  {
    type: 'stage',
    name: 'Stage',
    defaultDimensions: { width: 200, height: 100 },
    defaultColor: '#8B4513',
    description: 'Main stage or altar area',
    icon: '🎭'
  },
  {
    type: 'dance_floor',
    name: 'Dance Floor',
    defaultDimensions: { width: 150, height: 150 },
    defaultColor: '#FFD700',
    description: 'Dance floor area',
    icon: '💃'
  },
  {
    type: 'bar',
    name: 'Bar',
    defaultDimensions: { width: 120, height: 60 },
    defaultColor: '#654321',
    description: 'Bar or beverage station',
    icon: '🍸'
  },
  {
    type: 'entrance',
    name: 'Entrance',
    defaultDimensions: { width: 80, height: 40 },
    defaultColor: '#228B22',
    description: 'Main entrance or doorway',
    icon: '🚪'
  },
  {
    type: 'walkway',
    name: 'Walkway',
    defaultDimensions: { width: 200, height: 40 },
    defaultColor: '#D3D3D3',
    description: 'Walkway or aisle',
    icon: '🛤️'
  },
  {
    type: 'decoration',
    name: 'Decoration',
    defaultDimensions: { width: 60, height: 60 },
    defaultColor: '#FF69B4',
    description: 'Decorative element',
    icon: '🌸'
  }
];

const IntegratedVenueManager: React.FC<IntegratedVenueManagerProps> = ({ eventId, onLayoutChange }) => {
  const [mode, setMode] = useState<'layout' | 'tables'>('layout');
  const [venueElements, setVenueElements] = useState<VenueElement[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedElement, setSelectedElement] = useState<VenueElement | Table | null>(null);
  const [draggedElement, setDraggedElement] = useState<ElementLibraryItem | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [draggedLayoutElement, setDraggedLayoutElement] = useState<VenueElement | Table | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartDimensions, setResizeStartDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [resizeStartPosition, setResizeStartPosition] = useState<Position>({ x: 0, y: 0 });
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(100);
  const [capacityPanelWidth, setCapacityPanelWidth] = useState(300);
  const [isPanelResizing, setIsPanelResizing] = useState(false);
  const [panelResizeStartX, setPanelResizeStartX] = useState(0);
  const [panelResizeStartWidth, setPanelResizeStartWidth] = useState(300);
  const [showValidation, setShowValidation] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load venue data
  useEffect(() => {
    loadVenueData();
  }, [eventId]);

  const loadVenueData = async () => {
    try {
      // Load venue elements
      const elementsResponse = await fetch(`/api/venue-layout/events/${eventId}`);
      let elements: VenueElement[] = [];
      if (elementsResponse.ok) {
        const elementsData = await elementsResponse.json();
        elements = elementsData.elements || [];
        setVenueElements(elements);
      }

      // Load tables
      const tablesResponse = await fetch(`/api/tables/events/${eventId}`);
      let tables: Table[] = [];
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json();
        tables = tablesData || [];
        setTables(tables);
      }
      
      onLayoutChange?.({ elements, tables });

      // Load guests
      const guestsResponse = await fetch(`/api/guests/${eventId}`);
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json();
        setGuests(guestsData.data || []);
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    }
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current || isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: (event.clientX - rect.left) * (100 / zoom),
      y: (event.clientY - rect.top) * (100 / zoom)
    };

    if (draggedElement) {
      // Create new element from library
      createElementFromLibrary(draggedElement, position);
      setDraggedElement(null);
    } else if (mode === 'tables') {
      // Create new table
      createTable(position);
    } else {
      // Deselect element if clicking on empty canvas
      setSelectedElement(null);
    }
  }, [draggedElement, mode, zoom, isDragging]);

  const createElementFromLibrary = async (libraryItem: ElementLibraryItem, position: Position) => {
    try {
      const response = await fetch(`/api/venue-layout/events/${eventId}/elements/from-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: libraryItem.type,
          position,
          name: libraryItem.name
        })
      });

      if (response.ok) {
        const createdElement = await response.json();
        const newElements = [...venueElements, createdElement];
        setVenueElements(newElements);
        onLayoutChange?.({ elements: newElements, tables });
      }
    } catch (error) {
      console.error('Error creating venue element:', error);
    }
  };

  const createTable = async (position: Position) => {
    try {
      const newTable = {
        eventId,
        name: `Table ${tables.length + 1}`,
        capacity: 8,
        position
      };

      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      });

      if (response.ok) {
        const createdTable = await response.json();
        const newTables = [...tables, createdTable];
        setTables(newTables);
        onLayoutChange?.({ elements: venueElements, tables: newTables });
      }
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const handleElementUpdate = async (elementId: string, updates: any) => {
    try {
      const isTable = tables.some(t => t.id === elementId);
      const endpoint = isTable ? `/api/tables/${elementId}` : `/api/venue-layout/elements/${elementId}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedElement = await response.json();
        
        if (isTable) {
          const newTables = tables.map(t => t.id === elementId ? updatedElement : t);
          setTables(newTables);
          onLayoutChange?.({ elements: venueElements, tables: newTables });
        } else {
          const newElements = venueElements.map(e => e.id === elementId ? updatedElement : e);
          setVenueElements(newElements);
          onLayoutChange?.({ elements: newElements, tables });
        }
        
        setSelectedElement(updatedElement);
      }
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  const handleElementDelete = async (elementId: string) => {
    try {
      const isTable = tables.some(t => t.id === elementId);
      const endpoint = isTable ? `/api/tables/${elementId}` : `/api/venue-layout/elements/${elementId}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        if (isTable) {
          const newTables = tables.filter(t => t.id !== elementId);
          setTables(newTables);
          onLayoutChange?.({ elements: venueElements, tables: newTables });
        } else {
          const newElements = venueElements.filter(e => e.id !== elementId);
          setVenueElements(newElements);
          onLayoutChange?.({ elements: newElements, tables });
        }
        setSelectedElement(null);
      }
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const validateLayout = async () => {
    try {
      const response = await fetch(`/api/venue-layout/events/${eventId}/validate`);
      if (response.ok) {
        const results = await response.json();
        setValidationResults(results);
        setShowValidation(true);
      }
    } catch (error) {
      console.error('Error validating layout:', error);
    }
  };

  // Guest management functions
  const getGuestsForTable = (tableId: string): Guest[] => {
    return guests.filter(guest => guest.tableAssignment === tableId);
  };

  const toggleTableExpansion = (tableId: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  const assignGuestToTable = async (guestId: string, tableId: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/assign-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      });

      if (response.ok) {
        // Update local state
        setGuests(prev => prev.map(guest => 
          guest.id === guestId ? { ...guest, tableAssignment: tableId } : guest
        ));
        
        // Refresh tables to update assignedGuests arrays
        await loadVenueData();
      } else {
        const error = await response.json();
        alert(`Failed to assign guest: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      alert('Failed to assign guest to table');
    }
  };

  const unassignGuestFromTable = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/unassign-table`, {
        method: 'POST'
      });

      if (response.ok) {
        // Update local state
        setGuests(prev => prev.map(guest => 
          guest.id === guestId ? { ...guest, tableAssignment: undefined } : guest
        ));
        
        // Refresh tables to update assignedGuests arrays
        await loadVenueData();
      } else {
        const error = await response.json();
        alert(`Failed to unassign guest: ${error.error}`);
      }
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      alert('Failed to unassign guest from table');
    }
  };

  // Resize handlers for venue elements
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, element: VenueElement, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    setIsResizing(true);
    setResizeHandle(handle);
    setDraggedLayoutElement(element);
    setResizeStartDimensions({ ...element.dimensions });
    setResizeStartPosition({ ...element.position });
    setSelectedElement(element);
  }, []);

  // Drag and drop handlers for layout elements (tables and venue elements)
  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: VenueElement | Table) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (100 / zoom);
    const mouseY = (e.clientY - rect.top) * (100 / zoom);

    setDraggedLayoutElement(element);
    setDragOffset({
      x: mouseX - element.position.x,
      y: mouseY - element.position.y
    });
    setIsDragging(true);
    setSelectedElement(element);
  }, [zoom]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !draggedLayoutElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (100 / zoom);
    const mouseY = (e.clientY - rect.top) * (100 / zoom);

    if (isResizing && resizeHandle && 'dimensions' in draggedLayoutElement) {
      // Handle resizing
      const element = draggedLayoutElement as VenueElement;
      let newDimensions = { ...resizeStartDimensions };
      let newPosition = { ...resizeStartPosition };

      switch (resizeHandle) {
        case 'se': // Southeast corner
          newDimensions.width = Math.max(40, mouseX - resizeStartPosition.x);
          newDimensions.height = Math.max(30, mouseY - resizeStartPosition.y);
          break;
        case 'sw': // Southwest corner
          newDimensions.width = Math.max(40, resizeStartPosition.x + resizeStartDimensions.width - mouseX);
          newDimensions.height = Math.max(30, mouseY - resizeStartPosition.y);
          newPosition.x = resizeStartPosition.x + resizeStartDimensions.width - newDimensions.width;
          break;
        case 'ne': // Northeast corner
          newDimensions.width = Math.max(40, mouseX - resizeStartPosition.x);
          newDimensions.height = Math.max(30, resizeStartPosition.y + resizeStartDimensions.height - mouseY);
          newPosition.y = resizeStartPosition.y + resizeStartDimensions.height - newDimensions.height;
          break;
        case 'nw': // Northwest corner
          newDimensions.width = Math.max(40, resizeStartPosition.x + resizeStartDimensions.width - mouseX);
          newDimensions.height = Math.max(30, resizeStartPosition.y + resizeStartDimensions.height - mouseY);
          newPosition.x = resizeStartPosition.x + resizeStartDimensions.width - newDimensions.width;
          newPosition.y = resizeStartPosition.y + resizeStartDimensions.height - newDimensions.height;
          break;
      }

      // Update element temporarily for visual feedback
      setVenueElements(prev => prev.map(e => 
        e.id === element.id 
          ? { ...e, dimensions: newDimensions, position: newPosition }
          : e
      ));
    } else if (isDragging) {
      // Handle dragging
      const newPosition = {
        x: Math.max(0, mouseX - dragOffset.x),
        y: Math.max(0, mouseY - dragOffset.y)
      };

      // Update element position temporarily for visual feedback
      const isTable = 'capacity' in draggedLayoutElement;
      if (isTable) {
        setTables(prev => prev.map(t => 
          t.id === draggedLayoutElement.id 
            ? { ...t, position: newPosition }
            : t
        ));
      } else {
        setVenueElements(prev => prev.map(e => 
          e.id === draggedLayoutElement.id 
            ? { ...e, position: newPosition }
            : e
        ));
      }
    }
  }, [isDragging, isResizing, draggedLayoutElement, dragOffset, resizeHandle, resizeStartDimensions, resizeStartPosition, zoom]);

  const handleCanvasMouseUp = useCallback(async () => {
    if ((!isDragging && !isResizing) || !draggedLayoutElement) return;

    // Save the final changes to the server
    const element = 'capacity' in draggedLayoutElement 
      ? tables.find(t => t.id === draggedLayoutElement.id)
      : venueElements.find(e => e.id === draggedLayoutElement.id);

    if (element) {
      if (isResizing && 'dimensions' in element) {
        // Save both position and dimensions for resized elements
        await handleElementUpdate(element.id, { 
          position: element.position,
          dimensions: element.dimensions 
        });
      } else {
        // Save only position for dragged elements
        await handleElementUpdate(element.id, { position: element.position });
      }
    }

    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDraggedLayoutElement(null);
    setDragOffset({ x: 0, y: 0 });
    setResizeStartDimensions({ width: 0, height: 0 });
    setResizeStartPosition({ x: 0, y: 0 });
  }, [isDragging, isResizing, draggedLayoutElement, tables, venueElements, handleElementUpdate]);

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        handleCanvasMouseUp();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, handleCanvasMouseUp]);

  // Panel resize handlers
  const handlePanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanelResizing(true);
    setPanelResizeStartX(e.clientX);
    setPanelResizeStartWidth(capacityPanelWidth);
  }, [capacityPanelWidth]);

  const handlePanelResizeMove = useCallback((e: MouseEvent) => {
    if (!isPanelResizing) return;
    
    const deltaX = e.clientX - panelResizeStartX;
    const newWidth = Math.max(250, Math.min(500, panelResizeStartWidth + deltaX));
    setCapacityPanelWidth(newWidth);
  }, [isPanelResizing, panelResizeStartX, panelResizeStartWidth]);

  const handlePanelResizeEnd = useCallback(() => {
    setIsPanelResizing(false);
    setPanelResizeStartX(0);
    setPanelResizeStartWidth(300);
  }, []);

  // Add global mouse event listeners for panel resizing
  useEffect(() => {
    if (isPanelResizing) {
      document.addEventListener('mousemove', handlePanelResizeMove);
      document.addEventListener('mouseup', handlePanelResizeEnd);
      document.addEventListener('mouseleave', handlePanelResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handlePanelResizeMove);
      document.removeEventListener('mouseup', handlePanelResizeEnd);
      document.removeEventListener('mouseleave', handlePanelResizeEnd);
    };
  }, [isPanelResizing, handlePanelResizeMove, handlePanelResizeEnd]);

  // Drag and drop handlers for guests
  const handleGuestDragStart = (e: React.DragEvent, guest: Guest) => {
    e.dataTransfer.setData('application/json', JSON.stringify(guest));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGuest(guest);
  };

  const handleGuestDragEnd = () => {
    setDraggedGuest(null);
  };

  const handleTableDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTableDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const guestData = JSON.parse(e.dataTransfer.getData('application/json'));
      const guest = guestData as Guest;
      
      // Check if guest is already at this table
      if (guest.tableAssignment === tableId) {
        return;
      }

      // Check table capacity
      const table = tables.find(t => t.id === tableId);
      if (!table) return;
      
      const currentGuests = getGuestsForTable(tableId);
      if (currentGuests.length >= table.capacity && guest.tableAssignment !== tableId) {
        alert(`Table "${table.name}" is at full capacity (${table.capacity}/${table.capacity})`);
        return;
      }

      // Assign guest to new table
      await assignGuestToTable(guest.id, tableId);
    } catch (error) {
      console.error('Error handling table drop:', error);
      alert('Failed to assign guest to table');
    }
  };

  const renderVenueElement = (element: VenueElement) => (
    <div
      key={element.id}
      className={`venue-element ${selectedElement?.id === element.id ? 'selected' : ''} ${
        isDragging && draggedLayoutElement?.id === element.id ? 'dragging' : ''
      } ${isResizing && draggedLayoutElement?.id === element.id ? 'resizing' : ''}`}
      style={{
        position: 'absolute',
        left: element.position.x * (zoom / 100),
        top: element.position.y * (zoom / 100),
        width: element.dimensions.width * (zoom / 100),
        height: element.dimensions.height * (zoom / 100),
        backgroundColor: element.color,
        cursor: isResizing && draggedLayoutElement?.id === element.id ? 'nw-resize' : 
               isDragging && draggedLayoutElement?.id === element.id ? 'grabbing' : 'grab'
      }}
      onMouseDown={(e) => handleElementMouseDown(e, element)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging && !isResizing) {
          setSelectedElement(element);
        }
      }}
    >
      <div className="element-label">{element.name}</div>
      
      {/* Resize handles - only show when element is selected */}
      {selectedElement?.id === element.id && !isDragging && (
        <>
          <div 
            className="resize-handle nw" 
            onMouseDown={(e) => handleResizeMouseDown(e, element, 'nw')}
          />
          <div 
            className="resize-handle ne" 
            onMouseDown={(e) => handleResizeMouseDown(e, element, 'ne')}
          />
          <div 
            className="resize-handle sw" 
            onMouseDown={(e) => handleResizeMouseDown(e, element, 'sw')}
          />
          <div 
            className="resize-handle se" 
            onMouseDown={(e) => handleResizeMouseDown(e, element, 'se')}
          />
        </>
      )}
    </div>
  );

  const renderTable = (table: Table) => {
    const actualGuestCount = getGuestsForTable(table.id).length;
    const isOverCapacity = actualGuestCount > table.capacity;
    const isDragTarget = draggedGuest && draggedGuest.tableAssignment !== table.id;
    
    return (
      <div
        key={table.id}
        className={`table-element ${selectedElement?.id === table.id ? 'selected' : ''} ${
          table.isLocked ? 'locked' : ''
        } ${isOverCapacity ? 'over-capacity' : ''} ${isDragTarget ? 'drag-target' : ''} ${
          isDragging && draggedLayoutElement?.id === table.id ? 'dragging' : ''
        }`}
        style={{
          position: 'absolute',
          left: table.position.x * (zoom / 100),
          top: table.position.y * (zoom / 100),
          width: 80 * (zoom / 100),
          height: 80 * (zoom / 100),
          cursor: isDragging && draggedLayoutElement?.id === table.id ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => handleElementMouseDown(e, table)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            setSelectedElement(table);
          }
        }}
        onDragOver={handleTableDragOver}
        onDrop={(e) => handleTableDrop(e, table.id)}
      >
        <div className="table-label">{table.name}</div>
        <div className="table-capacity">
          {actualGuestCount}/{table.capacity}
        </div>
        {table.isLocked && <div className="lock-indicator">🔒</div>}
        {isDragTarget && (
          <div className="drop-indicator">
            Drop here
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="integrated-venue-manager">
      {/* Toolbar */}
      <div className="venue-toolbar">
        <div className="mode-selector">
          <button
            className={mode === 'layout' ? 'active' : ''}
            onClick={() => setMode('layout')}
          >
            Layout Design
          </button>
          <button
            className={mode === 'tables' ? 'active' : ''}
            onClick={() => setMode('tables')}
          >
            Table Management
          </button>
        </div>

        <div className="toolbar-actions">
          <button onClick={validateLayout}>Validate Layout</button>
          <button onClick={loadVenueData}>Refresh</button>
        </div>

        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(50, zoom - 25))}>-</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
        </div>

        <div className="layout-stats">
          <span>Elements: {venueElements.length}</span>
          <span>Tables: {tables.length}</span>
          <span>Total Capacity: {tables.reduce((sum, t) => sum + t.capacity, 0)}</span>
        </div>
      </div>

      <div className="venue-content">
        {/* Element Library (Layout Mode) */}
        {mode === 'layout' && (
          <div className="element-library">
            <h3>Element Library</h3>
            {ELEMENT_LIBRARY.map((item) => (
              <div
                key={item.type}
                className="library-item"
                draggable
                onDragStart={() => setDraggedElement(item)}
                onClick={() => setDraggedElement(item)}
              >
                <div className="library-icon">{item.icon}</div>
                <div>
                  <div className="library-name">{item.name}</div>
                  <div className="library-description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Capacity Panel (Table Mode) */}
        {mode === 'tables' && (
          <div 
            className={`capacity-panel ${isPanelResizing ? 'resizing' : ''}`}
            style={{ width: `${capacityPanelWidth}px` }}
          >
            <h3>Table Capacity</h3>
            <div 
              className="capacity-panel-resize-handle"
              onMouseDown={handlePanelResizeStart}
              title="Drag to resize panel"
            />
            <div className="capacity-list">
              {tables.map((table) => {
                const actualGuestCount = getGuestsForTable(table.id).length;
                const tableGuests = getGuestsForTable(table.id);
                const isExpanded = expandedTables.has(table.id);
                
                return (
                  <div
                    key={table.id}
                    className={`capacity-item ${
                      actualGuestCount > table.capacity ? 'over-capacity' : ''
                    } ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div 
                      className="capacity-header"
                      onClick={() => setSelectedElement(table)}
                    >
                      <div className="table-info">
                        <div className="table-name">{table.name}</div>
                        <div className="capacity-info">
                          {actualGuestCount}/{table.capacity}
                        </div>
                      </div>
                      {actualGuestCount > 0 && (
                        <button
                          className="expand-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTableExpansion(table.id);
                          }}
                          title={isExpanded ? 'Collapse guest list' : 'Expand guest list'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </div>
                    
                    {isExpanded && actualGuestCount > 0 && (
                      <div className="capacity-guest-list">
                        {tableGuests.map((guest) => (
                          <div
                            key={guest.id}
                            className="capacity-guest-item"
                            draggable
                            onDragStart={(e) => handleGuestDragStart(e, guest)}
                            onDragEnd={handleGuestDragEnd}
                          >
                            <div className="guest-info">
                              <div className="guest-name">{guest.name}</div>
                              <div className="guest-details">
                                <span className="guest-side">{guest.brideOrGroomSide}</span>
                                <span className="guest-relationship">{guest.relationshipType}</span>
                              </div>
                            </div>
                            <button
                              className="unassign-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                unassignGuestFromTable(guest.id);
                              }}
                              title="Remove from table"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <div className="guest-list-hint">
                          💡 Drag guests to tables to reassign
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="venue-canvas-container">
          <div
            ref={canvasRef}
            className="venue-canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
          >
            <div className="canvas-instructions">
              {draggedElement
                ? `Click to place ${draggedElement.name}`
                : mode === 'tables'
                ? 'Click to add table • Drag tables to reposition'
                : 'Drag elements from library • Drag elements to reposition • Click to select'}
            </div>

            {/* Render venue elements */}
            {venueElements.map(renderVenueElement)}

            {/* Render tables */}
            {tables.map(renderTable)}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="item-properties">
            <h3>Properties</h3>
            
            <div className="property-group">
              <label>Name</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) =>
                  handleElementUpdate(selectedElement.id, { name: e.target.value })
                }
              />
            </div>

            {'capacity' in selectedElement && (
              <div className="property-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={selectedElement.capacity}
                  onChange={(e) =>
                    handleElementUpdate(selectedElement.id, {
                      capacity: parseInt(e.target.value)
                    })
                  }
                />
              </div>
            )}

            <div className="property-group">
              <label>X Position</label>
              <input
                type="number"
                value={selectedElement.position.x}
                onChange={(e) =>
                  handleElementUpdate(selectedElement.id, {
                    position: {
                      ...selectedElement.position,
                      x: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>

            <div className="property-group">
              <label>Y Position</label>
              <input
                type="number"
                value={selectedElement.position.y}
                onChange={(e) =>
                  handleElementUpdate(selectedElement.id, {
                    position: {
                      ...selectedElement.position,
                      y: parseInt(e.target.value)
                    }
                  })
                }
              />
            </div>



            <div className="property-actions">
              {'isLocked' in selectedElement && (
                <button
                  className={selectedElement.isLocked ? 'unlock-button' : 'lock-button'}
                  onClick={() =>
                    handleElementUpdate(selectedElement.id, {
                      isLocked: !selectedElement.isLocked
                    })
                  }
                >
                  {selectedElement.isLocked ? 'Unlock Table' : 'Lock Table'}
                </button>
              )}
              
              <button
                className="delete-button"
                onClick={() => handleElementDelete(selectedElement.id)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Results Modal */}
      {showValidation && validationResults && (
        <div className="validation-results">
          <h3>Layout Validation Results</h3>
          <div className={`validation-status ${validationResults.isValid ? 'valid' : 'invalid'}`}>
            {validationResults.isValid ? '✅ Layout is valid' : '❌ Layout has issues'}
          </div>
          
          {validationResults.errors?.length > 0 && (
            <div className="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validationResults.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.warnings?.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validationResults.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button onClick={() => setShowValidation(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default IntegratedVenueManager;