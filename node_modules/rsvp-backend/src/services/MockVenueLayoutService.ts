import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate, VenueElementModel } from '../models/VenueElement';
import { VenueLayoutService, VenueLayoutValidationResult, VenueLayoutBounds, VenueElementLibraryItem } from './VenueLayoutService';

export class MockVenueLayoutService extends VenueLayoutService {
  private elements: Map<string, VenueElement> = new Map();
  private nextId = 1;

  constructor() {
    // Pass null as we won't use the repository
    super(null as any);
    this.initializeDemoData();
  }

  private initializeDemoData(): void {
    // Add some demo venue elements
    const demoElements: VenueElement[] = [
      {
        id: 'demo-stage-1',
        type: 'stage',
        name: 'Main Stage',
        position: { x: 300, y: 50 },
        dimensions: { width: 200, height: 100 },
        color: '#8B4513',
        eventId: 'demo-event-1'
      },
      {
        id: 'demo-dance-1',
        type: 'dance_floor',
        name: 'Dance Floor',
        position: { x: 250, y: 200 },
        dimensions: { width: 150, height: 150 },
        color: '#FFD700',
        eventId: 'demo-event-1'
      },
      {
        id: 'demo-bar-1',
        type: 'bar',
        name: 'Main Bar',
        position: { x: 50, y: 100 },
        dimensions: { width: 120, height: 60 },
        color: '#654321',
        eventId: 'demo-event-1'
      },
      {
        id: 'demo-entrance-1',
        type: 'entrance',
        name: 'Main Entrance',
        position: { x: 350, y: 400 },
        dimensions: { width: 80, height: 40 },
        color: '#228B22',
        eventId: 'demo-event-1'
      }
    ];

    demoElements.forEach(element => {
      this.elements.set(element.id, element);
    });
  }

  async createElement(elementData: VenueElementInput): Promise<VenueElement> {
    // Validate input
    const validation = VenueElementModel.validate(elementData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize input
    const sanitizedData = VenueElementModel.sanitize(elementData);

    const newElement: VenueElement = {
      id: `mock-element-${this.nextId++}`,
      ...sanitizedData,
      color: sanitizedData.color || '#000000'
    };

    this.elements.set(newElement.id, newElement);
    console.log(`[MOCK] Created venue element: ${newElement.name} (${newElement.type})`);
    
    return newElement;
  }

  async updateElement(id: string, updates: VenueElementUpdate): Promise<VenueElement> {
    const existingElement = this.elements.get(id);
    if (!existingElement) {
      throw new Error('Venue element not found');
    }

    // Validate updates
    const validation = VenueElementModel.validateUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const updatedElement: VenueElement = {
      ...existingElement,
      ...updates
    };

    this.elements.set(id, updatedElement);
    console.log(`[MOCK] Updated venue element: ${updatedElement.name} (${updatedElement.type})`);
    
    return updatedElement;
  }

  async deleteElement(id: string): Promise<boolean> {
    const deleted = this.elements.delete(id);
    if (deleted) {
      console.log(`[MOCK] Deleted venue element: ${id}`);
    }
    return deleted;
  }

  async getVenueLayout(eventId: string): Promise<{
    elements: VenueElement[];
    bounds: VenueLayoutBounds;
  }> {
    const elements = Array.from(this.elements.values())
      .filter(element => element.eventId === eventId);

    if (elements.length === 0) {
      return {
        elements: [],
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
      };
    }

    const minX = Math.min(...elements.map(e => e.position.x));
    const minY = Math.min(...elements.map(e => e.position.y));
    const maxX = Math.max(...elements.map(e => e.position.x + e.dimensions.width));
    const maxY = Math.max(...elements.map(e => e.position.y + e.dimensions.height));

    const bounds: VenueLayoutBounds = {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };

    return { elements, bounds };
  }

  async validateVenueLayout(eventId: string): Promise<VenueLayoutValidationResult> {
    const elements = Array.from(this.elements.values())
      .filter(element => element.eventId === eventId);
    
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

    if (overlappingElements.length > 0) {
      warnings.push(`Found ${overlappingElements.length} overlapping element pairs`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      overlappingElements
    };
  }

  async getElementsByArea(eventId: string, topLeft: Position, bottomRight: Position): Promise<VenueElement[]> {
    return Array.from(this.elements.values())
      .filter(element => 
        element.eventId === eventId &&
        element.position.x < bottomRight.x &&
        element.position.x + element.dimensions.width > topLeft.x &&
        element.position.y < bottomRight.y &&
        element.position.y + element.dimensions.height > topLeft.y
      );
  }

  async duplicateElement(id: string, offset: Position = { x: 20, y: 20 }): Promise<VenueElement> {
    const originalElement = this.elements.get(id);
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



  // Clear all elements (for testing)
  clearAll(): void {
    this.elements.clear();
    this.initializeDemoData();
  }

  // Get all elements (for testing)
  getAllElements(): VenueElement[] {
    return Array.from(this.elements.values());
  }
}