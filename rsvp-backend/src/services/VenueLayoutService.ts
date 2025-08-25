import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate, VenueElementModel } from '../models/VenueElement';
import { VenueElementRepository } from '../repositories/VenueElementRepository';

export interface VenueLayoutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  overlappingElements: Array<{
    element1: VenueElement;
    element2: VenueElement;
    overlapArea: { position: Position; dimensions: Dimensions };
  }>;
}

export interface VenueLayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface VenueElementLibraryItem {
  type: VenueElement['type'];
  name: string;
  defaultDimensions: Dimensions;
  defaultColor: string;
  description: string;
  icon?: string;
}

export class VenueLayoutService {
  private venueElementRepository: VenueElementRepository;

  // Predefined venue element library
  private static readonly ELEMENT_LIBRARY: VenueElementLibraryItem[] = [
    {
      type: 'stage',
      name: 'Stage',
      defaultDimensions: { width: 200, height: 100 },
      defaultColor: '#8B4513',
      description: 'Main stage or altar area',
      icon: '🎭'
    },
    {
      type: 'dance_floor',
      name: 'Dance Floor',
      defaultDimensions: { width: 150, height: 150 },
      defaultColor: '#FFD700',
      description: 'Dance floor area',
      icon: '💃'
    },
    {
      type: 'bar',
      name: 'Bar',
      defaultDimensions: { width: 120, height: 60 },
      defaultColor: '#654321',
      description: 'Bar or beverage station',
      icon: '🍸'
    },
    {
      type: 'entrance',
      name: 'Entrance',
      defaultDimensions: { width: 80, height: 40 },
      defaultColor: '#228B22',
      description: 'Main entrance or doorway',
      icon: '🚪'
    },
    {
      type: 'walkway',
      name: 'Walkway',
      defaultDimensions: { width: 200, height: 40 },
      defaultColor: '#D3D3D3',
      description: 'Walkway or aisle',
      icon: '🛤️'
    },
    {
      type: 'decoration',
      name: 'Decoration',
      defaultDimensions: { width: 60, height: 60 },
      defaultColor: '#FF69B4',
      description: 'Decorative element',
      icon: '🌸'
    },
    {
      type: 'custom',
      name: 'Custom Element',
      defaultDimensions: { width: 100, height: 100 },
      defaultColor: '#808080',
      description: 'Custom venue element',
      icon: '📦'
    }
  ];

  constructor(venueElementRepository: VenueElementRepository) {
    this.venueElementRepository = venueElementRepository;
  }

  async createElement(elementData: VenueElementInput): Promise<VenueElement> {
    // Validate input
    const validation = VenueElementModel.validate(elementData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize input
    const sanitizedData = VenueElementModel.sanitize(elementData);

    // Check for overlaps
    const overlaps = await this.venueElementRepository.checkOverlap(
      sanitizedData.eventId,
      sanitizedData.position,
      sanitizedData.dimensions
    );

    if (overlaps.length > 0) {
      console.warn(`Element will overlap with ${overlaps.length} existing elements`);
    }

    return await this.venueElementRepository.create(sanitizedData);
  }

  async updateElement(id: string, updates: VenueElementUpdate): Promise<VenueElement> {
    // Validate updates
    const validation = VenueElementModel.validateUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for overlaps if position or dimensions are being updated
    if (updates.position || updates.dimensions) {
      const existingElement = await this.venueElementRepository.findById(id);
      if (!existingElement) {
        throw new Error('Venue element not found');
      }

      const newPosition = updates.position || existingElement.position;
      const newDimensions = updates.dimensions || existingElement.dimensions;

      const overlaps = await this.venueElementRepository.checkOverlap(
        existingElement.eventId,
        newPosition,
        newDimensions,
        id
      );

      if (overlaps.length > 0) {
        console.warn(`Element will overlap with ${overlaps.length} existing elements after update`);
      }
    }

    const updatedElement = await this.venueElementRepository.update(id, updates);
    if (!updatedElement) {
      throw new Error('Venue element not found');
    }

    return updatedElement;
  }

  async deleteElement(id: string): Promise<boolean> {
    return await this.venueElementRepository.delete(id);
  }

  async getVenueLayout(eventId: string): Promise<{
    elements: VenueElement[];
    bounds: VenueLayoutBounds;
  }> {
    const layout = await this.venueElementRepository.getVenueLayout(eventId);
    
    const bounds: VenueLayoutBounds = {
      ...layout.bounds,
      width: layout.bounds.maxX - layout.bounds.minX,
      height: layout.bounds.maxY - layout.bounds.minY
    };

    return {
      elements: layout.elements,
      bounds
    };
  }

  async validateVenueLayout(eventId: string): Promise<VenueLayoutValidationResult> {
    const elements = await this.venueElementRepository.findByEventId(eventId);
    const errors: string[] = [];
    const warnings: string[] = [];
    const overlappingElements: VenueLayoutValidationResult['overlappingElements'] = [];

    // Check for overlaps between all elements
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const element1 = elements[i];
        const element2 = elements[j];

        const overlap = this.calculateOverlap(element1, element2);
        if (overlap) {
          overlappingElements.push({
            element1,
            element2,
            overlapArea: overlap
          });
        }
      }
    }

    // Add warnings for overlaps
    if (overlappingElements.length > 0) {
      warnings.push(`Found ${overlappingElements.length} overlapping element pairs`);
    }

    // Check for elements outside reasonable bounds
    const bounds = this.calculateLayoutBounds(elements);
    if (bounds.width > 2000 || bounds.height > 2000) {
      warnings.push('Venue layout is very large, consider scaling down');
    }

    // Check for very small elements
    const smallElements = elements.filter(e => 
      e.dimensions.width < 20 || e.dimensions.height < 20
    );
    if (smallElements.length > 0) {
      warnings.push(`${smallElements.length} elements are very small and may be hard to see`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      overlappingElements
    };
  }

  async getElementsByArea(eventId: string, topLeft: Position, bottomRight: Position): Promise<VenueElement[]> {
    return await this.venueElementRepository.getElementsByArea(eventId, topLeft, bottomRight);
  }

  async duplicateElement(id: string, offset: Position = { x: 20, y: 20 }): Promise<VenueElement> {
    const originalElement = await this.venueElementRepository.findById(id);
    if (!originalElement) {
      throw new Error('Venue element not found');
    }

    const duplicateData: VenueElementInput = {
      eventId: originalElement.eventId,
      type: originalElement.type,
      name: `${originalElement.name} (Copy)`,
      position: {
        x: originalElement.position.x + offset.x,
        y: originalElement.position.y + offset.y
      },
      dimensions: originalElement.dimensions,
      color: originalElement.color
    };

    return await this.createElement(duplicateData);
  }

  getElementLibrary(): VenueElementLibraryItem[] {
    return [...VenueLayoutService.ELEMENT_LIBRARY];
  }

  createElementFromLibrary(
    eventId: string,
    libraryType: VenueElement['type'],
    position: Position,
    customName?: string
  ): VenueElementInput {
    const libraryItem = VenueLayoutService.ELEMENT_LIBRARY.find(item => item.type === libraryType);
    if (!libraryItem) {
      throw new Error(`Unknown element type: ${libraryType}`);
    }

    return {
      eventId,
      type: libraryItem.type,
      name: customName || libraryItem.name,
      position,
      dimensions: libraryItem.defaultDimensions,
      color: libraryItem.defaultColor
    };
  }

  protected calculateOverlap(element1: VenueElement, element2: VenueElement): { position: Position; dimensions: Dimensions } | null {
    const left = Math.max(element1.position.x, element2.position.x);
    const right = Math.min(
      element1.position.x + element1.dimensions.width,
      element2.position.x + element2.dimensions.width
    );
    const top = Math.max(element1.position.y, element2.position.y);
    const bottom = Math.min(
      element1.position.y + element1.dimensions.height,
      element2.position.y + element2.dimensions.height
    );

    if (left < right && top < bottom) {
      return {
        position: { x: left, y: top },
        dimensions: { width: right - left, height: bottom - top }
      };
    }

    return null;
  }

  private calculateLayoutBounds(elements: VenueElement[]): VenueLayoutBounds {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...elements.map(e => e.position.x));
    const minY = Math.min(...elements.map(e => e.position.y));
    const maxX = Math.max(...elements.map(e => e.position.x + e.dimensions.width));
    const maxY = Math.max(...elements.map(e => e.position.y + e.dimensions.height));

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}