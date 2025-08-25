import { PublicRSVPRegistration as PublicRSVPRegistrationInterface, AdditionalGuestDetail, RelationshipType } from '../../../shared/src/types';

export interface PublicRSVPRegistrationInput {
  eventId: string;
  name: string;
  phoneNumber: string;
  relationshipType: string;
  brideOrGroomSide: 'bride' | 'groom';
  attendanceStatus: 'accepted' | 'declined';
  mealPreferences?: string[];
  specialRequests?: string;
  additionalGuestCount?: number;
  additionalGuestDetails?: AdditionalGuestDetail[];
}

export interface PublicRSVPRegistrationUpdate {
  name?: string;
  phoneNumber?: string;
  relationshipType?: string;
  brideOrGroomSide?: 'bride' | 'groom';
  attendanceStatus?: 'accepted' | 'declined';
  mealPreferences?: string[];
  specialRequests?: string;
  additionalGuestCount?: number;
  additionalGuestDetails?: AdditionalGuestDetail[];
}

export class PublicRSVPRegistrationModel {
  static readonly VALID_ATTENDANCE_STATUSES = ['accepted', 'declined'] as const;
  static readonly MAX_ADDITIONAL_GUESTS = 10;

  static validate(input: PublicRSVPRegistrationInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!input.phoneNumber || input.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(input.phoneNumber)) {
      errors.push('Phone number format is invalid');
    }

    if (!input.relationshipType || input.relationshipType.trim().length === 0) {
      errors.push('Relationship type is required');
    }

    if (!['bride', 'groom'].includes(input.brideOrGroomSide)) {
      errors.push('Bride or groom side must be specified');
    }

    if (!this.VALID_ATTENDANCE_STATUSES.includes(input.attendanceStatus)) {
      errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
    }

    if (input.specialRequests && input.specialRequests.length > 1000) {
      errors.push('Special requests cannot exceed 1000 characters');
    }

    if (input.additionalGuestCount !== undefined && input.additionalGuestCount < 0) {
      errors.push('Additional guest count cannot be negative');
    }

    if (input.additionalGuestCount !== undefined && input.additionalGuestCount > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
    }

    if (input.additionalGuestDetails && input.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guest details`);
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

  static validateUpdate(update: PublicRSVPRegistrationUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.name !== undefined && update.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    if (update.phoneNumber !== undefined) {
      if (update.phoneNumber.trim().length === 0) {
        errors.push('Phone number cannot be empty');
      } else if (!/^\+?[\d\s\-\(\)]+$/.test(update.phoneNumber)) {
        errors.push('Phone number format is invalid');
      }
    }

    if (update.relationshipType !== undefined && update.relationshipType.trim().length === 0) {
      errors.push('Relationship type cannot be empty');
    }

    if (update.brideOrGroomSide !== undefined && !['bride', 'groom'].includes(update.brideOrGroomSide)) {
      errors.push('Bride or groom side must be bride or groom');
    }

    if (update.attendanceStatus && !this.VALID_ATTENDANCE_STATUSES.includes(update.attendanceStatus)) {
      errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
    }

    if (update.specialRequests && update.specialRequests.length > 1000) {
      errors.push('Special requests cannot exceed 1000 characters');
    }

    if (update.additionalGuestCount !== undefined && update.additionalGuestCount < 0) {
      errors.push('Additional guest count cannot be negative');
    }

    if (update.additionalGuestCount !== undefined && update.additionalGuestCount > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
    }

    if (update.additionalGuestDetails && update.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
      errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guest details`);
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

  static sanitize(input: PublicRSVPRegistrationInput): PublicRSVPRegistrationInput {
    return {
      ...input,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      relationshipType: input.relationshipType.trim(),
      mealPreferences: input.mealPreferences || [],
      specialRequests: input.specialRequests?.trim() || '',
      additionalGuestCount: input.additionalGuestCount || 0,
      additionalGuestDetails: input.additionalGuestDetails?.map(guest => ({
        ...guest,
        name: guest.name.trim(),
        mealPreferences: guest.mealPreferences || [],
        dietaryRestrictions: guest.dietaryRestrictions || []
      })) || []
    };
  }
}