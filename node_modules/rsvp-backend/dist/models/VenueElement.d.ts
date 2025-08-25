import { Position, Dimensions } from '../../../shared/src/types';
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
export declare class VenueElementModel {
    static readonly VALID_TYPES: readonly ["stage", "walkway", "decoration", "entrance", "bar", "dance_floor", "custom"];
    static validate(input: VenueElementInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: VenueElementUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: VenueElementInput): VenueElementInput;
}
//# sourceMappingURL=VenueElement.d.ts.map