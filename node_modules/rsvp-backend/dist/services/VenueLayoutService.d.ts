import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../models/VenueElement';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
export interface VenueLayoutValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    overlappingElements: Array<{
        element1: VenueElement;
        element2: VenueElement;
        overlapArea: {
            position: Position;
            dimensions: Dimensions;
        };
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
export declare class VenueLayoutService {
    private venueElementRepository;
    private static readonly ELEMENT_LIBRARY;
    constructor(venueElementRepository: VenueElementRepository);
    createElement(elementData: VenueElementInput): Promise<VenueElement>;
    updateElement(id: string, updates: VenueElementUpdate): Promise<VenueElement>;
    deleteElement(id: string): Promise<boolean>;
    getVenueLayout(eventId: string): Promise<{
        elements: VenueElement[];
        bounds: VenueLayoutBounds;
    }>;
    validateVenueLayout(eventId: string): Promise<VenueLayoutValidationResult>;
    getElementsByArea(eventId: string, topLeft: Position, bottomRight: Position): Promise<VenueElement[]>;
    duplicateElement(id: string, offset?: Position): Promise<VenueElement>;
    getElementLibrary(): VenueElementLibraryItem[];
    createElementFromLibrary(eventId: string, libraryType: VenueElement['type'], position: Position, customName?: string): VenueElementInput;
    protected calculateOverlap(element1: VenueElement, element2: VenueElement): {
        position: Position;
        dimensions: Dimensions;
    } | null;
    private calculateLayoutBounds;
}
//# sourceMappingURL=VenueLayoutService.d.ts.map