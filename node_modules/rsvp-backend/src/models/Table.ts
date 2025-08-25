import { Table as TableInterface, Position } from '../../../shared/src/types';

export interface TableInput {
  eventId: string;
  name: string;
  capacity: number;
  position: Position;
}

export interface TableUpdate {
  name?: string;
  capacity?: number;
  position?: Position;
  isLocked?: boolean;
}

export class TableModel {
  static validate(input: TableInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Table name is required');
    }

    if (!input.capacity || input.capacity <= 0) {
      errors.push('Table capacity must be greater than 0');
    }

    if (input.capacity > 20) {
      errors.push('Table capacity cannot exceed 20 guests');
    }

    if (!input.position || typeof input.position.x !== 'number' || typeof input.position.y !== 'number') {
      errors.push('Valid table position is required');
    }

    if (input.position && (input.position.x < 0 || input.position.y < 0)) {
      errors.push('Table position coordinates must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: TableUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.name !== undefined && update.name.trim().length === 0) {
      errors.push('Table name cannot be empty');
    }

    if (update.capacity !== undefined) {
      if (update.capacity <= 0) {
        errors.push('Table capacity must be greater than 0');
      }
      if (update.capacity > 20) {
        errors.push('Table capacity cannot exceed 20 guests');
      }
    }

    if (update.position !== undefined) {
      if (typeof update.position.x !== 'number' || typeof update.position.y !== 'number') {
        errors.push('Valid table position is required');
      }
      if (update.position.x < 0 || update.position.y < 0) {
        errors.push('Table position coordinates must be non-negative');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: TableInput): TableInput {
    return {
      ...input,
      name: input.name.trim(),
      capacity: Math.floor(input.capacity),
      position: {
        x: Math.round(input.position.x * 100) / 100, // Round to 2 decimal places
        y: Math.round(input.position.y * 100) / 100
      }
    };
  }
}