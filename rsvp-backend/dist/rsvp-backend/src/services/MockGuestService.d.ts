import { Guest, ImportResult, ContactData, ImportPreview } from '../../../shared/src/types';
import { GuestAnalytics } from './GuestService';
export declare class MockGuestService {
    private demoDataService;
    private nextId;
    constructor();
    createGuest(guestData: any): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    getGuest(id: string): Promise<Guest | null>;
    getGuestsByEvent(eventId: string): Promise<Guest[]>;
    searchGuests(filters: any): Promise<Guest[]>;
    updateGuest(id: string, updates: any): Promise<{
        success: boolean;
        guest?: Guest;
        errors?: string[];
    }>;
    deleteGuest(id: string): Promise<{
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
}
//# sourceMappingURL=MockGuestService.d.ts.map