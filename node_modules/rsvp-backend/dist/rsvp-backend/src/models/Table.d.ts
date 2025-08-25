import { Position } from '../../../shared/src/types';
export interface TableInput {
    eventId: string;
    name: string;
    capacity: number;
    position: Position;
}
export interface TableUpdate {
    name?: string;
    capacity?: number;
    position?: Position;
    isLocked?: boolean;
}
export declare class TableModel {
    static validate(input: TableInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: TableUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: TableInput): TableInput;
}
//# sourceMappingURL=Table.d.ts.map