import { Pool, PoolClient } from 'pg';
export declare abstract class BaseRepository {
    protected pool: Pool;
    constructor();
    protected withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    protected query<T = any>(text: string, params?: any[]): Promise<T[]>;
    protected queryOne<T = any>(text: string, params?: any[]): Promise<T | null>;
    protected buildUpdateQuery(tableName: string, updates: Record<string, any>, whereClause: string): {
        query: string;
        values: any[];
    };
    protected camelToSnake(str: string): string;
    protected snakeToCamel(str: string): string;
    protected mapRowToCamelCase<T>(row: any): T;
    protected mapRowsToCamelCase<T>(rows: any[]): T[];
}
//# sourceMappingURL=BaseRepository.d.ts.map