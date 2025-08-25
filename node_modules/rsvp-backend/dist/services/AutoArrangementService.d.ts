import { Guest, Table, VenueElement, RelationshipType } from '../../../shared/src/types';
export interface ArrangementConstraints {
    respectRelationships: boolean;
    considerDietaryRestrictions: boolean;
    keepFamiliesTogether: boolean;
    optimizeVenueProximity: boolean;
    minGuestsPerTable: number;
    preferredTableDistance: number;
}
export interface ArrangementResult {
    success: boolean;
    message: string;
    arrangedGuests: number;
    tableAssignments: Map<string, string[]>;
    conflicts: ArrangementConflict[];
    score: number;
}
export interface ArrangementConflict {
    type: 'capacity' | 'dietary' | 'relationship' | 'balance' | 'proximity';
    severity: 'error' | 'warning' | 'info';
    message: string;
    affectedGuests: string[];
    affectedTables: string[];
}
export interface GuestGroup {
    id: string;
    guests: Guest[];
    priority: number;
    constraints: {
        mustSitTogether: boolean;
        preferredSide: 'bride' | 'groom' | 'mixed';
        dietaryRestrictions: string[];
        relationshipType: RelationshipType;
        proximityPreferences: VenueProximityPreference[];
    };
}
export interface VenueProximityPreference {
    elementType: VenueElement['type'];
    preference: 'close' | 'far' | 'neutral';
    weight: number;
}
export interface TableScore {
    tableId: string;
    score: number;
    factors: {
        capacity: number;
        balance: number;
        dietary: number;
        proximity: number;
        relationship: number;
    };
}
export declare class AutoArrangementService {
    private static readonly RELATIONSHIP_PRIORITIES;
    private static readonly VENUE_PROXIMITY_RULES;
    generateArrangement(guests: Guest[], tables: Table[], venueElements: VenueElement[], constraints: ArrangementConstraints): Promise<ArrangementResult>;
    private createGuestGroups;
    private createGuestGroupFromFamily;
    private createGuestGroupFromGuests;
    private calculateTableScores;
    private calculateTableScoreForGroup;
    private calculateCapacityScore;
    private calculateBalanceScore;
    private calculateDietaryScore;
    private calculateProximityScore;
    private calculateRelationshipScore;
    private calculateDistance;
    private optimizeAssignments;
    private extractTableNumber;
    private validateAssignments;
    private calculateArrangementScore;
}
//# sourceMappingURL=AutoArrangementService.d.ts.map