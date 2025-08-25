import { TableModel, TableInput, TableUpdate } from '../../models/Table';

describe('TableModel', () => {
  describe('validate', () => {
    const validTableInput: TableInput = {
      eventId: 'event-123',
      name: 'Table 1',
      capacity: 8,
      position: { x: 100, y: 200 }
    };

    it('should validate a valid table input', () => {
      const result = TableModel.validate(validTableInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty event ID', () => {
      const input = { ...validTableInput, eventId: '' };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event ID is required');
    });

    it('should reject empty table name', () => {
      const input = { ...validTableInput, name: '' };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table name is required');
    });

    it('should reject zero capacity', () => {
      const input = { ...validTableInput, capacity: 0 };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table capacity must be greater than 0');
    });

    it('should reject negative capacity', () => {
      const input = { ...validTableInput, capacity: -1 };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table capacity must be greater than 0');
    });

    it('should reject capacity exceeding 20', () => {
      const input = { ...validTableInput, capacity: 21 };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table capacity cannot exceed 20 guests');
    });

    it('should reject invalid position', () => {
      const input = { ...validTableInput, position: { x: 'invalid' as any, y: 200 } };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid table position is required');
    });

    it('should reject negative position coordinates', () => {
      const input = { ...validTableInput, position: { x: -10, y: 200 } };
      const result = TableModel.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table position coordinates must be non-negative');
    });
  });

  describe('validateUpdate', () => {
    it('should validate a valid update', () => {
      const update: TableUpdate = {
        name: 'Updated Table',
        capacity: 10,
        isLocked: true
      };
      
      const result = TableModel.validateUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name in update', () => {
      const update: TableUpdate = { name: '' };
      const result = TableModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table name cannot be empty');
    });

    it('should reject invalid capacity in update', () => {
      const update: TableUpdate = { capacity: 0 };
      const result = TableModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table capacity must be greater than 0');
    });

    it('should reject invalid position in update', () => {
      const update: TableUpdate = { position: { x: -5, y: 10 } };
      const result = TableModel.validateUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table position coordinates must be non-negative');
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace and round position coordinates', () => {
      const input: TableInput = {
        eventId: 'event-123',
        name: '  Table 1  ',
        capacity: 8.7,
        position: { x: 100.567, y: 200.123 }
      };

      const sanitized = TableModel.sanitize(input);
      
      expect(sanitized.name).toBe('Table 1');
      expect(sanitized.capacity).toBe(8); // Should be floored
      expect(sanitized.position.x).toBe(100.57); // Rounded to 2 decimal places
      expect(sanitized.position.y).toBe(200.12); // Rounded to 2 decimal places
    });

    it('should handle exact decimal values', () => {
      const input: TableInput = {
        eventId: 'event-123',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100.50, y: 200.00 }
      };

      const sanitized = TableModel.sanitize(input);
      
      expect(sanitized.position.x).toBe(100.5);
      expect(sanitized.position.y).toBe(200);
    });
  });
});