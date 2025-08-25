import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import './VenueLayoutManager.css';

interface VenueElementLibraryItem {
  type: VenueElement['type'];
  name: string;
  defaultDimensions: Dimensions;
  defaultColor: string;
  description: string;
  icon?: string;
}

interface VenueLayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface VenueLayoutManagerProps {
  eventId: string;
  onElementSelect?: (element: VenueElement | null) => void;
  onLayoutChange?: (elements: VenueElement[]) => void;
}

interface DragState {
  isDragging: boolean;
  draggedElement: VenueElement | null;
  dragOffset: Position;
  isResizing: boolean;
  resizeHandle: string | null;
}

const VenueLayoutManager: React.FC<VenueLayoutManagerProps> = ({
  eventId,
  onElementSelect,
  onLayoutChange
}) => {
  const [elements, setElements] = useState<VenueElement[]>([]);
  const [library, setLibrary] = useState<VenueElementLibraryItem[]>([]);
  const [selectedElement, setSelectedElement] = useState<VenueElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeHandle: null
  });
  const [bounds, setBounds] = useState<VenueLayoutBounds>({
    minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600
  });
  const [showLibrary, setShowLibrary] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Load venue layout and library
  useEffect(() => {
    loadVenueLayout();
    loadElementLibrary();
  }, [eventId]);

  const loadVenueLayout = async () => {
    try {
      const response = await fetch(`/api/venue-layout/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setElements(data.elements);
        setBounds(data.bounds);
        onLayoutChange?.(data.elements);
      }
    } catch (error) {
      console.error('Error loading venue layout:', error);
    }
  };

  const loadElementLibrary = async () => {
    try {
      const response = await fetch('/api/venue-layout/library');
      if (response.ok) {
        const data = await response.json();
        setLibrary(data);
      }
    } catch (error) {
      console.error('Error loading element library:', error);
    }
  };

  const validateLayout = async () => {
    try {
      const response = await fetch(`/api/venue-layout/events/${eventId}/validate`);
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      }
    } catch (error) {
      console.error('Error validating layout:', error);
    }
  };

  const createElementFromLibrary = async (libraryItem: VenueElementLibraryItem, position: Position) => {
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
        const newElement = await response.json();
        setElements(prev => [...prev, newElement]);
        onLayoutChange?.([...elements, newElement]);
        return newElement;
      }
    } catch (error) {
      console.error('Error creating element:', error);
    }
  };

  const updateElement = async (elementId: string, updates: Partial<VenueElement>) => {
    try {
      const response = await fetch(`/api/venue-layout/elements/${elementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedElement = await response.json();
        setElements(prev => prev.map(el => el.id === elementId ? updatedElement : el));
        onLayoutChange?.(elements.map(el => el.id === elementId ? updatedElement : el));
        return updatedElement;
      }
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  const deleteElement = async (elementId: string) => {
    try {
      const response = await fetch(`/api/venue-layout/elements/${elementId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const newElements = elements.filter(el => el.id !== elementId);
        setElements(newElements);
        onLayoutChange?.(newElements);
        if (selectedElement?.id === elementId) {
          setSelectedElement(null);
          onElementSelect?.(null);
        }
      }
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const duplicateElement = async (elementId: string) => {
    try {
      const response = await fetch(`/api/venue-layout/elements/${elementId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 20, y: 20 } })
      });

      if (response.ok) {
        const duplicatedElement = await response.json();
        setElements(prev => [...prev, duplicatedElement]);
        onLayoutChange?.([...elements, duplicatedElement]);
      }
    } catch (error) {
      console.error('Error duplicating element:', error);
    }
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, element: VenueElement) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Check if clicking on resize handle
    const resizeHandle = getResizeHandle(mouseX, mouseY, element);
    
    if (resizeHandle) {
      setDragState({
        isDragging: false,
        draggedElement: element,
        dragOffset: { x: 0, y: 0 },
        isResizing: true,
        resizeHandle
      });
    } else {
      // Start dragging
      setDragState({
        isDragging: true,
        draggedElement: element,
        dragOffset: {
          x: mouseX - element.position.x,
          y: mouseY - element.position.y
        },
        isResizing: false,
        resizeHandle: null
      });
    }

    setSelectedElement(element);
    onElementSelect?.(element);
  }, [scale, onElementSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.draggedElement || (!dragState.isDragging && !dragState.isResizing)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    if (dragState.isResizing && dragState.resizeHandle) {
      // Handle resizing
      const element = dragState.draggedElement;
      let newDimensions = { ...element.dimensions };
      let newPosition = { ...element.position };

      switch (dragState.resizeHandle) {
        case 'se': // Southeast corner
          newDimensions.width = Math.max(20, mouseX - element.position.x);
          newDimensions.height = Math.max(20, mouseY - element.position.y);
          break;
        case 'sw': // Southwest corner
          const newWidth = Math.max(20, element.position.x + element.dimensions.width - mouseX);
          newPosition.x = element.position.x + element.dimensions.width - newWidth;
          newDimensions.width = newWidth;
          newDimensions.height = Math.max(20, mouseY - element.position.y);
          break;
        case 'ne': // Northeast corner
          newDimensions.width = Math.max(20, mouseX - element.position.x);
          const newHeight = Math.max(20, element.position.y + element.dimensions.height - mouseY);
          newPosition.y = element.position.y + element.dimensions.height - newHeight;
          newDimensions.height = newHeight;
          break;
        case 'nw': // Northwest corner
          const newW = Math.max(20, element.position.x + element.dimensions.width - mouseX);
          const newH = Math.max(20, element.position.y + element.dimensions.height - mouseY);
          newPosition.x = element.position.x + element.dimensions.width - newW;
          newPosition.y = element.position.y + element.dimensions.height - newH;
          newDimensions.width = newW;
          newDimensions.height = newH;
          break;
      }

      // Update element temporarily for visual feedback
      setElements(prev => prev.map(el => 
        el.id === element.id 
          ? { ...el, position: newPosition, dimensions: newDimensions }
          : el
      ));
    } else if (dragState.isDragging) {
      // Handle dragging
      const newPosition = {
        x: Math.max(0, mouseX - dragState.dragOffset.x),
        y: Math.max(0, mouseY - dragState.dragOffset.y)
      };

      // Update element temporarily for visual feedback
      setElements(prev => prev.map(el => 
        el.id === dragState.draggedElement!.id 
          ? { ...el, position: newPosition }
          : el
      ));
    }
  }, [dragState, scale]);

  const handleMouseUp = useCallback(async () => {
    if (!dragState.draggedElement || (!dragState.isDragging && !dragState.isResizing)) return;

    const element = elements.find(el => el.id === dragState.draggedElement!.id);
    if (!element) return;

    // Update element on server
    if (dragState.isDragging) {
      await updateElement(element.id, { position: element.position });
    } else if (dragState.isResizing) {
      await updateElement(element.id, { 
        position: element.position, 
        dimensions: element.dimensions 
      });
    }

    setDragState({
      isDragging: false,
      draggedElement: null,
      dragOffset: { x: 0, y: 0 },
      isResizing: false,
      resizeHandle: null
    });
  }, [dragState, elements, updateElement]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
      onElementSelect?.(null);
    }
  }, [onElementSelect]);

  const handleLibraryItemDrop = useCallback(async (e: React.DragEvent, libraryItem: VenueElementLibraryItem) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };

    await createElementFromLibrary(libraryItem, position);
  }, [scale, createElementFromLibrary]);

  const getResizeHandle = (mouseX: number, mouseY: number, element: VenueElement): string | null => {
    const handleSize = 8;
    const { position, dimensions } = element;
    
    // Check corners
    if (Math.abs(mouseX - (position.x + dimensions.width)) < handleSize && 
        Math.abs(mouseY - (position.y + dimensions.height)) < handleSize) {
      return 'se';
    }
    if (Math.abs(mouseX - position.x) < handleSize && 
        Math.abs(mouseY - (position.y + dimensions.height)) < handleSize) {
      return 'sw';
    }
    if (Math.abs(mouseX - (position.x + dimensions.width)) < handleSize && 
        Math.abs(mouseY - position.y) < handleSize) {
      return 'ne';
    }
    if (Math.abs(mouseX - position.x) < handleSize && 
        Math.abs(mouseY - position.y) < handleSize) {
      return 'nw';
    }
    
    return null;
  };

  return (
    <div className="venue-layout-manager">
      <div className="venue-toolbar">
        <button onClick={() => setShowLibrary(!showLibrary)}>
          {showLibrary ? 'Hide' : 'Show'} Element Library
        </button>
        <button onClick={validateLayout}>Validate Layout</button>
        <button onClick={loadVenueLayout}>Refresh</button>
        <div className="zoom-controls">
          <button onClick={() => setScale(Math.max(0.25, scale - 0.25))}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2, scale + 0.25))}>+</button>
        </div>
      </div>

      <div className="venue-content">
        {showLibrary && (
          <div className="element-library">
            <h3>Element Library</h3>
            {library.map(item => (
              <div
                key={item.type}
                className="library-item"
                draggable
                onDragEnd={(e) => handleLibraryItemDrop(e, item)}
              >
                <span className="library-icon">{item.icon}</span>
                <div>
                  <div className="library-name">{item.name}</div>
                  <div className="library-description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="venue-canvas-container">
          <div
            ref={canvasRef}
            className="venue-canvas"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: Math.max(800, bounds.width + 100),
              height: Math.max(600, bounds.height + 100)
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {elements.map(element => (
              <div
                key={element.id}
                className={`venue-element ${selectedElement?.id === element.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: element.position.x,
                  top: element.position.y,
                  width: element.dimensions.width,
                  height: element.dimensions.height,
                  backgroundColor: element.color,
                  cursor: dragState.isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleMouseDown(e, element)}
              >
                <div className="element-label">{element.name}</div>
                
                {selectedElement?.id === element.id && (
                  <>
                    <div className="resize-handle nw" />
                    <div className="resize-handle ne" />
                    <div className="resize-handle sw" />
                    <div className="resize-handle se" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedElement && (
          <div className="element-properties">
            <h3>Element Properties</h3>
            <div className="property-group">
              <label>Name:</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => {
                  const updated = { ...selectedElement, name: e.target.value };
                  setSelectedElement(updated);
                  updateElement(selectedElement.id, { name: e.target.value });
                }}
              />
            </div>
            <div className="property-group">
              <label>Color:</label>
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => {
                  const updated = { ...selectedElement, color: e.target.value };
                  setSelectedElement(updated);
                  updateElement(selectedElement.id, { color: e.target.value });
                }}
              />
            </div>
            <div className="property-actions">
              <button onClick={() => duplicateElement(selectedElement.id)}>
                Duplicate
              </button>
              <button 
                onClick={() => deleteElement(selectedElement.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {validation && (
        <div className="validation-results">
          <div className="validation-header">
            <h3>Layout Validation</h3>
            <button 
              className="close-button"
              onClick={() => setValidation(null)}
              aria-label="Close validation results"
            >
              ×
            </button>
          </div>
          <div className={`validation-status ${validation.isValid ? 'valid' : 'invalid'}`}>
            {validation.isValid ? '✓ Layout is valid' : '⚠ Layout has issues'}
          </div>
          {validation.errors.length > 0 && (
            <div className="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validation.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validation.warnings.map((warning: string, index: number) => (
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

export default VenueLayoutManager;