import { RSVPTokenModel, RSVPTokenInput, RSVPTokenUpdate } from '../../models/RSVPToken';
import { RSVPToken } from '../../../../shared/src/types';

describe('RSVPTokenModel', () => {
  describe('validate', () => {
    const validInput: RSVPTokenInput = {
      guestId: 'guest-123',
      eventId: 'event-123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    it('should validate a valid RSVP token input', () => {
      const result = RSVPTokenModel.validate(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require guest ID', () => {
      const input = { ...validInput, guestId: '' };
      const result = RSVPTokenModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Guest ID is required');
    });

    it('should require event ID', () => {
      const input = { ...validInput, eventId: '' };
      const result = RSVPTokenModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should validate expiry date is in the future', () => {
      const input = { ...validInput, expiresAt: new Date(Date.now() - 1000) };
      const result = RSVPTokenModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expiry date must be in the future');
    });

    it('should validate expiry date format', () => {
      const input = { ...validInput, expiresAt: new Date('invalid-date') };
      const result = RSVPTokenModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expiry date must be a valid date');
    });

    it('should allow undefined expiry date', () => {
      const input = { guestId: 'guest-123', eventId: 'event-123' };
      const result = RSVPTokenModel.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: RSVPTokenUpdate = {
        isUsed: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      const result = RSVPTokenModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate expiry date format in update', () => {
      const update: RSVPTokenUpdate = { expiresAt: new Date('invalid-date') };
      const result = RSVPTokenModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Expiry date must be a valid date');
    });
  });

  describe('generateToken', () => {
    it('should generate a unique token', () => {
      const token1 = RSVPTokenModel.generateToken();
      const token2 = RSVPTokenModel.generateToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes * 2 (hex)
    });

    it('should generate hex string', () => {
      const token = RSVPTokenModel.generateToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateExpiryDate', () => {
    it('should generate expiry date with default days', () => {
      const expiryDate = RSVPTokenModel.generateExpiryDate();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      
      expect(expiryDate.getDate()).toBe(expectedDate.getDate());
      expect(expiryDate.getMonth()).toBe(expectedDate.getMonth());
    });

    it('should generate expiry date with custom days', () => {
      const customDays = 7;
      const expiryDate = RSVPTokenModel.generateExpiryDate(customDays);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + customDays);
      
      expect(expiryDate.getDate()).toBe(expectedDate.getDate());
    });
  });

  describe('sanitize', () => {
    it('should sanitize input with generated token and default expiry', () => {
      const input: RSVPTokenInput = {
        guestId: 'guest-123',
        eventId: 'event-123'
      };

      const result = RSVPTokenModel.sanitize(input);
      
      expect(result.guestId).toBe('guest-123');
      expect(result.eventId).toBe('event-123');
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should preserve provided expiry date', () => {
      const customExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const input: RSVPTokenInput = {
        guestId: 'guest-123',
        eventId: 'event-123',
        expiresAt: customExpiry
      };

      const result = RSVPTokenModel.sanitize(input);
      expect(result.expiresAt).toBe(customExpiry);
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid unused token', () => {
      const token: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'abc123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      expect(RSVPTokenModel.isTokenValid(token)).toBe(true);
    });

    it('should return false for used token', () => {
      const token: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'abc123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: true,
        createdAt: new Date()
      };

      expect(RSVPTokenModel.isTokenValid(token)).toBe(false);
    });

    it('should return false for expired token', () => {
      const token: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'abc123',
        expiresAt: new Date(Date.now() - 1000),
        isUsed: false,
        createdAt: new Date()
      };

      expect(RSVPTokenModel.isTokenValid(token)).toBe(false);
    });

    it('should return false for used and expired token', () => {
      const token: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'abc123',
        expiresAt: new Date(Date.now() - 1000),
        isUsed: true,
        createdAt: new Date()
      };

      expect(RSVPTokenModel.isTokenValid(token)).toBe(false);
    });
  });
});