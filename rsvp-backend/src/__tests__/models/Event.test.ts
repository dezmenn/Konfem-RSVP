import { EventModel, EventInput, EventUpdate } from '../../models/Event';

describe('EventModel', () => {
  describe('validate', () => {
    const validEventInput: EventInput = {
      title: 'Wedding Celebration',
      description: 'Join us for our special day',
      date: new Date('2026-08-15T18:00:00Z'),
      location: 'Grand Ballroom, Elegant Hotel',
      rsvpDeadline: new Date('2026-07-15T23:59:59Z'),
      organizerId: 'organizer-123',
      publicRSVPEnabled: true
    };

    it('should validate a valid event input', () => {
      const result = EventModel.validate(validEventInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title', () => {
      const input = { ...validEventInput, title: '' };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event title is required');
    });

    it('should reject empty location', () => {
      const input = { ...validEventInput, location: '' };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event location is required');
    });

    it('should reject empty organizer ID', () => {
      const input = { ...validEventInput, organizerId: '' };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Organizer ID is required');
    });

    it('should reject invalid event date', () => {
      const input = { ...validEventInput, date: new Date('invalid') };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid event date is required');
    });

    it('should reject invalid RSVP deadline', () => {
      const input = { ...validEventInput, rsvpDeadline: new Date('invalid') };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid RSVP deadline is required');
    });

    it('should reject RSVP deadline after event date', () => {
      const input = {
        ...validEventInput,
        date: new Date('2026-07-15T18:00:00Z'),
        rsvpDeadline: new Date('2026-08-15T23:59:59Z')
      };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('RSVP deadline must be before the event date');
    });

    it('should reject past RSVP deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const input = { ...validEventInput, rsvpDeadline: pastDate };
      const result = EventModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('RSVP deadline must be in the future');
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: EventUpdate = {
        title: 'Updated Wedding Celebration',
        publicRSVPEnabled: false
      };
      
      const result = EventModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title in update', () => {
      const update: EventUpdate = { title: '' };
      const result = EventModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event title cannot be empty');
    });

    it('should reject empty location in update', () => {
      const update: EventUpdate = { location: '' };
      const result = EventModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event location cannot be empty');
    });

    it('should reject invalid date in update', () => {
      const update: EventUpdate = { date: new Date('invalid') };
      const result = EventModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid event date is required');
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace and set defaults', () => {
      const input: EventInput = {
        title: '  Wedding Celebration  ',
        description: '  Join us for our special day  ',
        date: new Date('2025-08-15T18:00:00Z'),
        location: '  Grand Ballroom, Elegant Hotel  ',
        rsvpDeadline: new Date('2025-07-15T23:59:59Z'),
        organizerId: 'organizer-123'
      };

      const sanitized = EventModel.sanitize(input);
      
      expect(sanitized.title).toBe('Wedding Celebration');
      expect(sanitized.description).toBe('Join us for our special day');
      expect(sanitized.location).toBe('Grand Ballroom, Elegant Hotel');
      expect(sanitized.publicRSVPEnabled).toBe(false);
    });

    it('should preserve provided values', () => {
      const input: EventInput = {
        title: 'Wedding Celebration',
        description: 'Join us for our special day',
        date: new Date('2025-08-15T18:00:00Z'),
        location: 'Grand Ballroom, Elegant Hotel',
        rsvpDeadline: new Date('2025-07-15T23:59:59Z'),
        organizerId: 'organizer-123',
        publicRSVPEnabled: true
      };

      const sanitized = EventModel.sanitize(input);
      
      expect(sanitized.publicRSVPEnabled).toBe(true);
      expect(sanitized.description).toBe('Join us for our special day');
    });
  });

  describe('generatePublicRSVPLink', () => {
    it('should generate correct public RSVP link', () => {
      const eventId = 'event-123';
      const link = EventModel.generatePublicRSVPLink(eventId);
      expect(link).toBe('http://localhost:3000/rsvp/public/event-123');
    });

    it('should use BASE_URL environment variable when available', () => {
      const originalBaseUrl = process.env.BASE_URL;
      process.env.BASE_URL = 'https://example.com';
      
      const eventId = 'event-123';
      const link = EventModel.generatePublicRSVPLink(eventId);
      expect(link).toBe('https://example.com/rsvp/public/event-123');
      
      // Restore original value
      process.env.BASE_URL = originalBaseUrl;
    });
  });
});