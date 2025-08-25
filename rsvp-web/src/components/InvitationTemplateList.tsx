import React, { useState, useEffect } from 'react';
import { InvitationTemplate } from '../../../shared/src/types';
import { InvitationTemplateEditor } from './InvitationTemplateEditor';
import './InvitationTemplateList.css';

interface InvitationTemplateListProps {
  eventId: string;
}

export const InvitationTemplateList: React.FC<InvitationTemplateListProps> = ({ eventId }) => {
  const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvitationTemplate | undefined>();


  useEffect(() => {
    loadTemplates();
  }, [eventId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rsvp/events/${eventId}/invitation-templates`);
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: InvitationTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (templateData: Partial<InvitationTemplate>) => {
    try {
      const url = editingTemplate 
        ? `/api/rsvp/invitation-templates/${editingTemplate.id}`
        : `/api/rsvp/events/${eventId}/invitation-templates`;
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      await loadTemplates();
      setShowEditor(false);
      setEditingTemplate(undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rsvp/invitation-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      await loadTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleSetAsDefault = async (templateId: string) => {
    try {
      const response = await fetch(`/api/rsvp/invitation-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set as default');
      }

      await loadTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set as default');
    }
  };

  const renderTemplatePreview = (template: InvitationTemplate) => {
    // Calculate scale factor to fit preview container (200px height)
    const previewHeight = 200;
    const scaleFactor = previewHeight / template.height;
    const previewWidth = template.width * scaleFactor;
    
    return (
      <div 
        className="template-preview"
        style={{
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
          backgroundColor: template.backgroundColor,
          backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {template.textElements.map(element => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${element.position.x * scaleFactor}px`,
              top: `${element.position.y * scaleFactor}px`,
              width: `${element.width * scaleFactor}px`,
              height: `${element.height * scaleFactor}px`,
              fontSize: `${Math.max(element.fontSize * scaleFactor, 8)}px`, // Ensure minimum readable size
              fontFamily: element.fontFamily,
              color: element.color,
              fontWeight: element.fontWeight,
              textAlign: element.textAlign,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                             element.textAlign === 'right' ? 'flex-end' : 'flex-start',
              overflow: 'hidden',
              lineHeight: '1.2',
              wordWrap: 'break-word'
            }}
          >
            {element.content.length > 50 ? element.content.substring(0, 50) + '...' : element.content}
          </div>
        ))}
        
        {template.imageElements && template.imageElements.map(element => (
          <img
            key={element.id}
            src={element.src}
            alt=""
            style={{
              position: 'absolute',
              left: `${element.position.x * scaleFactor}px`,
              top: `${element.position.y * scaleFactor}px`,
              width: `${element.width * scaleFactor}px`,
              height: `${element.height * scaleFactor}px`,
              opacity: element.opacity,
              objectFit: 'cover'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ))}
      </div>
    );
  };

  if (showEditor) {
    return (
      <InvitationTemplateEditor
        eventId={eventId}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(undefined);
        }}
      />
    );
  }

  if (loading) {
    return <div className="loading">Loading templates...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="invitation-template-list">
      <div className="template-list-header">
        <h2>Invitation Templates</h2>
        <button onClick={handleCreateTemplate} className="btn-primary">
          Create New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state">
          <p>No invitation templates found.</p>
          <button onClick={handleCreateTemplate} className="btn-primary">
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <h3>{template.name}</h3>
                {template.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              
              <div className="template-preview-container">
                {renderTemplatePreview(template)}
              </div>

              <div className="template-card-actions">
                <button 
                  onClick={() => handleEditTemplate(template)}
                  className="btn-secondary"
                >
                  Edit
                </button>
                {!template.isDefault && (
                  <button 
                    onClick={() => handleSetAsDefault(template.id)}
                    className="btn-outline"
                  >
                    Set as Default
                  </button>
                )}
                {!template.isDefault && (
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
};