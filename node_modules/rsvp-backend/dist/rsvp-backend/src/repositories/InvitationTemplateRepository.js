"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationTemplateRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class InvitationTemplateRepository extends BaseRepository_1.BaseRepository {
    async create(templateData) {
        const query = `
      INSERT INTO invitation_templates (
        event_id, name, background_color, background_image, width, height,
        text_elements, image_elements, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
        const values = [
            templateData.eventId,
            templateData.name,
            templateData.backgroundColor,
            templateData.backgroundImage,
            templateData.width,
            templateData.height,
            JSON.stringify(templateData.textElements),
            JSON.stringify(templateData.imageElements),
            templateData.isDefault
        ];
        const result = await this.query(query, values);
        return this.mapRowToInvitationTemplate(result[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM invitation_templates WHERE id = $1';
        const result = await this.query(query, [id]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToInvitationTemplate(result[0]);
    }
    async findByEventId(eventId) {
        const query = 'SELECT * FROM invitation_templates WHERE event_id = $1 ORDER BY is_default DESC, created_at DESC';
        const result = await this.query(query, [eventId]);
        return result.map(row => this.mapRowToInvitationTemplate(row));
    }
    async findDefaultByEventId(eventId) {
        const query = 'SELECT * FROM invitation_templates WHERE event_id = $1 AND is_default = true LIMIT 1';
        const result = await this.query(query, [eventId]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToInvitationTemplate(result[0]);
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
        updateFields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
        values.push(id);
        const query = `
      UPDATE invitation_templates 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await this.query(query, values);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToInvitationTemplate(result[0]);
    }
    async delete(id) {
        const query = 'DELETE FROM invitation_templates WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    async setAsDefault(id, eventId) {
        return this.withTransaction(async (client) => {
            // Remove default flag from all templates for this event
            await client.query('UPDATE invitation_templates SET is_default = false WHERE event_id = $1', [eventId]);
            // Set the specified template as default
            const result = await client.query('UPDATE invitation_templates SET is_default = true, updated_at = $1 WHERE id = $2 AND event_id = $3 RETURNING *', [new Date(), id, eventId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToInvitationTemplate(result.rows[0]);
        });
    }
    mapRowToInvitationTemplate(row) {
        return {
            id: row.id,
            eventId: row.event_id,
            name: row.name,
            backgroundColor: row.background_color,
            backgroundImage: row.background_image,
            width: row.width,
            height: row.height,
            textElements: JSON.parse(row.text_elements || '[]'),
            imageElements: JSON.parse(row.image_elements || '[]'),
            isDefault: row.is_default,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.InvitationTemplateRepository = InvitationTemplateRepository;
//# sourceMappingURL=InvitationTemplateRepository.js.map