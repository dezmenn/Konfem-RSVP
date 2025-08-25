import { BaseRepository } from './BaseRepository';
import { Guest } from '../../../shared/src/types';
import { GuestInput, GuestUpdate } from '../models/Guest';

export interface GuestFilters {
  eventId?: string;
  rsvpStatus?: string;
  relationshipType?: string;
  brideOrGroomSide?: 'bride' | 'groom';
  search?: string;
}

export class GuestRepository extends BaseRepository {
  async create(guestData: GuestInput): Promise<Guest> {
    const query = `
      INSERT INTO guests (
        event_id, name, phone_number, dietary_restrictions, 
        additional_guest_count, relationship_type, bride_or_groom_side, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      guestData.eventId,
      guestData.name,
      guestData.phoneNumber,
      guestData.dietaryRestrictions || [],
      guestData.additionalGuestCount || 0,
      guestData.relationshipType,
      guestData.brideOrGroomSide,
      guestData.specialRequests || ''
    ];

    const result = await this.query(query, values);
    return this.mapRowToCamelCase<Guest>(result[0]);
  }

  async findById(id: string): Promise<Guest | null> {
    const query = 'SELECT * FROM guests WHERE id = $1';
    const result = await this.queryOne(query, [id]);
    return result ? this.mapRowToCamelCase<Guest>(result) : null;
  }

  async findByEventId(eventId: string): Promise<Guest[]> {
    const query = 'SELECT * FROM guests WHERE event_id = $1 ORDER BY name';
    const results = await this.query(query, [eventId]);
    return this.mapRowsToCamelCase<Guest>(results);
  }

  async findWithFilters(filters: GuestFilters): Promise<Guest[]> {
    let query = 'SELECT * FROM guests WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

    if (filters.eventId) {
      query += ` AND event_id = $${++paramCount}`;
      values.push(filters.eventId);
    }

    if (filters.rsvpStatus) {
      query += ` AND rsvp_status = $${++paramCount}`;
      values.push(filters.rsvpStatus);
    }

    if (filters.relationshipType) {
      query += ` AND relationship_type = $${++paramCount}`;
      values.push(filters.relationshipType);
    }

    if (filters.brideOrGroomSide) {
      query += ` AND bride_or_groom_side = $${++paramCount}`;
      values.push(filters.brideOrGroomSide);
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${++paramCount} OR phone_number ILIKE $${++paramCount})`;
      const searchPattern = `%${filters.search}%`;
      values.push(searchPattern, searchPattern);
      paramCount++; // Increment for the second parameter
    }

    query += ' ORDER BY name';

    const results = await this.query(query, values);
    return this.mapRowsToCamelCase<Guest>(results);
  }

  async update(id: string, updates: GuestUpdate): Promise<Guest | null> {
    const { query, values } = this.buildUpdateQuery('guests', updates, `WHERE id = $${Object.keys(updates).length + 1} RETURNING *`);
    values.push(id);

    const result = await this.queryOne(query, values);
    return result ? this.mapRowToCamelCase<Guest>(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM guests WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getGuestCountByStatus(eventId: string): Promise<Record<string, number>> {
    const query = `
      SELECT rsvp_status, COUNT(*) as count 
      FROM guests 
      WHERE event_id = $1 
      GROUP BY rsvp_status
    `;
    
    const results = await this.query(query, [eventId]);
    const counts: Record<string, number> = {};
    
    results.forEach(row => {
      counts[row.rsvp_status] = parseInt(row.count);
    });

    return counts;
  }

  async getDietaryRestrictionsSummary(eventId: string): Promise<Record<string, number>> {
    const query = `
      SELECT unnest(dietary_restrictions) as restriction, COUNT(*) as count
      FROM guests 
      WHERE event_id = $1 AND array_length(dietary_restrictions, 1) > 0
      GROUP BY restriction
      ORDER BY count DESC
    `;
    
    const results = await this.query(query, [eventId]);
    const summary: Record<string, number> = {};
    
    results.forEach(row => {
      summary[row.restriction] = parseInt(row.count);
    });

    return summary;
  }

  async assignToTable(guestId: string, tableId: string): Promise<Guest | null> {
    return this.update(guestId, { tableAssignment: tableId });
  }

  async unassignFromTable(guestId: string): Promise<Guest | null> {
    const query = `
      UPDATE guests 
      SET table_assignment = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.queryOne(query, [guestId]);
    return result ? this.mapRowToCamelCase<Guest>(result) : null;
  }

  async findByTableId(tableId: string): Promise<Guest[]> {
    const query = 'SELECT * FROM guests WHERE table_assignment = $1 ORDER BY name';
    const results = await this.query(query, [tableId]);
    return this.mapRowsToCamelCase<Guest>(results);
  }

  async findRecent(limit: number = 10): Promise<Guest[]> {
    const query = 'SELECT * FROM guests ORDER BY created_at DESC LIMIT $1';
    const results = await this.query(query, [limit]);
    return this.mapRowsToCamelCase<Guest>(results);
  }
}