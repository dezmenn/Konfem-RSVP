import { VenueElement, Position } from '../../../shared/src/types';
import { VenueElementInput, VenueElementUpdate } from '../models/VenueElement';
import { VenueLayoutService, VenueLayoutValidationResult, VenueLayoutBounds } from './VenueLayoutService';
export declare class MockVenueLayoutService extends VenueLayoutService {
    private elements;
    private nextId;
    constructor();
    private initializeDemoData;
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
    clearAll(): void;
    getAllElements(): VenueElement[];
}
//# sourceMappingURL=MockVenueLayoutService.d.ts.map