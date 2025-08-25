import { BaseRepository } from './BaseRepository';
import { Table } from '../../../shared/src/types';
import { TableInput, TableUpdate } from '../models/Table';

export class TableRepository extends BaseRepository {
  async create(tableData: TableInput): Promise<Table> {
    const query = `
      INSERT INTO tables (
        event_id, name, capacity, position_x, position_y
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      tableData.eventId,
      tableData.name,
      tableData.capacity,
      tableData.position.x,
      tableData.position.y
    ];

    const result = await this.query(query, values);
    return this.mapTableRow(result[0]);
  }

  async findById(id: string): Promise<Table | null> {
    const query = 'SELECT * FROM tables WHERE id = $1';
    const result = await this.queryOne(query, [id]);
    return result ? this.mapTableRow(result) : null;
  }

  async findByEventId(eventId: string): Promise<Table[]> {
    const query = 'SELECT * FROM tables WHERE event_id = $1 ORDER BY name';
    const results = await this.query(query, [eventId]);
    return results.map(row => this.mapTableRow(row));
  }

  async update(id: string, updates: TableUpdate): Promise<Table | null> {
    // Handle position update specially
    const dbUpdates: any = { ...updates };
    if (updates.position) {
      dbUpdates.position_x = updates.position.x;
      dbUpdates.position_y = updates.position.y;
      delete dbUpdates.position;
    }

    const { query, values } = this.buildUpdateQuery('tables', dbUpdates, `WHERE id = $${Object.keys(dbUpdates).length + 1} RETURNING *`);
    values.push(id);

    const result = await this.queryOne(query, values);
    return result ? this.mapTableRow(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    // First, unassign all guests from this table
    await this.query('UPDATE guests SET table_assignment = NULL WHERE table_assignment = $1', [id]);
    
    // Then delete the table
    const query = 'DELETE FROM tables WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async lockTable(id: string): Promise<Table | null> {
    return this.update(id, { isLocked: true });
  }

  async unlockTable(id: string): Promise<Table | null> {
    return this.update(id, { isLocked: false });
  }

  async findLockedTables(eventId: string): Promise<Table[]> {
    const query = 'SELECT * FROM tables WHERE event_id = $1 AND is_locked = true ORDER BY name';
    const results = await this.query(query, [eventId]);
    return results.map(row => this.mapTableRow(row));
  }

  async findUnlockedTables(eventId: string): Promise<Table[]> {
    const query = 'SELECT * FROM tables WHERE event_id = $1 AND is_locked = false ORDER BY name';
    const results = await this.query(query, [eventId]);
    return results.map(row => this.mapTableRow(row));
  }

  async getTableWithGuests(id: string): Promise<Table | null> {
    const tableQuery = 'SELECT * FROM tables WHERE id = $1';
    const tableResult = await this.queryOne(tableQuery, [id]);
    
    if (!tableResult) {
      return null;
    }

    const guestsQuery = 'SELECT id FROM guests WHERE table_assignment = $1';
    const guestResults = await this.query(guestsQuery, [id]);
    
    const table = this.mapTableRow(tableResult);
    table.assignedGuests = guestResults.map(row => row.id);
    
    return table;
  }

  async getTablesWithGuests(eventId: string): Promise<Table[]> {
    const query = `
      SELECT 
        t.*,
        COALESCE(array_agg(g.id) FILTER (WHERE g.id IS NOT NULL), '{}') as assigned_guest_ids
      FROM tables t
      LEFT JOIN guests g ON t.id = g.table_assignment
      WHERE t.event_id = $1
      GROUP BY t.id
      ORDER BY t.name
    `;

    const results = await this.query(query, [eventId]);
    return results.map(row => {
      const table = this.mapTableRow(row);
      table.assignedGuests = row.assigned_guest_ids || [];
      return table;
    });
  }

  async getTableCapacityInfo(eventId: string): Promise<Array<{ tableId: string; name: string; capacity: number; occupied: number; available: number }>> {
    const query = `
      SELECT 
        t.id as table_id,
        t.name,
        t.capacity,
        COUNT(g.id) as occupied
      FROM tables t
      LEFT JOIN guests g ON t.id = g.table_assignment
      WHERE t.event_id = $1
      GROUP BY t.id, t.name, t.capacity
      ORDER BY t.name
    `;

    const results = await this.query(query, [eventId]);
    return results.map(row => ({
      tableId: row.table_id,
      name: row.name,
      capacity: row.capacity,
      occupied: parseInt(row.occupied),
      available: row.capacity - parseInt(row.occupied)
    }));
  }

  async checkTableCapacity(tableId: string): Promise<{ capacity: number; occupied: number; available: number }> {
    const query = `
      SELECT 
        t.capacity,
        COUNT(g.id) as occupied
      FROM tables t
      LEFT JOIN guests g ON t.id = g.table_assignment
      WHERE t.id = $1
      GROUP BY t.capacity
    `;

    const result = await this.queryOne(query, [tableId]);
    if (!result) {
      throw new Error('Table not found');
    }

    const occupied = parseInt(result.occupied);
    return {
      capacity: result.capacity,
      occupied,
      available: result.capacity - occupied
    };
  }

  private mapTableRow(row: any): Table {
    return {
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      position: {
        x: parseFloat(row.position_x),
        y: parseFloat(row.position_y)
      },
      isLocked: row.is_locked,
      assignedGuests: [], // Will be populated by getTableWithGuests or getTablesWithGuests
      eventId: row.event_id
    };
  }
}