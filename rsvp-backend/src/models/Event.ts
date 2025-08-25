import { Event as EventInterface } from '../../../shared/src/types';

export interface EventInput {
  title: string;
  description?: string;
  date: Date;
  location: string;
  rsvpDeadline: Date;
  organizerId: string;
  publicRSVPEnabled?: boolean;
}

export interface EventUpdate {
  title?: string;
  description?: string;
  date?: Date;
  location?: string;
  rsvpDeadline?: Date;
  publicRSVPEnabled?: boolean;
  publicRSVPLink?: string | null;
}

export class EventModel {
  static validate(input: EventInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.title || input.title.trim().length === 0) {
      errors.push('Event title is required');
    }

    if (!input.location || input.location.trim().length === 0) {
      errors.push('Event location is required');
    }

    if (!input.organizerId || input.organizerId.trim().length === 0) {
      errors.push('Organizer ID is required');
    }

    if (!input.date || isNaN(input.date.getTime())) {
      errors.push('Valid event date is required');
    }

    if (!input.rsvpDeadline || isNaN(input.rsvpDeadline.getTime())) {
      errors.push('Valid RSVP deadline is required');
    }

    if (input.date && input.rsvpDeadline && input.rsvpDeadline >= input.date) {
      errors.push('RSVP deadline must be before the event date');
    }

    if (input.rsvpDeadline && input.rsvpDeadline <= new Date()) {
      errors.push('RSVP deadline must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: EventUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.title !== undefined && update.title.trim().length === 0) {
      errors.push('Event title cannot be empty');
    }

    if (update.location !== undefined && update.location.trim().length === 0) {
      errors.push('Event location cannot be empty');
    }

    if (update.date !== undefined && isNaN(update.date.getTime())) {
      errors.push('Valid event date is required');
    }

    if (update.rsvpDeadline !== undefined && isNaN(update.rsvpDeadline.getTime())) {
      errors.push('Valid RSVP deadline is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: EventInput): EventInput {
    return {
      ...input,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      location: input.location.trim(),
      publicRSVPEnabled: input.publicRSVPEnabled || false
    };
  }

  static generatePublicRSVPLink(eventId: string): string {
    return `${process.env.BASE_URL || 'http://localhost:3000'}/rsvp/public/${eventId}`;
  }
}