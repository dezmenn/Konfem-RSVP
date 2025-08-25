import { Table, Position } from '../../../shared/src/types';
import { TableInput, TableUpdate } from '../models/Table';
import { TableValidationResult, TableCapacityInfo } from './TableService';
import { ArrangementConstraints, ArrangementResult } from './AutoArrangementService';
export declare class MockTableService {
    private demoDataService;
    private autoArrangementService;
    private nextId;
    constructor();
    createTable(tableData: TableInput): Promise<Table>;
    updateTable(id: string, updates: TableUpdate): Promise<Table>;
    deleteTable(id: string): Promise<boolean>;
    getTable(id: string): Promise<Table | null>;
    getEventTables(eventId: string): Promise<Table[]>;
    getTablesWithGuests(eventId: string): Promise<Table[]>;
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
    private synchronizeGuestTableAssignments;
    private doTablesOverlap;
}
//# sourceMappingURL=MockTableService.d.ts.map