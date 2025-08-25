"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPTokenRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class RSVPTokenRepository extends BaseRepository_1.BaseRepository {
    async create(tokenData) {
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
    async findById(id) {
        const query = 'SELECT * FROM rsvp_tokens WHERE id = $1';
        const result = await this.query(query, [id]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToRSVPToken(result[0]);
    }
    async findByToken(token) {
        const query = 'SELECT * FROM rsvp_tokens WHERE token = $1';
        const result = await this.query(query, [token]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToRSVPToken(result[0]);
    }
    async findByGuestId(guestId) {
        const query = 'SELECT * FROM rsvp_tokens WHERE guest_id = $1 ORDER BY created_at DESC';
        const result = await this.query(query, [guestId]);
        return result.map(row => this.mapRowToRSVPToken(row));
    }
    async findActiveByGuestId(guestId) {
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
    async findByEventId(eventId) {
        const query = 'SELECT * FROM rsvp_tokens WHERE event_id = $1 ORDER BY created_at DESC';
        const result = await this.query(query, [eventId]);
        return result.map(row => this.mapRowToRSVPToken(row));
    }
    async update(id, updates) {
        const updateFields = [];
        const values = [];
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
    async markAsUsed(id) {
        return this.update(id, { isUsed: true });
    }
    async delete(id) {
        const query = 'DELETE FROM rsvp_tokens WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    async deleteExpired() {
        const query = 'DELETE FROM rsvp_tokens WHERE expires_at <= $1';
        const result = await this.pool.query(query, [new Date()]);
        return result.rowCount || 0;
    }
    mapRowToRSVPToken(row) {
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
    camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.RSVPTokenRepository = RSVPTokenRepository;
//# sourceMappingURL=RSVPTokenRepository.js.map