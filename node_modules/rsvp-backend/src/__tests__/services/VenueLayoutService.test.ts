import { VenueLayoutService } from '../../services/VenueLayoutService';
import { VenueElementRepository } from '../../repositories/VenueElementRepository';
import { VenueElement } from '../../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../../models/VenueElement';

// Mock the repository
jest.mock('../../repositories/VenueElementRepository');

describe('VenueLayoutService', () => {
  let service: VenueLayoutService;
  let mockRepository: jest.Mocked<VenueElementRepository>;

  const mockElement: VenueElement = {
    id: 'test-element-1',
    type: 'stage',
    name: 'Test Stage',
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 100 },
    color: '#8B4513',
    eventId: 'test-event-1'
  };

  beforeEach(() => {
    mockRepository = new VenueElementRepository() as jest.Mocked<VenueElementRepository>;
    service = new VenueLayoutService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createElement', () => {
    it('should create a valid venue element', async () => {
      const elementData: VenueElementInput = {
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 },
        color: '#8B4513'
      };

      mockRepository.checkOverlap.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(mockElement);

      const result = await service.createElement(elementData);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'test-event-1',
          type: 'stage',
          name: 'Test Stage',
          position: { x: 100, y: 100 },
          dimensions: { width: 200, height: 100 },
          color: '#8B4513'
        })
      );
      expect(result).toEqual(mockElement);
    });

    it('should throw error for invalid element data', async () => {
      const invalidElementData: VenueElementInput = {
        eventId: '',
        type: 'stage',
        name: '',
        position: { x: -10, y: -10 },
        dimensions: { width: 0, height: 0 },
        color: 'invalid-color'
      };

      await expect(service.createElement(invalidElementData)).rejects.toThrow('Validation failed');
    });

    it('should warn about overlapping elements', async () => {
      const elementData: VenueElementInput = {
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Test Stage',
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 100 },
        color: '#8B4513'
      };

      const overlappingElement: VenueElement = {
        id: 'overlapping-element',
        type: 'bar',
        name: 'Overlapping Bar',
        position: { x: 150, y: 120 },
        dimensions: { width: 100, height: 80 },
        color: '#654321',
        eventId: 'test-event-1'
      };

      mockRepository.checkOverlap.mockResolvedValue([overlappingElement]);
      mockRepository.create.mockResolvedValue(mockElement);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await service.createElement(elementData);

      expect(consoleSpy).toHaveBeenCalledWith('Element will overlap with 1 existing elements');
      expect(result).toEqual(mockElement);

      consoleSpy.mockRestore();
    });
  });

  describe('updateElement', () => {
    it('should update an existing element', async () => {
      const updates: VenueElementUpdate = {
        name: 'Updated Stage',
        position: { x: 150, y: 150 },
        color: '#FF0000'
      };

      mockRepository.findById.mockResolvedValue(mockElement);
      mockRepository.checkOverlap.mockResolvedValue([]);
      mockRepository.update.mockResolvedValue({ ...mockElement, ...updates });

      const result = await service.updateElement('test-element-1', updates);

      expect(mockRepository.update).toHaveBeenCalledWith('test-element-1', updates);
      expect(result).toEqual({ ...mockElement, ...updates });
    });

    it('should throw error when element not found', async () => {
      const updates: VenueElementUpdate = { name: 'Updated Stage' };

      mockRepository.update.mockResolvedValue(null);

      await expect(service.updateElement('non-existent', updates)).rejects.toThrow('Venue element not found');
    });

    it('should check for overlaps when updating position or dimensions', async () => {
      const updates: VenueElementUpdate = {
        position: { x: 200, y: 200 },
        dimensions: { width: 300, height: 150 }
      };

      mockRepository.findById.mockResolvedValue(mockElement);
      mockRepository.checkOverlap.mockResolvedValue([]);
      mockRepository.update.mockResolvedValue({ ...mockElement, ...updates });

      await service.updateElement('test-element-1', updates);

      expect(mockRepository.checkOverlap).toHaveBeenCalledWith(
        'test-event-1',
        { x: 200, y: 200 },
        { width: 300, height: 150 },
        'test-element-1'
      );
    });
  });

  describe('deleteElement', () => {
    it('should delete an element', async () => {
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.deleteElement('test-element-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('test-element-1');
      expect(result).toBe(true);
    });

    it('should return false when element not found', async () => {
      mockRepository.delete.mockResolvedValue(false);

      const result = await service.deleteElement('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getVenueLayout', () => {
    it('should return venue layout with bounds', async () => {
      const elements: VenueElement[] = [
        mockElement,
        {
          id: 'test-element-2',
          type: 'bar' as const,
          name: 'Test Bar',
          position: { x: 400, y: 300 },
          dimensions: { width: 120, height: 60 },
          color: '#654321',
          eventId: 'test-event-1'
        }
      ];

      mockRepository.getVenueLayout.mockResolvedValue({
        elements,
        bounds: { minX: 100, minY: 100, maxX: 520, maxY: 360 }
      });

      const result = await service.getVenueLayout('test-event-1');

      expect(result.elements).toEqual(elements);
      expect(result.bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 520,
        maxY: 360,
        width: 420,
        height: 260
      });
    });

    it('should handle empty venue layout', async () => {
      mockRepository.getVenueLayout.mockResolvedValue({
        elements: [],
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
      });

      const result = await service.getVenueLayout('test-event-1');

      expect(result.elements).toEqual([]);
      expect(result.bounds).toEqual({
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
    it('should validate layout without overlaps', async () => {
      const elements: VenueElement[] = [
        mockElement,
        {
          id: 'test-element-2',
          type: 'bar' as const,
          name: 'Test Bar',
          position: { x: 400, y: 300 },
          dimensions: { width: 120, height: 60 },
          color: '#654321',
          eventId: 'test-event-1'
        }
      ];

      mockRepository.findByEventId.mockResolvedValue(elements);

      const result = await service.validateVenueLayout('test-event-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.overlappingElements).toHaveLength(0);
    });

    it('should detect overlapping elements', async () => {
      const elements: VenueElement[] = [
        mockElement,
        {
          id: 'test-element-2',
          type: 'bar' as const,
          name: 'Overlapping Bar',
          position: { x: 150, y: 120 },
          dimensions: { width: 100, height: 80 },
          color: '#654321',
          eventId: 'test-event-1'
        }
      ];

      mockRepository.findByEventId.mockResolvedValue(elements);

      const result = await service.validateVenueLayout('test-event-1');

      expect(result.isValid).toBe(true); // No errors, just warnings
      expect(result.warnings).toContain('Found 1 overlapping element pairs');
      expect(result.overlappingElements).toHaveLength(1);
    });

    it('should warn about very small elements', async () => {
      const elements: VenueElement[] = [
        {
          ...mockElement,
          dimensions: { width: 10, height: 10 }
        }
      ];

      mockRepository.findByEventId.mockResolvedValue(elements);

      const result = await service.validateVenueLayout('test-event-1');

      expect(result.warnings).toContain('1 elements are very small and may be hard to see');
    });
  });

  describe('duplicateElement', () => {
    it('should duplicate an element with offset', async () => {
      const duplicatedElement = {
        ...mockElement,
        id: 'duplicated-element',
        name: 'Test Stage (Copy)',
        position: { x: 120, y: 120 }
      };

      mockRepository.findById.mockResolvedValue(mockElement);
      mockRepository.checkOverlap.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(duplicatedElement);

      const result = await service.duplicateElement('test-element-1', { x: 20, y: 20 });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'test-event-1',
          type: 'stage',
          name: 'Test Stage (Copy)',
          position: { x: 120, y: 120 },
          dimensions: { width: 200, height: 100 },
          color: '#8B4513'
        })
      );
      expect(result).toEqual(duplicatedElement);
    });

    it('should throw error when original element not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.duplicateElement('non-existent')).rejects.toThrow('Venue element not found');
    });
  });

  describe('getElementLibrary', () => {
    it('should return element library', () => {
      const library = service.getElementLibrary();

      expect(library).toHaveLength(7);
      expect(library[0]).toEqual(
        expect.objectContaining({
          type: 'stage',
          name: 'Stage',
          defaultDimensions: { width: 200, height: 100 },
          defaultColor: '#8B4513',
          description: 'Main stage or altar area'
        })
      );
    });
  });

  describe('createElementFromLibrary', () => {
    it('should create element from library item', () => {
      const position = { x: 100, y: 100 };
      const result = service.createElementFromLibrary('test-event-1', 'stage', position);

      expect(result).toEqual({
        eventId: 'test-event-1',
        type: 'stage',
        name: 'Stage',
        position,
        dimensions: { width: 200, height: 100 },
        color: '#8B4513'
      });
    });

    it('should create element with custom name', () => {
      const position = { x: 100, y: 100 };
      const result = service.createElementFromLibrary('test-event-1', 'stage', position, 'Custom Stage');

      expect(result.name).toBe('Custom Stage');
    });

    it('should throw error for unknown element type', () => {
      const position = { x: 100, y: 100 };
      
      expect(() => {
        service.createElementFromLibrary('test-event-1', 'unknown' as any, position);
      }).toThrow('Unknown element type: unknown');
    });
  });

  describe('getElementsByArea', () => {
    it('should get elements in specified area', async () => {
      const elementsInArea = [mockElement];
      const topLeft = { x: 50, y: 50 };
      const bottomRight = { x: 350, y: 250 };

      mockRepository.getElementsByArea.mockResolvedValue(elementsInArea);

      const result = await service.getElementsByArea('test-event-1', topLeft, bottomRight);

      expect(mockRepository.getElementsByArea).toHaveBeenCalledWith('test-event-1', topLeft, bottomRight);
      expect(result).toEqual(elementsInArea);
    });
  });
});