import { Guest as GuestInterface, RelationshipType } from '../../../shared/src/types';

export interface GuestInput {
  eventId: string;
  name: string;
  phoneNumber: string;
  dietaryRestrictions?: string[];
  additionalGuestCount?: number;
  relationshipType: RelationshipType;
  brideOrGroomSide: 'bride' | 'groom';
  specialRequests?: string;
}

export interface GuestUpdate {
  name?: string;
  phoneNumber?: string;
  dietaryRestrictions?: string[];
  additionalGuestCount?: number;
  relationshipType?: RelationshipType;
  brideOrGroomSide?: 'bride' | 'groom';
  rsvpStatus?: 'not_invited' | 'pending' | 'accepted' | 'declined' | 'no_response';
  specialRequests?: string;
  tableAssignment?: string;
}

export class GuestModel {
  static validate(input: GuestInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!input.phoneNumber || input.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(input.phoneNumber)) {
      errors.push('Phone number format is invalid');
    }

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!Object.values(RelationshipType).includes(input.relationshipType)) {
      errors.push('Invalid relationship type');
    }

    if (!['bride', 'groom'].includes(input.brideOrGroomSide)) {
      errors.push('Bride or groom side must be specified');
    }

    if (input.additionalGuestCount !== undefined && input.additionalGuestCount < 0) {
      errors.push('Additional guest count cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: GuestUpdate): { isValid: boolean; errors: string[] } {
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

    if (update.relationshipType !== undefined && !Object.values(RelationshipType).includes(update.relationshipType)) {
      errors.push('Invalid relationship type');
    }

    if (update.brideOrGroomSide !== undefined && !['bride', 'groom'].includes(update.brideOrGroomSide)) {
      errors.push('Bride or groom side must be bride or groom');
    }

    if (update.rsvpStatus !== undefined && !['not_invited', 'pending', 'accepted', 'declined', 'no_response'].includes(update.rsvpStatus)) {
      errors.push('Invalid RSVP status');
    }

    if (update.additionalGuestCount !== undefined && update.additionalGuestCount < 0) {
      errors.push('Additional guest count cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: GuestInput): GuestInput {
    return {
      ...input,
      name: input.name.trim(),
      phoneNumber: input.phoneNumber.trim(),
      dietaryRestrictions: input.dietaryRestrictions || [],
      additionalGuestCount: input.additionalGuestCount || 0,
      specialRequests: input.specialRequests?.trim() || ''
    };
  }
}