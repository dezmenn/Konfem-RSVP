import { GuestRepository, GuestFilters } from '../repositories/GuestRepository';
import { GuestInput, GuestUpdate } from '../models/Guest';
import { Guest, ImportResult, ContactData, ImportPreview } from '../../../shared/src/types';
export interface GuestAnalytics {
    totalGuests: number;
    rsvpStatusCounts: Record<string, number>;
    dietaryRestrictionsSummary: Record<string, number>;
    brideGroomSideCounts: {
        bride: number;
        groom: number;
    };
    relationshipTypeCounts: Record<string, number>;
}
export declare class GuestService {
    private guestRepository;
    constructor(guestRepository: GuestRepository);
    createGuest(guestData: GuestInput): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    getGuest(id: string): Promise<Guest | null>;
    getGuestsByEvent(eventId: string): Promise<Guest[]>;
    searchGuests(filters: GuestFilters): Promise<Guest[]>;
    updateGuest(id: string, updates: GuestUpdate, eventId?: string): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    deleteGuest(id: string, eventId?: string): Promise<{
        success: boolean;
        errors?: string[];
    }>;
    getGuestAnalytics(eventId: string): Promise<GuestAnalytics>;
    assignGuestToTable(guestId: string, tableId: string): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    unassignGuestFromTable(guestId: string): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    getGuestsByTable(tableId: string): Promise<Guest[]>;
    importFromCSV(csvContent: string, eventId: string): Promise<ImportResult>;
    previewCSVImport(csvContent: string, eventId: string): Promise<ImportPreview>;
    importFromContacts(contacts: ContactData[], eventId: string): Promise<ImportResult>;
    private parseCSVRowToGuestInput;
    private normalizePhoneNumber;
    private broadcastSyncEvent;
}
//# sourceMappingURL=GuestService.d.ts.map