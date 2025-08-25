import { BaseRepository } from './BaseRepository';
import { Guest } from '../../../shared/src/types';
import { GuestInput, GuestUpdate } from '../models/Guest';
export interface GuestFilters {
    eventId?: string;
    rsvpStatus?: string;
    relationshipType?: string;
    brideOrGroomSide?: 'bride' | 'groom';
    search?: string;
}
export declare class GuestRepository extends BaseRepository {
    create(guestData: GuestInput): Promise<Guest>;
    findById(id: string): Promise<Guest | null>;
    findByEventId(eventId: string): Promise<Guest[]>;
    findWithFilters(filters: GuestFilters): Promise<Guest[]>;
    update(id: string, updates: GuestUpdate): Promise<Guest | null>;
    delete(id: string): Promise<boolean>;
    getGuestCountByStatus(eventId: string): Promise<Record<string, number>>;
    getDietaryRestrictionsSummary(eventId: string): Promise<Record<string, number>>;
    assignToTable(guestId: string, tableId: string): Promise<Guest | null>;
    unassignFromTable(guestId: string): Promise<Guest | null>;
    findByTableId(tableId: string): Promise<Guest[]>;
    findRecent(limit?: number): Promise<Guest[]>;
}
//# sourceMappingURL=GuestRepository.d.ts.map