import { GuestModel, GuestInput, GuestUpdate } from '../../models/Guest';
import { RelationshipType } from '../../../../shared/src/types';

describe('GuestModel', () => {
  describe('validate', () => {
    const validGuestInput: GuestInput = {
      eventId: 'event-123',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      dietaryRestrictions: ['Vegetarian'],
      additionalGuestCount: 1,
      relationshipType: RelationshipType.FRIEND,
      brideOrGroomSide: 'bride',
      specialRequests: 'Window seat please'
    };

    it('should validate a valid guest input', () => {
      const result = GuestModel.validate(validGuestInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const input = { ...validGuestInput, name: '' };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject empty phone number', () => {
      const input = { ...validGuestInput, phoneNumber: '' };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number is required');
    });

    it('should reject invalid phone number format', () => {
      const input = { ...validGuestInput, phoneNumber: 'invalid-phone' };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number format is invalid');
    });

    it('should reject empty event ID', () => {
      const input = { ...validGuestInput, eventId: '' };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should reject invalid relationship type', () => {
      const input = { ...validGuestInput, relationshipType: 'InvalidType' as RelationshipType };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid relationship type');
    });

    it('should reject invalid bride or groom side', () => {
      const input = { ...validGuestInput, brideOrGroomSide: 'invalid' as 'bride' };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bride or groom side must be specified');
    });

    it('should reject negative additional guest count', () => {
      const input = { ...validGuestInput, additionalGuestCount: -1 };
      const result = GuestModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Additional guest count cannot be negative');
    });

    it('should accept valid phone number formats', () => {
      const phoneNumbers = ['+1234567890', '123-456-7890', '(123) 456-7890', '123 456 7890'];
      
      phoneNumbers.forEach(phoneNumber => {
        const input = { ...validGuestInput, phoneNumber };
        const result = GuestModel.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: GuestUpdate = {
        name: 'Jane Doe',
        rsvpStatus: 'accepted'
      };
      
      const result = GuestModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name in update', () => {
      const update: GuestUpdate = { name: '' };
      const result = GuestModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name cannot be empty');
    });

    it('should reject invalid RSVP status', () => {
      const update: GuestUpdate = { rsvpStatus: 'invalid' as 'pending' };
      const result = GuestModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid RSVP status');
    });

    it('should accept valid RSVP statuses', () => {
      const statuses = ['pending', 'accepted', 'declined', 'no_response'];
      
      statuses.forEach(rsvpStatus => {
        const update: GuestUpdate = { rsvpStatus: rsvpStatus as 'pending' };
        const result = GuestModel.validateUpdate(update);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace and set defaults', () => {
      const input: GuestInput = {
        eventId: 'event-123',
        name: '  John Doe  ',
        phoneNumber: '  +1234567890  ',
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '  Window seat please  '
      };

      const sanitized = GuestModel.sanitize(input);
      
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.phoneNumber).toBe('+1234567890');
      expect(sanitized.specialRequests).toBe('Window seat please');
      expect(sanitized.dietaryRestrictions).toEqual([]);
      expect(sanitized.additionalGuestCount).toBe(0);
    });

    it('should preserve provided values', () => {
      const input: GuestInput = {
        eventId: 'event-123',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
        additionalGuestCount: 2,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: 'Special request'
      };

      const sanitized = GuestModel.sanitize(input);
      
      expect(sanitized.dietaryRestrictions).toEqual(['Vegetarian', 'Gluten-free']);
      expect(sanitized.additionalGuestCount).toBe(2);
      expect(sanitized.specialRequests).toBe('Special request');
    });
  });
});