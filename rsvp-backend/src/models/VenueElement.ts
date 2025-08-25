import { VenueElement as VenueElementInterface, Position, Dimensions } from '../../../shared/src/types';

export interface VenueElementInput {
  eventId: string;
  type: 'stage' | 'walkway' | 'decoration' | 'entrance' | 'bar' | 'dance_floor' | 'custom';
  name: string;
  position: Position;
  dimensions: Dimensions;
  color?: string;
}

export interface VenueElementUpdate {
  type?: 'stage' | 'walkway' | 'decoration' | 'entrance' | 'bar' | 'dance_floor' | 'custom';
  name?: string;
  position?: Position;
  dimensions?: Dimensions;
  color?: string;
}

export class VenueElementModel {
  static readonly VALID_TYPES = ['stage', 'walkway', 'decoration', 'entrance', 'bar', 'dance_floor', 'custom'] as const;

  static validate(input: VenueElementInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Venue element name is required');
    }

    if (!this.VALID_TYPES.includes(input.type)) {
      errors.push(`Invalid venue element type. Must be one of: ${this.VALID_TYPES.join(', ')}`);
    }

    if (!input.position || typeof input.position.x !== 'number' || typeof input.position.y !== 'number') {
      errors.push('Valid position is required');
    }

    if (input.position && (input.position.x < 0 || input.position.y < 0)) {
      errors.push('Position coordinates must be non-negative');
    }

    if (!input.dimensions || typeof input.dimensions.width !== 'number' || typeof input.dimensions.height !== 'number') {
      errors.push('Valid dimensions are required');
    }

    if (input.dimensions && (input.dimensions.width <= 0 || input.dimensions.height <= 0)) {
      errors.push('Dimensions must be positive values');
    }

    if (input.color && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: VenueElementUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.name !== undefined && update.name.trim().length === 0) {
      errors.push('Venue element name cannot be empty');
    }

    if (update.type !== undefined && !this.VALID_TYPES.includes(update.type)) {
      errors.push(`Invalid venue element type. Must be one of: ${this.VALID_TYPES.join(', ')}`);
    }

    if (update.position !== undefined) {
      if (typeof update.position.x !== 'number' || typeof update.position.y !== 'number') {
        errors.push('Valid position is required');
      }
      if (update.position.x < 0 || update.position.y < 0) {
        errors.push('Position coordinates must be non-negative');
      }
    }

    if (update.dimensions !== undefined) {
      if (typeof update.dimensions.width !== 'number' || typeof update.dimensions.height !== 'number') {
        errors.push('Valid dimensions are required');
      }
      if (update.dimensions.width <= 0 || update.dimensions.height <= 0) {
        errors.push('Dimensions must be positive values');
      }
    }

    if (update.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(update.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: VenueElementInput): VenueElementInput {
    return {
      ...input,
      name: input.name.trim(),
      color: input.color || '#000000',
      position: {
        x: Math.round(input.position.x * 100) / 100,
        y: Math.round(input.position.y * 100) / 100
      },
      dimensions: {
        width: Math.round(input.dimensions.width * 100) / 100,
        height: Math.round(input.dimensions.height * 100) / 100
      }
    };
  }
}