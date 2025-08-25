import { Guest } from '../../../shared/src/types';
import { GuestInput, GuestUpdate } from '../models/Guest';
export interface GuestFilters {
    eventId?: string;
    rsvpStatus?: string;
    relationshipType?: string;
    brideOrGroomSide?: 'bride' | 'groom';
    search?: string;
}
export declare class MockGuestRepository {
    private demoDataService;
    constructor();
    create(guestData: GuestInput): Promise<Guest>;
    findById(id: string): Promise<Guest | null>;
    findByEventId(eventId: string): Promise<Guest[]>;
    findWithFilters(filters: GuestFilters): Promise<Guest[]>;
    update(id: string, updates: GuestUpdate): Promise<Guest | null>;
    delete(id: string): Promise<boolean>;
    findByPhoneNumber(phoneNumber: string): Promise<Guest | null>;
    getGuestCountByStatus(eventId: string): Promise<Record<string, number>>;
    getDietaryRestrictionsSummary(eventId: string): Promise<Record<string, number>>;
    getAnalytics(eventId: string): Promise<any>;
}
//# sourceMappingURL=MockGuestRepository.d.ts.map