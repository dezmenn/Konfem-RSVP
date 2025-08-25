import { BaseRepository } from './BaseRepository';
import { RSVPToken } from '../../../shared/src/types';
import { RSVPTokenInput, RSVPTokenUpdate } from '../models/RSVPToken';

export class RSVPTokenRepository extends BaseRepository {
  async create(tokenData: RSVPTokenInput & { token: string }): Promise<RSVPToken> {
    const query = `
      INSERT INTO rsvp_tokens (guest_id, event_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      tokenData.guestId,
      tokenData.eventId,
      tokenData.token,
      tokenData.expiresAt
    ];

    const result = await this.query(query, values);
    return this.mapRowToRSVPToken(result[0]);
  }

  async findById(id: string): Promise<RSVPToken | null> {
    const query = 'SELECT * FROM rsvp_tokens WHERE id = $1';
    const result = await this.query(query, [id]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPToken(result[0]);
  }

  async findByToken(token: string): Promise<RSVPToken | null> {
    const query = 'SELECT * FROM rsvp_tokens WHERE token = $1';
    const result = await this.query(query, [token]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPToken(result[0]);
  }

  async findByGuestId(guestId: string): Promise<RSVPToken[]> {
    const query = 'SELECT * FROM rsvp_tokens WHERE guest_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [guestId]);
    
    return result.map(row => this.mapRowToRSVPToken(row));
  }

  async findActiveByGuestId(guestId: string): Promise<RSVPToken | null> {
    const query = `
      SELECT * FROM rsvp_tokens 
      WHERE guest_id = $1 AND is_used = false AND expires_at > $2 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await this.query(query, [guestId, new Date()]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPToken(result[0]);
  }

  async findByEventId(eventId: string): Promise<RSVPToken[]> {
    const query = 'SELECT * FROM rsvp_tokens WHERE event_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [eventId]);
    
    return result.map(row => this.mapRowToRSVPToken(row));
  }

  async update(id: string, updates: RSVPTokenUpdate): Promise<RSVPToken | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnakeCase(key);
        updateFields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE rsvp_tokens 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.query(query, values);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPToken(result[0]);
  }

  async markAsUsed(id: string): Promise<RSVPToken | null> {
    return this.update(id, { isUsed: true });
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM rsvp_tokens WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async deleteExpired(): Promise<number> {
    const query = 'DELETE FROM rsvp_tokens WHERE expires_at <= $1';
    const result = await this.pool.query(query, [new Date()]);
    return result.rowCount || 0;
  }

  private mapRowToRSVPToken(row: any): RSVPToken {
    return {
      id: row.id,
      guestId: row.guest_id,
      eventId: row.event_id,
      token: row.token,
      expiresAt: row.expires_at,
      isUsed: row.is_used,
      createdAt: row.created_at
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}