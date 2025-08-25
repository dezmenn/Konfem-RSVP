"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueElementRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class VenueElementRepository extends BaseRepository_1.BaseRepository {
    async create(elementData) {
        const query = `
      INSERT INTO venue_elements (
        event_id, type, name, position_x, position_y, width, height, color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [
            elementData.eventId,
            elementData.type,
            elementData.name,
            elementData.position.x,
            elementData.position.y,
            elementData.dimensions.width,
            elementData.dimensions.height,
            elementData.color || '#000000'
        ];
        const result = await this.query(query, values);
        return this.mapVenueElementRow(result[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM venue_elements WHERE id = $1';
        const result = await this.queryOne(query, [id]);
        return result ? this.mapVenueElementRow(result) : null;
    }
    async findByEventId(eventId) {
        const query = 'SELECT * FROM venue_elements WHERE event_id = $1 ORDER BY name';
        const results = await this.query(query, [eventId]);
        return results.map(row => this.mapVenueElementRow(row));
    }
    async findByType(eventId, type) {
        const query = 'SELECT * FROM venue_elements WHERE event_id = $1 AND type = $2 ORDER BY name';
        const results = await this.query(query, [eventId, type]);
        return results.map(row => this.mapVenueElementRow(row));
    }
    async update(id, updates) {
        // Handle position and dimensions updates specially
        const dbUpdates = { ...updates };
        if (updates.position) {
            dbUpdates.position_x = updates.position.x;
            dbUpdates.position_y = updates.position.y;
            delete dbUpdates.position;
        }
        if (updates.dimensions) {
            dbUpdates.width = updates.dimensions.width;
            dbUpdates.height = updates.dimensions.height;
            delete dbUpdates.dimensions;
        }
        const { query, values } = this.buildUpdateQuery('venue_elements', dbUpdates, `WHERE id = $${Object.keys(dbUpdates).length + 1} RETURNING *`);
        values.push(id);
        const result = await this.queryOne(query, values);
        return result ? this.mapVenueElementRow(result) : null;
    }
    async delete(id) {
        const query = 'DELETE FROM venue_elements WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
    async deleteByEventId(eventId) {
        const query = 'DELETE FROM venue_elements WHERE event_id = $1';
        const result = await this.pool.query(query, [eventId]);
        return result.rowCount ?? 0;
    }
    async getVenueLayout(eventId) {
        const elements = await this.findByEventId(eventId);
        if (elements.length === 0) {
            return {
                elements: [],
                bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
            };
        }
        // Calculate venue bounds
        let minX = Math.min(...elements.map(e => e.position.x));
        let minY = Math.min(...elements.map(e => e.position.y));
        let maxX = Math.max(...elements.map(e => e.position.x + e.dimensions.width));
        let maxY = Math.max(...elements.map(e => e.position.y + e.dimensions.height));
        return {
            elements,
            bounds: { minX, minY, maxX, maxY }
        };
    }
    async checkOverlap(eventId, position, dimensions, excludeId) {
        let query = `
      SELECT * FROM venue_elements 
      WHERE event_id = $1 
      AND NOT (
        position_x >= $2 OR 
        position_x + width <= $3 OR 
        position_y >= $4 OR 
        position_y + height <= $5
      )
    `;
        const values = [
            eventId,
            position.x + dimensions.width, // right edge of new element
            position.x, // left edge of new element
            position.y + dimensions.height, // bottom edge of new element
            position.y // top edge of new element
        ];
        if (excludeId) {
            query += ` AND id != $${values.length + 1}`;
            values.push(excludeId);
        }
        const results = await this.query(query, values);
        return results.map(row => this.mapVenueElementRow(row));
    }
    async getElementsByArea(eventId, topLeft, bottomRight) {
        const query = `
      SELECT * FROM venue_elements 
      WHERE event_id = $1 
      AND position_x < $2 
      AND position_x + width > $3 
      AND position_y < $4 
      AND position_y + height > $5
      ORDER BY name
    `;
        const values = [
            eventId,
            bottomRight.x, // right boundary
            topLeft.x, // left boundary
            bottomRight.y, // bottom boundary
            topLeft.y // top boundary
        ];
        const results = await this.query(query, values);
        return results.map(row => this.mapVenueElementRow(row));
    }
    mapVenueElementRow(row) {
        return {
            id: row.id,
            type: row.type,
            name: row.name,
            position: {
                x: parseFloat(row.position_x),
                y: parseFloat(row.position_y)
            },
            dimensions: {
                width: parseFloat(row.width),
                height: parseFloat(row.height)
            },
            color: row.color,
            eventId: row.event_id
        };
    }
}
exports.VenueElementRepository = VenueElementRepository;
//# sourceMappingURL=VenueElementRepository.js.map