import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../models/VenueElement';
export declare class MockVenueElementRepository {
    private demoDataService;
    constructor();
    create(elementData: VenueElementInput): Promise<VenueElement>;
    findById(id: string): Promise<VenueElement | null>;
    findByEventId(eventId: string): Promise<VenueElement[]>;
    findByType(eventId: string, type: string): Promise<VenueElement[]>;
    update(id: string, updates: VenueElementUpdate): Promise<VenueElement | null>;
    delete(id: string): Promise<boolean>;
    checkOverlap(eventId: string, position: Position, dimensions: Dimensions, excludeId?: string): Promise<VenueElement[]>;
    getElementsByArea(eventId: string, topLeft: Position, bottomRight: Position): Promise<VenueElement[]>;
    getVenueLayout(eventId: string): Promise<{
        elements: VenueElement[];
        bounds: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
        };
    }>;
}
//# sourceMappingURL=MockVenueElementRepository.d.ts.map