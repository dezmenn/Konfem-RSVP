import { MockVenueLayoutService } from '../../services/MockVenueLayoutService';
import { VenueElement } from '../../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../../models/VenueElement';

describe('MockVenueLayoutService', () => {
  let service: MockVenueLayoutService;

  beforeEach(() => {
    service = new MockVenueLayoutService();
  });

  describe('initialization', () => {
    it('should initialize with demo data', () => {
      const elements = service.getAllElements();
      expect(elements.length).toBeGreaterThan(0);
      
      // Check that demo elements are present
      const elementTypes = elements.map(e => e.type);
      expect(elementTypes).toContain('stage');
      expect(elementTypes).toContain('dance_floor');
      expect(elementTypes).toContain('bar');
      expect(elementTypes).toContain('entrance');
    });

    it('should have demo elements with valid structure', () => {
      const elements = service.getAllElements();
      
      elements.forEach(element => {
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('type');
        expect(element).toHaveProperty('name');
        expect(element).toHaveProperty('position');
        expect(element).toHaveProperty('dimensions');
        expect(element).toHaveProperty('color');
        expect(element).toHaveProperty('eventId');
        
        expect(typeof element.id).toBe('string');
        expect(typeof element.name).toBe('string');
        expect(typeof element.position.x).toBe('number');
        expect(typeof element.position.y).toBe('number');
        expect(typeof element.dimensions.width).toBe('number');
        expect(typeof element.dimensions.height).toBe('number');
      });
    });
  });

  describe('createElement', () => {
    const validElementData: VenueElementInput = {
      eventId: 'test-event-1',
      type: 'stage',
      name: 'Test Stage',
      position: { x: 100, y: 100 },
      dimensions: { width: 200, height: 100 },
      color: '#FF0000'
    };

    it('should create a new venue element with valid data', async () => {
      const element = await service.createElement(validElementData);
      
      expect(element).toMatchObject({
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 },
        color: '#FF0000',
        eventId: 'test-event-1'
      });
      expect(element.id).toMatch(/^mock-element-\d+$/);
    });

    it('should assign unique IDs to created elements', async () => {
      const element1 = await service.createElement(validElementData);
      const element2 = await service.createElement({
        ...validElementData,
        name: 'Test Stage 2'
      });
      
      expect(element1.id).not.toBe(element2.id);
    });

    it('should sanitize input data', async () => {
      const elementData: VenueElementInput = {
        eventId: 'test-event-1',
        type: 'stage',
        name: '  Test Stage  ',
        position: { x: 100.123456, y: 100.987654 },
        dimensions: { width: 200.555555, height: 100.444444 }
      };

      const element = await service.createElement(elementData);
      
      expect(element.name).toBe('Test Stage');
      expect(element.position.x).toBe(100.12);
      expect(element.position.y).toBe(100.99);
      expect(element.dimensions.width).toBe(200.56);
      expect(element.dimensions.height).toBe(100.44);
      expect(element.color).toBe('#000000'); // Default color
    });

    it('should throw error for invalid data', async () => {
      const invalidData: VenueElementInput = {
        eventId: '',
        type: 'invalid' as any,
        name: '',
        position: { x: -10, y: -20 },
        dimensions: { width: 0, height: -5 },
        color: 'invalid-color'
      };

      await expect(service.createElement(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should handle missing optional color field', async () => {
      const elementData: VenueElementInput = {
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 }
      };

      const element = await service.createElement(elementData);
      expect(element.color).toBe('#000000');
    });
  });

  describe('updateElement', () => {
    let testElement: VenueElement;

    beforeEach(async () => {
      testElement = await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 },
        color: '#FF0000'
      });
    });

    it('should update element with valid data', async () => {
      const updates: VenueElementUpdate = {
        name: 'Updated Stage',
        position: { x: 150, y: 150 },
        color: '#00FF00'
      };

      const updatedElement = await service.updateElement(testElement.id, updates);
      
      expect(updatedElement).toMatchObject({
        id: testElement.id,
        type: 'stage',
        name: 'Updated Stage',
        position: { x: 150, y: 150 },
        dimensions: { width: 200, height: 100 },
        color: '#00FF00',
        eventId: 'test-event-1'
      });
    });

    it('should update only specified fields', async () => {
      const updates: VenueElementUpdate = {
        name: 'Updated Stage'
      };

      const updatedElement = await service.updateElement(testElement.id, updates);
      
      expect(updatedElement.name).toBe('Updated Stage');
      expect(updatedElement.position).toEqual(testElement.position);
      expect(updatedElement.dimensions).toEqual(testElement.dimensions);
      expect(updatedElement.color).toBe(testElement.color);
    });

    it('should throw error for non-existent element', async () => {
      await expect(service.updateElement('non-existent-id', { name: 'Test' }))
        .rejects.toThrow('Venue element not found');
    });

    it('should throw error for invalid update data', async () => {
      const invalidUpdates: VenueElementUpdate = {
        name: '',
        position: { x: -10, y: -20 },
        dimensions: { width: 0, height: -5 },
        color: 'invalid-color'
      };

      await expect(service.updateElement(testElement.id, invalidUpdates))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('deleteElement', () => {
    let testElement: VenueElement;

    beforeEach(async () => {
      testElement = await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 }
      });
    });

    it('should delete existing element', async () => {
      const result = await service.deleteElement(testElement.id);
      expect(result).toBe(true);
      
      // Verify element is deleted
      const elements = service.getAllElements();
      expect(elements.find(e => e.id === testElement.id)).toBeUndefined();
    });

    it('should return false for non-existent element', async () => {
      const result = await service.deleteElement('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getVenueLayout', () => {
    beforeEach(async () => {
      // Clear existing demo data and add test elements
      service.clearAll();
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Stage 1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      });
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'bar',
        name: 'Bar 1',
        position: { x: 200, y: 100 },
        dimensions: { width: 80, height: 40 }
      });
      
      await service.createElement({
        eventId: 'test-event-2',
        type: 'stage',
        name: 'Stage 2',
        position: { x: 50, y: 50 },
        dimensions: { width: 100, height: 50 }
      });
    });

    it('should return elements for specific event', async () => {
      const layout = await service.getVenueLayout('test-event-1');
      
      expect(layout.elements).toHaveLength(2);
      expect(layout.elements.every(e => e.eventId === 'test-event-1')).toBe(true);
      
      const elementNames = layout.elements.map(e => e.name);
      expect(elementNames).toContain('Stage 1');
      expect(elementNames).toContain('Bar 1');
    });

    it('should calculate correct bounds', async () => {
      const layout = await service.getVenueLayout('test-event-1');
      
      expect(layout.bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 280, // 200 + 80
        maxY: 140, // 100 + 40
        width: 280,
        height: 140
      });
    });

    it('should return empty layout for non-existent event', async () => {
      const layout = await service.getVenueLayout('non-existent-event');
      
      expect(layout.elements).toHaveLength(0);
      expect(layout.bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0
      });
    });
  });

  describe('validateVenueLayout', () => {
    beforeEach(() => {
      service.clearAll();
    });

    it('should return valid result for non-overlapping elements', async () => {
      await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Stage 1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 50 }
      });
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'bar',
        name: 'Bar 1',
        position: { x: 200, y: 100 },
        dimensions: { width: 80, height: 40 }
      });

      const validation = await service.validateVenueLayout('test-event-1');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.overlappingElements).toHaveLength(0);
    });

    it('should detect overlapping elements', async () => {
      const element1 = await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Stage 1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 100 }
      });
      
      const element2 = await service.createElement({
        eventId: 'test-event-1',
        type: 'bar',
        name: 'Bar 1',
        position: { x: 50, y: 50 },
        dimensions: { width: 100, height: 100 }
      });

      const validation = await service.validateVenueLayout('test-event-1');
      
      expect(validation.isValid).toBe(true); // Overlaps are warnings, not errors
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0]).toContain('overlapping element pairs');
      expect(validation.overlappingElements).toHaveLength(1);
      
      const overlap = validation.overlappingElements[0];
      expect(overlap.element1.id).toBe(element1.id);
      expect(overlap.element2.id).toBe(element2.id);
      expect(overlap.overlapArea).toEqual({
        position: { x: 50, y: 50 },
        dimensions: { width: 50, height: 50 }
      });
    });

    it('should return valid result for empty layout', async () => {
      const validation = await service.validateVenueLayout('empty-event');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.overlappingElements).toHaveLength(0);
    });
  });

  describe('getElementsByArea', () => {
    beforeEach(async () => {
      service.clearAll();
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Stage 1',
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 100 }
      });
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'bar',
        name: 'Bar 1',
        position: { x: 200, y: 200 },
        dimensions: { width: 80, height: 80 }
      });
      
      await service.createElement({
        eventId: 'test-event-1',
        type: 'dance_floor',
        name: 'Dance Floor 1',
        position: { x: 50, y: 50 },
        dimensions: { width: 100, height: 100 }
      });
    });

    it('should return elements within specified area', async () => {
      const elements = await service.getElementsByArea(
        'test-event-1',
        { x: 0, y: 0 },
        { x: 150, y: 150 }
      );
      
      expect(elements).toHaveLength(2);
      const elementNames = elements.map(e => e.name);
      expect(elementNames).toContain('Stage 1');
      expect(elementNames).toContain('Dance Floor 1');
      expect(elementNames).not.toContain('Bar 1');
    });

    it('should return empty array for area with no elements', async () => {
      const elements = await service.getElementsByArea(
        'test-event-1',
        { x: 500, y: 500 },
        { x: 600, y: 600 }
      );
      
      expect(elements).toHaveLength(0);
    });

    it('should only return elements for specified event', async () => {
      await service.createElement({
        eventId: 'test-event-2',
        type: 'stage',
        name: 'Stage 2',
        position: { x: 10, y: 10 },
        dimensions: { width: 50, height: 50 }
      });

      const elements = await service.getElementsByArea(
        'test-event-1',
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      );
      
      expect(elements.every(e => e.eventId === 'test-event-1')).toBe(true);
    });
  });

  describe('duplicateElement', () => {
    let testElement: VenueElement;

    beforeEach(async () => {
      testElement = await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Original Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 },
        color: '#FF0000'
      });
    });

    it('should duplicate element with default offset', async () => {
      const duplicate = await service.duplicateElement(testElement.id);
      
      expect(duplicate).toMatchObject({
        type: 'stage',
        name: 'Original Stage (Copy)',
        position: { x: 120, y: 120 }, // +20, +20 default offset
        dimensions: { width: 200, height: 100 },
        color: '#FF0000',
        eventId: 'test-event-1'
      });
      expect(duplicate.id).not.toBe(testElement.id);
    });

    it('should duplicate element with custom offset', async () => {
      const duplicate = await service.duplicateElement(testElement.id, { x: 50, y: 30 });
      
      expect(duplicate.position).toEqual({ x: 150, y: 130 });
    });

    it('should throw error for non-existent element', async () => {
      await expect(service.duplicateElement('non-existent-id'))
        .rejects.toThrow('Venue element not found');
    });
  });

  describe('clearAll', () => {
    it('should clear all elements and reinitialize demo data', async () => {
      // Add a test element
      await service.createElement({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 }
      });

      const elementsBeforeClear = service.getAllElements();
      expect(elementsBeforeClear.length).toBeGreaterThan(4); // Demo data + test element

      service.clearAll();

      const elementsAfterClear = service.getAllElements();
      expect(elementsAfterClear.length).toBe(4); // Only demo data
      
      // Verify demo data is restored
      const elementTypes = elementsAfterClear.map(e => e.type);
      expect(elementTypes).toContain('stage');
      expect(elementTypes).toContain('dance_floor');
      expect(elementTypes).toContain('bar');
      expect(elementTypes).toContain('entrance');
    });
  });
});