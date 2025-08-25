import { InvitationTemplate as InvitationTemplateInterface, TextElement, ImageElement } from '../../../shared/src/types';

export interface InvitationTemplateInput {
  eventId: string;
  name: string;
  backgroundColor?: string;
  backgroundImage?: string;
  width?: number;
  height?: number;
  textElements?: TextElement[];
  imageElements?: ImageElement[];
  isDefault?: boolean;
}

export interface InvitationTemplateUpdate {
  name?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  width?: number;
  height?: number;
  textElements?: TextElement[];
  imageElements?: ImageElement[];
  isDefault?: boolean;
}

export class InvitationTemplateModel {
  static readonly DEFAULT_BACKGROUND_COLOR = '#ffffff';
  static readonly DEFAULT_TEXT_COLOR = '#333333';
  static readonly DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
  static readonly DEFAULT_FONT_SIZE = 16;

  static validate(input: InvitationTemplateInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (input.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(input.backgroundColor)) {
      errors.push('Background color must be a valid hex color');
    }

    if (input.width && (input.width < 100 || input.width > 2000)) {
      errors.push('Width must be between 100 and 2000 pixels');
    }

    if (input.height && (input.height < 100 || input.height > 2000)) {
      errors.push('Height must be between 100 and 2000 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: InvitationTemplateUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.name !== undefined && update.name.trim().length === 0) {
      errors.push('Template name cannot be empty');
    }

    if (update.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(update.backgroundColor)) {
      errors.push('Background color must be a valid hex color');
    }

    if (update.width && (update.width < 100 || update.width > 2000)) {
      errors.push('Width must be between 100 and 2000 pixels');
    }

    if (update.height && (update.height < 100 || update.height > 2000)) {
      errors.push('Height must be between 100 and 2000 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: InvitationTemplateInput): InvitationTemplateInput {
    return {
      ...input,
      name: input.name.trim(),
      backgroundColor: input.backgroundColor || this.DEFAULT_BACKGROUND_COLOR,
      width: input.width || 600,
      height: input.height || 800,
      textElements: input.textElements || [],
      imageElements: input.imageElements || [],
      isDefault: input.isDefault || false
    };
  }

  static createDefaultTemplates(eventId: string): InvitationTemplateInput[] {
    return [
      // Light Theme Template
      {
        eventId,
        name: 'Light Elegance',
        backgroundColor: '#f8f9fa',
        width: 600,
        height: 800,
        textElements: [
          {
            id: 'title',
            type: 'title',
            content: 'You\'re Invited!',
            position: { x: 50, y: 80 },
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
            position: { x: 50, y: 150 },
            fontSize: 24,
            fontFamily: 'Georgia, serif',
            color: '#34495e',
            fontWeight: '600',
            textAlign: 'center',
            width: 500,
            height: 40
          },
          {
            id: 'date',
            type: 'date',
            content: '{{eventDate}} at {{eventTime}}',
            position: { x: 50, y: 220 },
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
            position: { x: 50, y: 270 },
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
            position: { x: 50, y: 350 },
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
            position: { x: 50, y: 500 },
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
        isDefault: true
      },
      // Dark Theme Template
      {
        eventId,
        name: 'Dark Sophistication',
        backgroundColor: '#2c3e50',
        width: 600,
        height: 800,
        textElements: [
          {
            id: 'title',
            type: 'title',
            content: 'You\'re Invited!',
            position: { x: 50, y: 80 },
            fontSize: 32,
            fontFamily: 'Playfair Display, serif',
            color: '#ecf0f1',
            fontWeight: 'bold',
            textAlign: 'center',
            width: 500,
            height: 50
          },
          {
            id: 'event-name',
            type: 'subtitle',
            content: '{{eventTitle}}',
            position: { x: 50, y: 150 },
            fontSize: 24,
            fontFamily: 'Playfair Display, serif',
            color: '#bdc3c7',
            fontWeight: '600',
            textAlign: 'center',
            width: 500,
            height: 40
          },
          {
            id: 'date',
            type: 'date',
            content: '{{eventDate}} at {{eventTime}}',
            position: { x: 50, y: 220 },
            fontSize: 18,
            fontFamily: 'Lato, sans-serif',
            color: '#95a5a6',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 30
          },
          {
            id: 'location',
            type: 'location',
            content: '{{eventLocation}}',
            position: { x: 50, y: 270 },
            fontSize: 16,
            fontFamily: 'Lato, sans-serif',
            color: '#95a5a6',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 30
          },
          {
            id: 'message',
            type: 'body',
            content: 'Join us for an evening of elegance and celebration. Your presence will add to the magic of this special moment.',
            position: { x: 50, y: 350 },
            fontSize: 16,
            fontFamily: 'Lato, sans-serif',
            color: '#ecf0f1',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 80
          },
          {
            id: 'rsvp',
            type: 'rsvp',
            content: 'Please RSVP by {{rsvpDeadline}}',
            position: { x: 50, y: 500 },
            fontSize: 14,
            fontFamily: 'Lato, sans-serif',
            color: '#f39c12',
            fontWeight: 'bold',
            textAlign: 'center',
            width: 500,
            height: 30
          }
        ],
        imageElements: [],
        isDefault: false
      },
      // Colorful Theme Template
      {
        eventId,
        name: 'Vibrant Celebration',
        backgroundColor: '#fff5f5',
        width: 600,
        height: 800,
        textElements: [
          {
            id: 'title',
            type: 'title',
            content: 'You\'re Invited!',
            position: { x: 50, y: 80 },
            fontSize: 32,
            fontFamily: 'Montserrat, sans-serif',
            color: '#e91e63',
            fontWeight: 'bold',
            textAlign: 'center',
            width: 500,
            height: 50
          },
          {
            id: 'event-name',
            type: 'subtitle',
            content: '{{eventTitle}}',
            position: { x: 50, y: 150 },
            fontSize: 24,
            fontFamily: 'Montserrat, sans-serif',
            color: '#9c27b0',
            fontWeight: '600',
            textAlign: 'center',
            width: 500,
            height: 40
          },
          {
            id: 'date',
            type: 'date',
            content: '{{eventDate}} at {{eventTime}}',
            position: { x: 50, y: 220 },
            fontSize: 18,
            fontFamily: 'Open Sans, sans-serif',
            color: '#ff5722',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 30
          },
          {
            id: 'location',
            type: 'location',
            content: '{{eventLocation}}',
            position: { x: 50, y: 270 },
            fontSize: 16,
            fontFamily: 'Open Sans, sans-serif',
            color: '#ff9800',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 30
          },
          {
            id: 'message',
            type: 'body',
            content: 'Come celebrate with us! It\'s going to be a day filled with joy, laughter, and unforgettable memories.',
            position: { x: 50, y: 350 },
            fontSize: 16,
            fontFamily: 'Open Sans, sans-serif',
            color: '#673ab7',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 500,
            height: 80
          },
          {
            id: 'rsvp',
            type: 'rsvp',
            content: 'Please RSVP by {{rsvpDeadline}}',
            position: { x: 50, y: 500 },
            fontSize: 14,
            fontFamily: 'Open Sans, sans-serif',
            color: '#4caf50',
            fontWeight: 'bold',
            textAlign: 'center',
            width: 500,
            height: 30
          }
        ],
        imageElements: [],
        isDefault: false
      }
    ];
  }
}