import { InvitationTemplateModel, InvitationTemplateInput, InvitationTemplateUpdate } from '../../models/InvitationTemplate';

describe('InvitationTemplateModel', () => {
  describe('validate', () => {
    const validInput: InvitationTemplateInput = {
      eventId: 'event-123',
      name: 'Wedding Invitation',
      subject: 'You\'re Invited to Our Wedding!',
      content: 'Dear {{guestName}}, please join us for our special day...',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontSize: 16
    };

    it('should validate a valid invitation template input', () => {
      const result = InvitationTemplateModel.validate(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require event ID', () => {
      const input = { ...validInput, eventId: '' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should require template name', () => {
      const input = { ...validInput, name: '' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template name is required');
    });

    it('should require invitation subject', () => {
      const input = { ...validInput, subject: '' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invitation subject is required');
    });

    it('should require invitation content', () => {
      const input = { ...validInput, content: '' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invitation content is required');
    });

    it('should validate content length limit', () => {
      const input = { ...validInput, content: 'a'.repeat(10001) };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invitation content cannot exceed 10000 characters');
    });

    it('should validate background color format', () => {
      const input = { ...validInput, backgroundColor: 'invalid-color' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Background color must be a valid hex color');
    });

    it('should validate text color format', () => {
      const input = { ...validInput, textColor: '#gggggg' };
      const result = InvitationTemplateModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text color must be a valid hex color');
    });

    it('should validate font size range', () => {
      const input1 = { ...validInput, fontSize: 7 };
      const result1 = InvitationTemplateModel.validate(input1);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Font size must be between 8 and 72');

      const input2 = { ...validInput, fontSize: 73 };
      const result2 = InvitationTemplateModel.validate(input2);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Font size must be between 8 and 72');
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: InvitationTemplateUpdate = {
        name: 'Updated Template',
        subject: 'Updated Subject'
      };
      const result = InvitationTemplateModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should not allow empty name in update', () => {
      const update: InvitationTemplateUpdate = { name: '' };
      const result = InvitationTemplateModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template name cannot be empty');
    });

    it('should not allow empty subject in update', () => {
      const update: InvitationTemplateUpdate = { subject: '' };
      const result = InvitationTemplateModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invitation subject cannot be empty');
    });

    it('should not allow empty content in update', () => {
      const update: InvitationTemplateUpdate = { content: '' };
      const result = InvitationTemplateModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invitation content cannot be empty');
    });
  });

  describe('sanitize', () => {
    it('should sanitize input with default values', () => {
      const input: InvitationTemplateInput = {
        eventId: 'event-123',
        name: '  Wedding Invitation  ',
        subject: '  You\'re Invited!  ',
        content: '  Dear guest...  '
      };

      const result = InvitationTemplateModel.sanitize(input);
      
      expect(result.name).toBe('Wedding Invitation');
      expect(result.subject).toBe('You\'re Invited!');
      expect(result.content).toBe('Dear guest...');
      expect(result.backgroundColor).toBe('#ffffff');
      expect(result.textColor).toBe('#333333');
      expect(result.fontFamily).toBe('Arial, sans-serif');
      expect(result.fontSize).toBe(16);
      expect(result.isDefault).toBe(false);
    });

    it('should preserve provided values', () => {
      const input: InvitationTemplateInput = {
        eventId: 'event-123',
        name: 'Custom Template',
        subject: 'Custom Subject',
        content: 'Custom content',
        backgroundColor: '#ff0000',
        textColor: '#000000',
        fontFamily: 'Times New Roman',
        fontSize: 20,
        isDefault: true
      };

      const result = InvitationTemplateModel.sanitize(input);
      
      expect(result.backgroundColor).toBe('#ff0000');
      expect(result.textColor).toBe('#000000');
      expect(result.fontFamily).toBe('Times New Roman');
      expect(result.fontSize).toBe(20);
      expect(result.isDefault).toBe(true);
    });
  });

  describe('createDefaultTemplate', () => {
    it('should create a default template with proper structure', () => {
      const eventId = 'event-123';
      const template = InvitationTemplateModel.createDefaultTemplate(eventId);

      expect(template.eventId).toBe(eventId);
      expect(template.name).toBe('Default Invitation');
      expect(template.subject).toBe('You\'re Invited!');
      expect(template.content).toContain('{{guestName}}');
      expect(template.content).toContain('{{eventTitle}}');
      expect(template.content).toContain('{{eventDate}}');
      expect(template.content).toContain('{{rsvpLink}}');
      expect(template.isDefault).toBe(true);
      expect(template.backgroundColor).toBe('#ffffff');
      expect(template.textColor).toBe('#333333');
    });
  });
});