import { Table, Position } from '../../../shared/src/types';
import { TableInput, TableUpdate } from '../models/Table';
import { TableRepository } from '../repositories/TableRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { VenueElementRepository } from '../repositories/VenueElementRepository';
import { ArrangementConstraints, ArrangementResult } from './AutoArrangementService';
export interface TableArrangementConstraints {
    minTableDistance: number;
    maxGuestsPerTable: number;
    respectLockedTables: boolean;
}
export interface TableValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    conflicts: Array<{
        tableId: string;
        issue: string;
        severity: 'error' | 'warning';
    }>;
}
export interface TableCapacityInfo {
    tableId: string;
    name: string;
    capacity: number;
    occupied: number;
    available: number;
    isOverCapacity: boolean;
}
export declare class TableService {
    private tableRepository;
    private guestRepository;
    private venueElementRepository;
    private autoArrangementService;
    constructor(tableRepository: TableRepository, guestRepository: GuestRepository, venueElementRepository: VenueElementRepository);
    createTable(tableData: TableInput): Promise<Table>;
    updateTable(id: string, updates: TableUpdate): Promise<Table>;
    deleteTable(id: string): Promise<boolean>;
    getTable(id: string): Promise<Table | null>;
    getEventTables(eventId: string): Promise<Table[]>;
    lockTable(id: string): Promise<Table>;
    unlockTable(id: string): Promise<Table>;
    getLockedTables(eventId: string): Promise<Table[]>;
    getUnlockedTables(eventId: string): Promise<Table[]>;
    assignGuestToTable(guestId: string, tableId: string): Promise<void>;
    unassignGuestFromTable(guestId: string): Promise<void>;
    getTableCapacityInfo(eventId: string): Promise<TableCapacityInfo[]>;
    validateTableArrangement(eventId: string): Promise<TableValidationResult>;
    duplicateTable(id: string, offset?: Position): Promise<Table>;
    autoArrangeGuestsEnhanced(eventId: string, constraints?: Partial<ArrangementConstraints>): Promise<ArrangementResult>;
    autoArrangeGuests(eventId: string, options?: {
        respectRelationships?: boolean;
        balanceBrideGroomSides?: boolean;
        considerDietaryRestrictions?: boolean;
        keepFamiliesTogether?: boolean;
        maxGuestsPerTable?: number;
    }): Promise<{
        success: boolean;
        message: string;
        arrangedGuests: number;
    }>;
    private groupGuestsForArrangement;
    private applyTableAssignments;
    private checkTablePositionConflicts;
    private doTablesOverlap;
}
//# sourceMappingURL=TableService.d.ts.map