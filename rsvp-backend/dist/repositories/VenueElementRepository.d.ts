import { BaseRepository } from './BaseRepository';
import { VenueElement, Position, Dimensions } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../models/VenueElement';
export declare class VenueElementRepository extends BaseRepository {
    create(elementData: VenueElementInput): Promise<VenueElement>;
    findById(id: string): Promise<VenueElement | null>;
    findByEventId(eventId: string): Promise<VenueElement[]>;
    findByType(eventId: string, type: string): Promise<VenueElement[]>;
    update(id: string, updates: VenueElementUpdate): Promise<VenueElement | null>;
    delete(id: string): Promise<boolean>;
    deleteByEventId(eventId: string): Promise<number>;
    getVenueLayout(eventId: string): Promise<{
        elements: VenueElement[];
        bounds: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
        };
    }>;
    checkOverlap(eventId: string, position: Position, dimensions: Dimensions, excludeId?: string): Promise<VenueElement[]>;
    getElementsByArea(eventId: string, topLeft: Position, bottomRight: Position): Promise<VenueElement[]>;
    private mapVenueElementRow;
}
//# sourceMappingURL=VenueElementRepository.d.ts.map