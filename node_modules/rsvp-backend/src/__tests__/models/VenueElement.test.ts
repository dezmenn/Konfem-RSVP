import { VenueElementModel, VenueElementInput, VenueElementUpdate } from '../../models/VenueElement';

describe('VenueElementModel', () => {
  describe('validate', () => {
    const validVenueElementInput: VenueElementInput = {
      eventId: 'event-123',
      type: 'stage',
      name: 'Main Stage',
      position: { x: 100, y: 200 },
      dimensions: { width: 150, height: 100 },
      color: '#FF0000'
    };

    it('should validate a valid venue element input', () => {
      const result = VenueElementModel.validate(validVenueElementInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty event ID', () => {
      const input = { ...validVenueElementInput, eventId: '' };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should reject empty name', () => {
      const input = { ...validVenueElementInput, name: '' };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Venue element name is required');
    });

    it('should reject invalid type', () => {
      const input = { ...validVenueElementInput, type: 'invalid' as 'stage' };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid venue element type. Must be one of: stage, walkway, decoration, entrance, bar, dance_floor, custom');
    });

    it('should accept all valid types', () => {
      const validTypes = ['stage', 'walkway', 'decoration', 'entrance', 'bar', 'dance_floor', 'custom'];
      
      validTypes.forEach(type => {
        const input = { ...validVenueElementInput, type: type as 'stage' };
        const result = VenueElementModel.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid position', () => {
      const input = { ...validVenueElementInput, position: { x: 'invalid' as any, y: 200 } };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid position is required');
    });

    it('should reject negative position coordinates', () => {
      const input = { ...validVenueElementInput, position: { x: -10, y: 200 } };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Position coordinates must be non-negative');
    });

    it('should reject invalid dimensions', () => {
      const input = { ...validVenueElementInput, dimensions: { width: 'invalid' as any, height: 100 } };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid dimensions are required');
    });

    it('should reject zero or negative dimensions', () => {
      const input1 = { ...validVenueElementInput, dimensions: { width: 0, height: 100 } };
      const result1 = VenueElementModel.validate(input1);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Dimensions must be positive values');

      const input2 = { ...validVenueElementInput, dimensions: { width: 100, height: -50 } };
      const result2 = VenueElementModel.validate(input2);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Dimensions must be positive values');
    });

    it('should reject invalid color format', () => {
      const input = { ...validVenueElementInput, color: 'invalid-color' };
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Color must be a valid hex color code (e.g., #FF0000)');
    });

    it('should accept valid color formats', () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#123ABC'];
      
      validColors.forEach(color => {
        const input = { ...validVenueElementInput, color };
        const result = VenueElementModel.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    it('should accept input without color (optional)', () => {
      const input = { ...validVenueElementInput };
      delete input.color;
      
      const result = VenueElementModel.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: VenueElementUpdate = {
        name: 'Updated Stage',
        type: 'dance_floor',
        color: '#00FF00'
      };
      
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name in update', () => {
      const update: VenueElementUpdate = { name: '' };
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Venue element name cannot be empty');
    });

    it('should reject invalid type in update', () => {
      const update: VenueElementUpdate = { type: 'invalid' as 'stage' };
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid venue element type. Must be one of: stage, walkway, decoration, entrance, bar, dance_floor, custom');
    });

    it('should reject invalid position in update', () => {
      const update: VenueElementUpdate = { position: { x: -5, y: 10 } };
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Position coordinates must be non-negative');
    });

    it('should reject invalid dimensions in update', () => {
      const update: VenueElementUpdate = { dimensions: { width: 0, height: 50 } };
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dimensions must be positive values');
    });

    it('should reject invalid color in update', () => {
      const update: VenueElementUpdate = { color: 'not-a-hex-color' };
      const result = VenueElementModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Color must be a valid hex color code (e.g., #FF0000)');
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace and set default color', () => {
      const input: VenueElementInput = {
        eventId: 'event-123',
        type: 'stage',
        name: '  Main Stage  ',
        position: { x: 100.567, y: 200.123 },
        dimensions: { width: 150.789, height: 100.456 }
      };

      const sanitized = VenueElementModel.sanitize(input);
      
      expect(sanitized.name).toBe('Main Stage');
      expect(sanitized.color).toBe('#000000'); // Default color
      expect(sanitized.position.x).toBe(100.57); // Rounded to 2 decimal places
      expect(sanitized.position.y).toBe(200.12);
      expect(sanitized.dimensions.width).toBe(150.79);
      expect(sanitized.dimensions.height).toBe(100.46);
    });

    it('should preserve provided color', () => {
      const input: VenueElementInput = {
        eventId: 'event-123',
        type: 'bar',
        name: 'Main Bar',
        position: { x: 50, y: 100 },
        dimensions: { width: 80, height: 40 },
        color: '#FF0000'
      };

      const sanitized = VenueElementModel.sanitize(input);
      
      expect(sanitized.color).toBe('#FF0000');
    });

    it('should handle exact decimal values', () => {
      const input: VenueElementInput = {
        eventId: 'event-123',
        type: 'entrance',
        name: 'Main Entrance',
        position: { x: 100.50, y: 200.00 },
        dimensions: { width: 80.00, height: 30.50 }
      };

      const sanitized = VenueElementModel.sanitize(input);
      
      expect(sanitized.position.x).toBe(100.5);
      expect(sanitized.position.y).toBe(200);
      expect(sanitized.dimensions.width).toBe(80);
      expect(sanitized.dimensions.height).toBe(30.5);
    });
  });
});