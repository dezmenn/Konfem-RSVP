import React, { useState, useRef } from 'react';
import { InvitationTemplate, TextElement, ImageElement } from '../../../shared/src/types';
import './InvitationTemplateEditor.css';

interface InvitationTemplateEditorProps {
  eventId: string;
  template?: InvitationTemplate;
  onSave: (template: Partial<InvitationTemplate>) => void;
  onCancel: () => void;
}

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Montserrat, sans-serif',
  'Playfair Display, serif',
  'Lato, sans-serif',
  'Open Sans, sans-serif'
];

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '300', label: 'Light' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
];

const TEXT_ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

export const InvitationTemplateEditor: React.FC<InvitationTemplateEditorProps> = ({
  eventId,
  template,
  onSave,
  onCancel
}) => {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [backgroundColor, setBackgroundColor] = useState(template?.backgroundColor || '#ffffff');
  const [backgroundImage, setBackgroundImage] = useState(template?.backgroundImage || '');
  const [backgroundImageOpacity, setBackgroundImageOpacity] = useState(template?.backgroundImageOpacity || 1);
  const [width, setWidth] = useState(template?.width || 600);
  const [height, setHeight] = useState(template?.height || 800);
  const [textElements, setTextElements] = useState<TextElement[]>(template?.textElements || []);
  const [imageElements, setImageElements] = useState<ImageElement[]>(template?.imageElements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartData, setResizeStartData] = useState<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);


  const canvasRef = useRef<HTMLDivElement>(null);

  // Sample data for preview
  const previewData = {
    guestName: 'John & Jane Smith',
    eventTitle: 'Wedding Celebration',
    eventDate: 'Saturday, June 15th, 2024',
    eventTime: '4:00 PM',
    eventLocation: 'Grand Ballroom, Elegant Hotel',
    rsvpDeadline: 'May 1st, 2024'
  };

  const personalizeContent = (content: string): string => {
    return content
      .replace(/\{\{guestName\}\}/g, previewData.guestName)
      .replace(/\{\{eventTitle\}\}/g, previewData.eventTitle)
      .replace(/\{\{eventDate\}\}/g, previewData.eventDate)
      .replace(/\{\{eventTime\}\}/g, previewData.eventTime)
      .replace(/\{\{eventLocation\}\}/g, previewData.eventLocation)
      .replace(/\{\{rsvpDeadline\}\}/g, previewData.rsvpDeadline);
  };

  const addTextElement = (type: TextElement['type']) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: { x: 50, y: 50 },
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      width: 200,
      height: 30
    };
    setTextElements([...textElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const addImageElement = (type: ImageElement['type'] = 'decoration') => {
    const newElement: ImageElement = {
      id: `image-${Date.now()}`,
      type,
      src: 'https://via.placeholder.com/150x100?text=Image',
      position: { x: 50, y: 50 },
      width: 150,
      height: 100,
      opacity: 1,
      zIndex: type === 'background' ? -1 : 1
    };
    setImageElements([...imageElements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: TextElement['type']): string => {
    switch (type) {
      case 'title': return 'You\'re Invited!';
      case 'subtitle': return '{{eventTitle}}';
      case 'date': return '{{eventDate}} at {{eventTime}}';
      case 'location': return '{{eventLocation}}';
      case 'body': return 'Join us for this special celebration';
      case 'rsvp': return 'Please RSVP by {{rsvpDeadline}}';
      case 'custom': return 'Custom text';
      default: return 'Text';
    }
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const updateImageElement = (id: string, updates: Partial<ImageElement>) => {
    setImageElements(imageElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    setImageElements(imageElements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, elementType?: 'text' | 'image', handle?: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    
    if (handle) {
      // Start resizing
      setIsResizing(true);
      setResizeHandle(handle);
      const element = imageElements.find(el => el.id === elementId);
      if (element && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setResizeStartData({
          startX: e.clientX,
          startY: e.clientY,
          startWidth: element.width,
          startHeight: element.height,
          startPosX: element.position.x,
          startPosY: element.position.y
        });
      }
    } else {
      // Start dragging
      setDraggedElement(elementId);
      
      const textElement = textElements.find(el => el.id === elementId);
      const imageElement = imageElements.find(el => el.id === elementId);
      const element = textElement || imageElement;
      
      if (element) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left - element.position.x,
            y: e.clientY - rect.top - element.position.y
          });
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isResizing && selectedElement && resizeHandle && resizeStartData) {
      const element = imageElements.find(el => el.id === selectedElement);
      if (element) {
        const deltaX = e.clientX - resizeStartData.startX;
        const deltaY = e.clientY - resizeStartData.startY;
        
        let newWidth = resizeStartData.startWidth;
        let newHeight = resizeStartData.startHeight;
        let newX = resizeStartData.startPosX;
        let newY = resizeStartData.startPosY;

        switch (resizeHandle) {
          case 'se': // Southeast - bottom right
            newWidth = Math.max(20, resizeStartData.startWidth + deltaX);
            newHeight = Math.max(20, resizeStartData.startHeight + deltaY);
            break;
          case 'sw': // Southwest - bottom left
            newWidth = Math.max(20, resizeStartData.startWidth - deltaX);
            newHeight = Math.max(20, resizeStartData.startHeight + deltaY);
            newX = resizeStartData.startPosX + (resizeStartData.startWidth - newWidth);
            break;
          case 'ne': // Northeast - top right
            newWidth = Math.max(20, resizeStartData.startWidth + deltaX);
            newHeight = Math.max(20, resizeStartData.startHeight - deltaY);
            newY = resizeStartData.startPosY + (resizeStartData.startHeight - newHeight);
            break;
          case 'nw': // Northwest - top left
            newWidth = Math.max(20, resizeStartData.startWidth - deltaX);
            newHeight = Math.max(20, resizeStartData.startHeight - deltaY);
            newX = resizeStartData.startPosX + (resizeStartData.startWidth - newWidth);
            newY = resizeStartData.startPosY + (resizeStartData.startHeight - newHeight);
            break;
        }

        // Ensure the element stays within canvas bounds
        newX = Math.max(0, Math.min(newX, width - newWidth));
        newY = Math.max(0, Math.min(newY, height - newHeight));

        updateImageElement(selectedElement, {
          width: newWidth,
          height: newHeight,
          position: { x: newX, y: newY }
        });
      }
    } else if (draggedElement) {
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      
      const textElement = textElements.find(el => el.id === draggedElement);
      const imageElement = imageElements.find(el => el.id === draggedElement);
      
      if (textElement) {
        updateTextElement(draggedElement, {
          position: { x: Math.max(0, newX), y: Math.max(0, newY) }
        });
      } else if (imageElement) {
        updateImageElement(draggedElement, {
          position: { x: Math.max(0, newX), y: Math.max(0, newY) }
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartData(null);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const templateData: Partial<InvitationTemplate> = {
      name: templateName,
      backgroundColor,
      backgroundImage: backgroundImage || undefined,
      backgroundImageOpacity,
      width,
      height,
      textElements,
      imageElements,
      eventId
    };

    onSave(templateData);
  };

  const selectedTextElement = textElements.find(el => el.id === selectedElement);
  const selectedImageElement = imageElements.find(el => el.id === selectedElement);

  return (
    <div className="invitation-template-editor">
      <div className="editor-header">
        <h2>{template ? 'Edit Template' : 'Create New Template'}</h2>
        <div className="header-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Template</button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Template Settings</h3>
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div className="form-group">
              <label>Background Color</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Background Image URL</label>
              <input
                type="url"
                value={backgroundImage}
                onChange={(e) => setBackgroundImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {backgroundImage && (
              <div className="form-group">
                <label>Background Image Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={backgroundImageOpacity}
                  onChange={(e) => setBackgroundImageOpacity(Number(e.target.value))}
                />
                <span>{Math.round(backgroundImageOpacity * 100)}%</span>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Width (px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min="300"
                  max="1200"
                />
              </div>
              <div className="form-group">
                <label>Height (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="400"
                  max="1600"
                />
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Add Text Elements</h3>
            <div className="element-buttons">
              <button onClick={() => addTextElement('title')} className="element-btn">
                Title
              </button>
              <button onClick={() => addTextElement('subtitle')} className="element-btn">
                Subtitle
              </button>
              <button onClick={() => addTextElement('date')} className="element-btn">
                Date
              </button>
              <button onClick={() => addTextElement('location')} className="element-btn">
                Location
              </button>
              <button onClick={() => addTextElement('body')} className="element-btn">
                Body Text
              </button>
              <button onClick={() => addTextElement('rsvp')} className="element-btn">
                RSVP Text
              </button>
              <button onClick={() => addTextElement('custom')} className="element-btn">
                Custom Text
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Add Image Elements</h3>
            <div className="element-buttons">
              <button onClick={() => addImageElement('decoration')} className="element-btn">
                Decoration
              </button>
              <button onClick={() => addImageElement('header')} className="element-btn">
                Header Image
              </button>
              <button onClick={() => addImageElement('background')} className="element-btn">
                Background
              </button>
            </div>
          </div>

          {selectedImageElement && (
            <div className="sidebar-section">
              <h3>Image Properties</h3>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={selectedImageElement.src}
                  onChange={(e) => updateImageElement(selectedElement!, { src: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group">
                <label>Image Type</label>
                <select
                  value={selectedImageElement.type}
                  onChange={(e) => {
                    const newType = e.target.value as ImageElement['type'];
                    updateImageElement(selectedElement!, { 
                      type: newType,
                      zIndex: newType === 'background' ? -1 : (selectedImageElement.zIndex <= 0 ? 1 : selectedImageElement.zIndex)
                    });
                  }}
                >
                  <option value="decoration">Decoration (Foreground)</option>
                  <option value="header">Header Image</option>
                  <option value="background">Background Image</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={selectedImageElement.width}
                    onChange={(e) => updateImageElement(selectedElement!, { width: Number(e.target.value) })}
                    min="10"
                  />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={selectedImageElement.height}
                    onChange={(e) => updateImageElement(selectedElement!, { height: Number(e.target.value) })}
                    min="10"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedImageElement.opacity}
                    onChange={(e) => updateImageElement(selectedElement!, { opacity: Number(e.target.value) })}
                  />
                  <span>{Math.round(selectedImageElement.opacity * 100)}%</span>
                </div>
                <div className="form-group">
                  <label>Layer (Z-Index)</label>
                  <input
                    type="number"
                    value={selectedImageElement.zIndex}
                    onChange={(e) => updateImageElement(selectedElement!, { zIndex: Number(e.target.value) })}
                    min="-10"
                    max="10"
                  />
                </div>
              </div>
              <button 
                onClick={() => deleteElement(selectedElement!)} 
                className="btn-danger"
              >
                Delete Element
              </button>
            </div>
          )}

          {selectedTextElement && (
            <div className="sidebar-section">
              <h3>Text Properties</h3>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={selectedTextElement.content}
                  onChange={(e) => updateTextElement(selectedElement!, { content: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Font Family</label>
                <select
                  value={selectedTextElement.fontFamily}
                  onChange={(e) => updateTextElement(selectedElement!, { fontFamily: e.target.value })}
                >
                  {FONT_FAMILIES.map(font => (
                    <option key={font} value={font}>{font.split(',')[0]}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Font Size</label>
                  <input
                    type="number"
                    value={selectedTextElement.fontSize}
                    onChange={(e) => updateTextElement(selectedElement!, { fontSize: Number(e.target.value) })}
                    min="8"
                    max="72"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={selectedTextElement.color}
                    onChange={(e) => updateTextElement(selectedElement!, { color: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Font Weight</label>
                  <select
                    value={selectedTextElement.fontWeight}
                    onChange={(e) => updateTextElement(selectedElement!, { fontWeight: e.target.value as any })}
                  >
                    {FONT_WEIGHTS.map(weight => (
                      <option key={weight.value} value={weight.value}>{weight.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Text Align</label>
                  <select
                    value={selectedTextElement.textAlign}
                    onChange={(e) => updateTextElement(selectedElement!, { textAlign: e.target.value as any })}
                  >
                    {TEXT_ALIGNS.map(align => (
                      <option key={align.value} value={align.value}>{align.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={selectedTextElement.width}
                    onChange={(e) => updateTextElement(selectedElement!, { width: Number(e.target.value) })}
                    min="50"
                  />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={selectedTextElement.height}
                    onChange={(e) => updateTextElement(selectedElement!, { height: Number(e.target.value) })}
                    min="20"
                  />
                </div>
              </div>
              <button 
                onClick={() => deleteElement(selectedElement!)} 
                className="btn-danger"
              >
                Delete Element
              </button>
            </div>
          )}
        </div>

        <div className="editor-canvas-container">
          <div className="canvas-header">
            <h3>Live Preview</h3>
          </div>
          <div 
            ref={canvasRef}
            className="invitation-canvas"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
              position: 'relative'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Background image overlay with opacity */}
            {backgroundImage && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: backgroundImageOpacity,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />
            )}
            {/* Render all elements sorted by z-index */}
            {[...imageElements, ...textElements]
              .sort((a, b) => {
                const aZIndex = 'zIndex' in a ? a.zIndex : 0;
                const bZIndex = 'zIndex' in b ? b.zIndex : 0;
                return aZIndex - bZIndex;
              })
              .map(element => {
                if ('content' in element) {
                  // Text element
                  return (
                    <div
                      key={element.id}
                      className={`text-element ${selectedElement === element.id ? 'selected' : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        fontSize: `${element.fontSize}px`,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        fontWeight: element.fontWeight,
                        textAlign: element.textAlign,
                        cursor: 'move',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: element.textAlign === 'center' ? 'center' : 
                                       element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        zIndex: 2
                      }}
                      onMouseDown={(e) => handleMouseDown(e, element.id, 'text')}
                    >
                      {personalizeContent(element.content)}
                    </div>
                  );
                } else {
                  // Image element
                  return (
                    <div
                      key={element.id}
                      className={`image-element ${selectedElement === element.id ? 'selected' : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        cursor: 'move',
                        userSelect: 'none',
                        zIndex: element.zIndex,
                        opacity: element.opacity
                      }}
                      onMouseDown={(e) => handleMouseDown(e, element.id, 'image')}
                    >
                      <img
                        src={element.src}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          pointerEvents: 'none'
                        }}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x100?text=Image+Error';
                        }}
                      />
                      {selectedElement === element.id && (
                        <>
                          {/* Resize handles */}
                          <div
                            className="resize-handle resize-handle-se"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, element.id, 'image', 'se');
                            }}
                          />
                          <div
                            className="resize-handle resize-handle-sw"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, element.id, 'image', 'sw');
                            }}
                          />
                          <div
                            className="resize-handle resize-handle-ne"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, element.id, 'image', 'ne');
                            }}
                          />
                          <div
                            className="resize-handle resize-handle-nw"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, element.id, 'image', 'nw');
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                }
              })}
          </div>
        </div>
      </div>
    </div>
  );
};