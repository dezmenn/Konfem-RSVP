"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class BaseRepository {
    constructor() {
        this.pool = (0, database_1.getPool)();
    }
    async withTransaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Transaction failed:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async query(text, params) {
        try {
            const result = await this.pool.query(text, params);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Database query failed:', { query: text, params, error });
            throw error;
        }
    }
    async queryOne(text, params) {
        const results = await this.query(text, params);
        return results.length > 0 ? results[0] : null;
    }
    buildUpdateQuery(tableName, updates, whereClause) {
        const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        const setClause = fields.map((field, index) => `${this.camelToSnake(field)} = $${index + 1}`).join(', ');
        const values = fields.map(field => updates[field]);
        const query = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP ${whereClause}`;
        return { query, values };
    }
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    mapRowToCamelCase(row) {
        if (!row)
            return row;
        const mapped = {};
        for (const [key, value] of Object.entries(row)) {
            mapped[this.snakeToCamel(key)] = value;
        }
        return mapped;
    }
    mapRowsToCamelCase(rows) {
        return rows.map(row => this.mapRowToCamelCase(row));
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map