import { ReminderScheduleModel, ReminderScheduleInput, ReminderScheduleUpdate } from '../../models/ReminderSchedule';

describe('ReminderScheduleModel', () => {
  describe('validate', () => {
    it('should validate a valid reminder schedule input', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: 'Hello {{guestName}}, please RSVP for {{eventTitle}}',
        isActive: true
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject input with missing eventId', () => {
      const input: ReminderScheduleInput = {
        eventId: '',
        triggerDays: 7,
        messageTemplate: 'Hello {{guestName}}, please RSVP for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should reject input with missing triggerDays', () => {
      const input: any = {
        eventId: 'event-123',
        messageTemplate: 'Hello {{guestName}}, please RSVP for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trigger days is required');
    });

    it('should reject input with negative triggerDays', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: -1,
        messageTemplate: 'Hello {{guestName}}, please RSVP for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trigger days must be non-negative');
    });

    it('should reject input with triggerDays exceeding 365', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 400,
        messageTemplate: 'Hello {{guestName}}, please RSVP for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trigger days cannot exceed 365 days');
    });

    it('should reject input with empty messageTemplate', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: ''
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message template is required');
    });

    it('should reject input with messageTemplate exceeding 4096 characters', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: 'a'.repeat(4097)
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message template cannot exceed 4096 characters');
    });

    it('should accept triggerDays of 0', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 0,
        messageTemplate: 'Final reminder for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept triggerDays of 365', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 365,
        messageTemplate: 'Save the date for {{eventTitle}}'
      };

      const result = ReminderScheduleModel.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: ReminderScheduleUpdate = {
        triggerDays: 14,
        messageTemplate: 'Updated reminder for {{eventTitle}}',
        isActive: false
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject update with negative triggerDays', () => {
      const update: ReminderScheduleUpdate = {
        triggerDays: -5
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trigger days must be non-negative');
    });

    it('should reject update with triggerDays exceeding 365', () => {
      const update: ReminderScheduleUpdate = {
        triggerDays: 400
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trigger days cannot exceed 365 days');
    });

    it('should reject update with empty messageTemplate', () => {
      const update: ReminderScheduleUpdate = {
        messageTemplate: '   '
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message template cannot be empty');
    });

    it('should reject update with messageTemplate exceeding 4096 characters', () => {
      const update: ReminderScheduleUpdate = {
        messageTemplate: 'a'.repeat(4097)
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message template cannot exceed 4096 characters');
    });

    it('should allow partial updates', () => {
      const update: ReminderScheduleUpdate = {
        isActive: false
      };

      const result = ReminderScheduleModel.validateUpdate(update);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitize', () => {
    it('should trim messageTemplate and set default isActive', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: '  Hello {{guestName}}  '
      };

      const sanitized = ReminderScheduleModel.sanitize(input);

      expect(sanitized.messageTemplate).toBe('Hello {{guestName}}');
      expect(sanitized.isActive).toBe(true);
    });

    it('should preserve explicit isActive value', () => {
      const input: ReminderScheduleInput = {
        eventId: 'event-123',
        triggerDays: 7,
        messageTemplate: 'Hello {{guestName}}',
        isActive: false
      };

      const sanitized = ReminderScheduleModel.sanitize(input);

      expect(sanitized.isActive).toBe(false);
    });
  });

  describe('getDefaultTemplate', () => {
    it('should return a default template with placeholders', () => {
      const template = ReminderScheduleModel.getDefaultTemplate();

      expect(template).toContain('{{guestName}}');
      expect(template).toContain('{{eventTitle}}');
      expect(template).toContain('{{eventDate}}');
      expect(template).toContain('{{eventLocation}}');
      expect(template).toContain('{{rsvpDeadline}}');
      expect(template).toContain('{{rsvpLink}}');
      expect(template).toContain('{{organizerName}}');
    });

    it('should return a non-empty template', () => {
      const template = ReminderScheduleModel.getDefaultTemplate();

      expect(template.length).toBeGreaterThan(0);
      expect(template.trim()).not.toBe('');
    });
  });
});