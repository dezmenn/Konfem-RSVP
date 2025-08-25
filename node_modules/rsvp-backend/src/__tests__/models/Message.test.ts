import { MessageModel, MessageInput, MessageUpdate } from '../../models/Message';

describe('MessageModel', () => {
  describe('validate', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future
    
    const validMessageInput: MessageInput = {
      eventId: 'event-123',
      recipientId: 'guest-123',
      content: 'You are invited to our wedding celebration!',
      messageType: 'invitation',
      scheduledAt: futureDate
    };

    it('should validate a valid message input', () => {
      const result = MessageModel.validate(validMessageInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty event ID', () => {
      const input = { ...validMessageInput, eventId: '' };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should reject empty recipient ID', () => {
      const input = { ...validMessageInput, recipientId: '' };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Recipient ID is required');
    });

    it('should reject empty content', () => {
      const input = { ...validMessageInput, content: '' };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content is required');
    });

    it('should reject content exceeding 4096 characters', () => {
      const longContent = 'a'.repeat(4097);
      const input = { ...validMessageInput, content: longContent };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot exceed 4096 characters');
    });

    it('should reject invalid message type', () => {
      const input = { ...validMessageInput, messageType: 'invalid' as 'invitation' };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid message type. Must be one of: invitation, reminder, confirmation');
    });

    it('should reject invalid scheduled date', () => {
      const input = { ...validMessageInput, scheduledAt: new Date('invalid') };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scheduled date must be a valid date');
    });

    it('should reject past scheduled date', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      
      const input = { ...validMessageInput, scheduledAt: pastDate };
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scheduled date must be in the future');
    });

    it('should accept valid message types', () => {
      const messageTypes = ['invitation', 'reminder', 'confirmation'];
      
      messageTypes.forEach(messageType => {
        const input = { ...validMessageInput, messageType: messageType as 'invitation' };
        const result = MessageModel.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    it('should accept message without scheduled date', () => {
      const input = { ...validMessageInput };
      delete input.scheduledAt;
      
      const result = MessageModel.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: MessageUpdate = {
        content: 'Updated message content',
        deliveryStatus: 'sent',
        sentAt: new Date()
      };
      
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty content in update', () => {
      const update: MessageUpdate = { content: '' };
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot be empty');
    });

    it('should reject content exceeding 4096 characters in update', () => {
      const longContent = 'a'.repeat(4097);
      const update: MessageUpdate = { content: longContent };
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot exceed 4096 characters');
    });

    it('should reject invalid delivery status', () => {
      const update: MessageUpdate = { deliveryStatus: 'invalid' as 'pending' };
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid delivery status. Must be one of: pending, sent, delivered, failed');
    });

    it('should accept valid delivery statuses', () => {
      const statuses = ['pending', 'sent', 'delivered', 'failed'];
      
      statuses.forEach(deliveryStatus => {
        const update: MessageUpdate = { deliveryStatus: deliveryStatus as 'pending' };
        const result = MessageModel.validateUpdate(update);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid scheduled date in update', () => {
      const update: MessageUpdate = { scheduledAt: new Date('invalid') };
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scheduled date must be a valid date');
    });

    it('should reject invalid sent date in update', () => {
      const update: MessageUpdate = { sentAt: new Date('invalid') };
      const result = MessageModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sent date must be a valid date');
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace from content', () => {
      const input: MessageInput = {
        eventId: 'event-123',
        recipientId: 'guest-123',
        content: '  You are invited to our wedding celebration!  ',
        messageType: 'invitation'
      };

      const sanitized = MessageModel.sanitize(input);
      
      expect(sanitized.content).toBe('You are invited to our wedding celebration!');
    });

    it('should preserve other properties', () => {
      const input: MessageInput = {
        eventId: 'event-123',
        recipientId: 'guest-123',
        content: 'Message content',
        messageType: 'reminder',
        scheduledAt: new Date('2025-07-01T10:00:00Z')
      };

      const sanitized = MessageModel.sanitize(input);
      
      expect(sanitized.eventId).toBe('event-123');
      expect(sanitized.recipientId).toBe('guest-123');
      expect(sanitized.messageType).toBe('reminder');
      expect(sanitized.scheduledAt).toEqual(new Date('2025-07-01T10:00:00Z'));
    });
  });
});