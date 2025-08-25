import React, { useState, useEffect } from 'react';
import { InvitationTemplate } from '../../../shared/src/types';
import './InvitationDisplay.css';

interface InvitationDisplayProps {
  eventId: string;
  guestName?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  rsvpDeadline?: string;
  rsvpLink?: string;
  className?: string;
}

export const InvitationDisplay: React.FC<InvitationDisplayProps> = ({
  eventId,
  guestName = 'Guest',
  eventTitle = 'Special Event',
  eventDate = 'Date TBD',
  eventTime = 'Time TBD',
  eventLocation = 'Location TBD',
  rsvpDeadline = 'RSVP Required',
  rsvpLink = '#',
  className = ''
}) => {
  const [template, setTemplate] = useState<InvitationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultTemplate();
  }, [eventId]);

  const loadDefaultTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rsvp/events/${eventId}/invitation-templates/default`);
      if (!response.ok) {
        throw new Error('Failed to load invitation template');
      }
      const templateData = await response.json();
      setTemplate(templateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Create a fallback template if loading fails
      setTemplate(createFallbackTemplate());
    } finally {
      setLoading(false);
    }
  };

  const createFallbackTemplate = (): InvitationTemplate => {
    return {
      id: 'fallback',
      eventId,
      name: 'Fallback Template',
      backgroundColor: '#f8f9fa',
      width: 600,
      height: 800,
      textElements: [
        {
          id: 'title',
          type: 'title',
          content: 'You\'re Invited!',
          position: { x: 50, y: 100 },
          fontSize: 32,
          fontFamily: 'Georgia, serif',
          color: '#2c3e50',
          fontWeight: 'bold',
          textAlign: 'center',
          width: 500,
          height: 50
        },
        {
          id: 'event-name',
          type: 'subtitle',
          content: '{{eventTitle}}',
          position: { x: 50, y: 180 },
          fontSize: 24,
          fontFamily: 'Georgia, serif',
          color: '#34495e',
          fontWeight: '600',
          textAlign: 'center',
          width: 500,
          height: 40
        },
        {
          id: 'guest-name',
          type: 'custom',
          content: 'Dear {{guestName}},',
          position: { x: 50, y: 250 },
          fontSize: 18,
          fontFamily: 'Arial, sans-serif',
          color: '#2c3e50',
          fontWeight: 'normal',
          textAlign: 'center',
          width: 500,
          height: 30
        },
        {
          id: 'date',
          type: 'date',
          content: '{{eventDate}} at {{eventTime}}',
          position: { x: 50, y: 320 },
          fontSize: 18,
          fontFamily: 'Arial, sans-serif',
          color: '#7f8c8d',
          fontWeight: 'normal',
          textAlign: 'center',
          width: 500,
          height: 30
        },
        {
          id: 'location',
          type: 'location',
          content: '{{eventLocation}}',
          position: { x: 50, y: 370 },
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          color: '#7f8c8d',
          fontWeight: 'normal',
          textAlign: 'center',
          width: 500,
          height: 30
        },
        {
          id: 'message',
          type: 'body',
          content: 'We would be honored to have you join us for this special celebration. Your presence would make our day even more meaningful.',
          position: { x: 50, y: 450 },
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          color: '#2c3e50',
          fontWeight: 'normal',
          textAlign: 'center',
          width: 500,
          height: 80
        },
        {
          id: 'rsvp',
          type: 'rsvp',
          content: 'Please RSVP by {{rsvpDeadline}}',
          position: { x: 50, y: 580 },
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#e74c3c',
          fontWeight: 'bold',
          textAlign: 'center',
          width: 500,
          height: 30
        }
      ],
      imageElements: [],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  const personalizeContent = (content: string): string => {
    return content
      .replace(/\{\{guestName\}\}/g, guestName)
      .replace(/\{\{eventTitle\}\}/g, eventTitle)
      .replace(/\{\{eventDate\}\}/g, eventDate)
      .replace(/\{\{eventTime\}\}/g, eventTime)
      .replace(/\{\{eventLocation\}\}/g, eventLocation)
      .replace(/\{\{rsvpDeadline\}\}/g, rsvpDeadline)
      .replace(/\{\{rsvpLink\}\}/g, rsvpLink);
  };

  if (loading) {
    return (
      <div className={`invitation-display loading ${className}`}>
        <div className="loading-message">Loading invitation...</div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className={`invitation-display error ${className}`}>
        <div className="error-message">Failed to load invitation template</div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className={`invitation-display ${className}`}>
      <div 
        className="invitation-canvas"
        style={{
          width: `${template.width}px`,
          height: `${template.height}px`,
          backgroundColor: template.backgroundColor,
          position: 'relative',
          margin: '0 auto',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Background image overlay with opacity */}
        {template.backgroundImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${template.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: template.backgroundImageOpacity || 1,
              zIndex: -2,
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* Render all elements in z-index order */}
        {[...template.textElements, ...template.imageElements]
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.textAlign === 'center' ? 'center' : 
                                   element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    wordWrap: 'break-word',
                    lineHeight: '1.4'
                  }}
                >
                  {personalizeContent(element.content)}
                </div>
              );
            } else {
              // Image element
              return (
                <img
                  key={element.id}
                  src={element.src}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    opacity: element.opacity,
                    zIndex: element.zIndex,
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              );
            }
          })}
      </div>
    </div>
  );
};