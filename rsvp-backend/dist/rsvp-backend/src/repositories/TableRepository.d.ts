import { BaseRepository } from './BaseRepository';
import { Table } from '../../../shared/src/types';
import { TableInput, TableUpdate } from '../models/Table';
export declare class TableRepository extends BaseRepository {
    create(tableData: TableInput): Promise<Table>;
    findById(id: string): Promise<Table | null>;
    findByEventId(eventId: string): Promise<Table[]>;
    update(id: string, updates: TableUpdate): Promise<Table | null>;
    delete(id: string): Promise<boolean>;
    lockTable(id: string): Promise<Table | null>;
    unlockTable(id: string): Promise<Table | null>;
    findLockedTables(eventId: string): Promise<Table[]>;
    findUnlockedTables(eventId: string): Promise<Table[]>;
    getTableWithGuests(id: string): Promise<Table | null>;
    getTablesWithGuests(eventId: string): Promise<Table[]>;
    getTableCapacityInfo(eventId: string): Promise<Array<{
        tableId: string;
        name: string;
        capacity: number;
        occupied: number;
        available: number;
    }>>;
    checkTableCapacity(tableId: string): Promise<{
        capacity: number;
        occupied: number;
        available: number;
    }>;
    private mapTableRow;
}
//# sourceMappingURL=TableRepository.d.ts.map