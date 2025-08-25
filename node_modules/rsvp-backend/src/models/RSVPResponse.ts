import { RSVPResponse as RSVPResponseInterface, AdditionalGuestDetail } from '../../../shared/src/types';

export interface RSVPResponseInput {
  guestId: string;
  eventId: string;
  rsvpTokenId: string;
  attendanceStatus: 'accepted' | 'declined';
  mealPreferences?: string[];
  specialRequests?: string;
  additionalGuestDetails?: AdditionalGuestDetail[];
}

export interface RSVPResponseUpdate {
  attendanceStatus?: 'accepted' | 'declined';
  mealPreferences?: string[];
  specialRequests?: string;
  additionalGuestDetails?: AdditionalGuestDetail[];
}

export class RSVPResponseModel {
  static readonly VALID_ATTENDANCE_STATUSES = ['accepted', 'declined'] as const;
  static readonly MAX_ADDITIONAL_GUESTS = 10;

  static validate(input: RSVPResponseInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.guestId || input.guestId.trim().length === 0) {
      errors.push('Guest ID is required');
    }

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.rsvpTokenId || input.rsvpTokenId.trim().length === 0) {
      errors.push('RSVP Token ID is required');
    }

    if (!this.VALID_ATTENDANCE_STATUSES.includes(input.attendanceStatus)) {
      errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
    }

    if (input.specialRequests && input.specialRequests.length > 1000) {
      errors.push('Special requests cannot exceed 1000 characters');
    }

    if (input.additionalGuestDetails && input.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
    }

    if (input.additionalGuestDetails) {
      input.additionalGuestDetails.forEach((guest, index) => {
        if (!guest.name || guest.name.trim().length === 0) {
          errors.push(`Additional guest ${index + 1} name is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: RSVPResponseUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.attendanceStatus && !this.VALID_ATTENDANCE_STATUSES.includes(update.attendanceStatus)) {
      errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
    }

    if (update.specialRequests && update.specialRequests.length > 1000) {
      errors.push('Special requests cannot exceed 1000 characters');
    }

    if (update.additionalGuestDetails && update.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
    }

    if (update.additionalGuestDetails) {
      update.additionalGuestDetails.forEach((guest, index) => {
        if (!guest.name || guest.name.trim().length === 0) {
          errors.push(`Additional guest ${index + 1} name is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: RSVPResponseInput): RSVPResponseInput {
    return {
      ...input,
      mealPreferences: input.mealPreferences || [],
      specialRequests: input.specialRequests?.trim() || '',
      additionalGuestDetails: input.additionalGuestDetails?.map(guest => ({
        ...guest,
        name: guest.name.trim(),
        mealPreferences: guest.mealPreferences || [],
        dietaryRestrictions: guest.dietaryRestrictions || []
      })) || []
    };
  }
}