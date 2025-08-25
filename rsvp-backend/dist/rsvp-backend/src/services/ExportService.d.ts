import { VenueElement, Position } from '../../../shared/src/types';
import { GuestRepository } from '../repositories/GuestRepository';
import { TableRepository } from '../repositories/TableRepository';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
export interface ExportOptions {
    format: 'pdf' | 'xlsx' | 'csv';
    includeVenueLayout?: boolean;
    includeGuestDetails?: boolean;
    includeTableAssignments?: boolean;
    printOptimized?: boolean;
}
export interface SeatingChartData {
    event: {
        id: string;
        title: string;
        date: Date;
        location: string;
    };
    tables: Array<{
        id: string;
        name: string;
        capacity: number;
        position: Position;
        isLocked: boolean;
        guests: Array<{
            id: string;
            name: string;
            additionalGuestCount: number;
            dietaryRestrictions: string[];
            specialRequests: string;
        }>;
    }>;
    venueElements: VenueElement[];
    statistics: {
        totalGuests: number;
        totalSeats: number;
        occupiedSeats: number;
        availableSeats: number;
        tablesUsed: number;
        totalTables: number;
    };
}
export interface ExportResult {
    success: boolean;
    format: string;
    filename: string;
    buffer?: Buffer;
    filePath?: string;
    error?: string;
}
export declare class ExportService {
    private guestRepository;
    private tableRepository;
    private venueElementRepository;
    constructor(guestRepository: GuestRepository, tableRepository: TableRepository, venueElementRepository: VenueElementRepository);
    exportSeatingChart(eventId: string, options: ExportOptions): Promise<ExportResult>;
    exportGuestList(eventId: string, format: 'xlsx' | 'csv'): Promise<ExportResult>;
    exportVenueLayout(eventId: string, format: 'pdf' | 'xlsx'): Promise<ExportResult>;
    private gatherSeatingChartData;
    private exportToPDF;
    private exportToExcel;
    private createVisualLayoutSheet;
    private exportToCSV;
    private exportGuestListToCSV;
    private exportGuestListToExcel;
    private exportVenueLayoutToPDF;
    private exportVenueLayoutToExcel;
}
//# sourceMappingURL=ExportService.d.ts.map