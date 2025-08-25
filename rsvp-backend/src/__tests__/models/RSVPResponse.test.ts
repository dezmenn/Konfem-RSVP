import { RSVPResponseModel, RSVPResponseInput, RSVPResponseUpdate } from '../../models/RSVPResponse';
import { AdditionalGuestDetail } from '../../../../shared/src/types';

describe('RSVPResponseModel', () => {
  describe('validate', () => {
    const validInput: RSVPResponseInput = {
      guestId: 'guest-123',
      eventId: 'event-123',
      rsvpTokenId: 'token-123',
      attendanceStatus: 'accepted',
      mealPreferences: ['vegetarian'],
      specialRequests: 'No nuts please',
      additionalGuestDetails: [
        {
          name: 'John Doe',
          mealPreferences: ['vegan'],
          dietaryRestrictions: ['gluten-free']
        }
      ]
    };

    it('should validate a valid RSVP response input', () => {
      const result = RSVPResponseModel.validate(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require guest ID', () => {
      const input = { ...validInput, guestId: '' };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Guest ID is required');
    });

    it('should require event ID', () => {
      const input = { ...validInput, eventId: '' };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should require RSVP token ID', () => {
      const input = { ...validInput, rsvpTokenId: '' };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('RSVP Token ID is required');
    });

    it('should validate attendance status', () => {
      const input = { ...validInput, attendanceStatus: 'maybe' as any };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attendance status must be one of: accepted, declined');
    });

    it('should validate special requests length', () => {
      const input = { ...validInput, specialRequests: 'a'.repeat(1001) };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Special requests cannot exceed 1000 characters');
    });

    it('should validate maximum additional guests', () => {
      const additionalGuests: AdditionalGuestDetail[] = Array(11).fill(0).map((_, i) => ({
        name: `Guest ${i + 1}`,
        mealPreferences: [],
        dietaryRestrictions: []
      }));
      
      const input = { ...validInput, additionalGuestDetails: additionalGuests };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot have more than 10 additional guests');
    });

    it('should require names for additional guests', () => {
      const input = {
        ...validInput,
        additionalGuestDetails: [
          { name: '', mealPreferences: [], dietaryRestrictions: [] }
        ]
      };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Additional guest 1 name is required');
    });

    it('should allow declined status', () => {
      const input = { ...validInput, attendanceStatus: 'declined' as const };
      const result = RSVPResponseModel.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: RSVPResponseUpdate = {
        attendanceStatus: 'declined',
        mealPreferences: ['vegan'],
        specialRequests: 'Updated request'
      };
      const result = RSVPResponseModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate attendance status in update', () => {
      const update: RSVPResponseUpdate = { attendanceStatus: 'maybe' as any };
      const result = RSVPResponseModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attendance status must be one of: accepted, declined');
    });

    it('should validate special requests length in update', () => {
      const update: RSVPResponseUpdate = { specialRequests: 'a'.repeat(1001) };
      const result = RSVPResponseModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Special requests cannot exceed 1000 characters');
    });

    it('should validate additional guest names in update', () => {
      const update: RSVPResponseUpdate = {
        additionalGuestDetails: [
          { name: '', mealPreferences: [], dietaryRestrictions: [] }
        ]
      };
      const result = RSVPResponseModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Additional guest 1 name is required');
    });
  });

  describe('sanitize', () => {
    it('should sanitize input with default values', () => {
      const input: RSVPResponseInput = {
        guestId: 'guest-123',
        eventId: 'event-123',
        rsvpTokenId: 'token-123',
        attendanceStatus: 'accepted',
        specialRequests: '  Some request  '
      };

      const result = RSVPResponseModel.sanitize(input);
      
      expect(result.mealPreferences).toEqual([]);
      expect(result.specialRequests).toBe('Some request');
      expect(result.additionalGuestDetails).toEqual([]);
    });

    it('should sanitize additional guest details', () => {
      const input: RSVPResponseInput = {
        guestId: 'guest-123',
        eventId: 'event-123',
        rsvpTokenId: 'token-123',
        attendanceStatus: 'accepted',
        additionalGuestDetails: [
          {
            name: '  John Doe  ',
            mealPreferences: undefined,
            dietaryRestrictions: undefined
          }
        ]
      };

      const result = RSVPResponseModel.sanitize(input);
      
      expect(result.additionalGuestDetails).toHaveLength(1);
      expect(result.additionalGuestDetails![0].name).toBe('John Doe');
      expect(result.additionalGuestDetails![0].mealPreferences).toEqual([]);
      expect(result.additionalGuestDetails![0].dietaryRestrictions).toEqual([]);
    });

    it('should preserve provided values', () => {
      const input: RSVPResponseInput = {
        guestId: 'guest-123',
        eventId: 'event-123',
        rsvpTokenId: 'token-123',
        attendanceStatus: 'declined',
        mealPreferences: ['vegetarian', 'gluten-free'],
        specialRequests: 'Custom request',
        additionalGuestDetails: [
          {
            name: 'Jane Doe',
            mealPreferences: ['vegan'],
            dietaryRestrictions: ['nut-free']
          }
        ]
      };

      const result = RSVPResponseModel.sanitize(input);
      
      expect(result.mealPreferences).toEqual(['vegetarian', 'gluten-free']);
      expect(result.specialRequests).toBe('Custom request');
      expect(result.additionalGuestDetails).toHaveLength(1);
      expect(result.additionalGuestDetails![0]).toEqual({
        name: 'Jane Doe',
        mealPreferences: ['vegan'],
        dietaryRestrictions: ['nut-free']
      });
    });
  });
});