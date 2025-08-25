import { Pool, PoolClient } from 'pg';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export abstract class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  protected async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  protected async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      logger.error('Database query failed:', { query: text, params, error });
      throw error;
    }
  }

  protected async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results.length > 0 ? results[0] : null;
  }

  protected buildUpdateQuery(tableName: string, updates: Record<string, any>, whereClause: string): { query: string; values: any[] } {
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = fields.map((field, index) => `${this.camelToSnake(field)} = $${index + 1}`).join(', ');
    const values = fields.map(field => updates[field]);
    
    const query = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP ${whereClause}`;
    
    return { query, values };
  }

  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  protected mapRowToCamelCase<T>(row: any): T {
    if (!row) return row;
    
    const mapped: any = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[this.snakeToCamel(key)] = value;
    }
    return mapped;
  }

  protected mapRowsToCamelCase<T>(rows: any[]): T[] {
    return rows.map(row => this.mapRowToCamelCase<T>(row));
  }
}