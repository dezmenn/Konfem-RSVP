"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class MessageRepository extends BaseRepository_1.BaseRepository {
    async create(messageData) {
        const query = `
      INSERT INTO messages (
        event_id, recipient_id, content, message_type, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [
            messageData.eventId,
            messageData.recipientId,
            messageData.content,
            messageData.messageType,
            messageData.scheduledAt || null
        ];
        const result = await this.query(query, values);
        return this.mapRowToCamelCase(result[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM messages WHERE id = $1';
        const result = await this.queryOne(query, [id]);
        return result ? this.mapRowToCamelCase(result) : null;
    }
    async findByEventId(eventId) {
        const query = 'SELECT * FROM messages WHERE event_id = $1 ORDER BY created_at DESC';
        const results = await this.query(query, [eventId]);
        return this.mapRowsToCamelCase(results);
    }
    async findByRecipientId(recipientId) {
        const query = 'SELECT * FROM messages WHERE recipient_id = $1 ORDER BY created_at DESC';
        const results = await this.query(query, [recipientId]);
        return this.mapRowsToCamelCase(results);
    }
    async findWithFilters(filters) {
        let query = 'SELECT * FROM messages WHERE 1=1';
        const values = [];
        let paramCount = 0;
        if (filters.eventId) {
            query += ` AND event_id = $${++paramCount}`;
            values.push(filters.eventId);
        }
        if (filters.recipientId) {
            query += ` AND recipient_id = $${++paramCount}`;
            values.push(filters.recipientId);
        }
        if (filters.messageType) {
            query += ` AND message_type = $${++paramCount}`;
            values.push(filters.messageType);
        }
        if (filters.deliveryStatus) {
            query += ` AND delivery_status = $${++paramCount}`;
            values.push(filters.deliveryStatus);
        }
        if (filters.scheduledBefore) {
            query += ` AND scheduled_at <= $${++paramCount}`;
            values.push(filters.scheduledBefore);
        }
        if (filters.scheduledAfter) {
            query += ` AND scheduled_at >= $${++paramCount}`;
            values.push(filters.scheduledAfter);
        }
        query += ' ORDER BY created_at DESC';
        const results = await this.query(query, values);
        return this.mapRowsToCamelCase(results);
    }
    async update(id, updates) {
        const { query, values } = this.buildUpdateQuery('messages', updates, `WHERE id = $${Object.keys(updates).length + 1} RETURNING *`);
        values.push(id);
        const result = await this.queryOne(query, values);
        return result ? this.mapRowToCamelCase(result) : null;
    }
    async markAsSent(id) {
        return this.update(id, {
            deliveryStatus: 'sent',
            sentAt: new Date()
        });
    }
    async markAsDelivered(id) {
        return this.update(id, {
            deliveryStatus: 'delivered'
        });
    }
    async markAsFailed(id) {
        return this.update(id, {
            deliveryStatus: 'failed'
        });
    }
    async delete(id) {
        const query = 'DELETE FROM messages WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    async findPendingMessages() {
        const query = `
      SELECT * FROM messages 
      WHERE delivery_status = 'pending' 
      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
      ORDER BY created_at ASC
    `;
        const results = await this.query(query);
        return this.mapRowsToCamelCase(results);
    }
    async findScheduledMessages(beforeDate) {
        let query = `
      SELECT * FROM messages 
      WHERE delivery_status = 'pending' 
      AND scheduled_at IS NOT NULL
    `;
        const values = [];
        if (beforeDate) {
            query += ' AND scheduled_at <= $1';
            values.push(beforeDate);
        }
        query += ' ORDER BY scheduled_at ASC';
        const results = await this.query(query, values);
        return this.mapRowsToCamelCase(results);
    }
    async getMessageStats(eventId) {
        const query = `
      SELECT 
        message_type,
        delivery_status,
        COUNT(*) as count
      FROM messages 
      WHERE event_id = $1 
      GROUP BY message_type, delivery_status
    `;
        const results = await this.query(query, [eventId]);
        const stats = {};
        results.forEach(row => {
            const key = `${row.message_type}_${row.delivery_status}`;
            stats[key] = parseInt(row.count);
        });
        return stats;
    }
    async getDeliveryStatusSummary(eventId) {
        const query = `
      SELECT delivery_status, COUNT(*) as count 
      FROM messages 
      WHERE event_id = $1 
      GROUP BY delivery_status
    `;
        const results = await this.query(query, [eventId]);
        const summary = {};
        results.forEach(row => {
            summary[row.delivery_status] = parseInt(row.count);
        });
        return summary;
    }
    async findRecent(limit = 10) {
        const query = 'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1';
        const results = await this.query(query, [limit]);
        return this.mapRowsToCamelCase(results);
    }
    async findLatestMessageByRecipient(eventId, messageType) {
        let query = `
      SELECT DISTINCT ON (recipient_id) *
      FROM messages 
      WHERE event_id = $1
    `;
        const values = [eventId];
        if (messageType) {
            query += ' AND message_type = $2';
            values.push(messageType);
        }
        query += ' ORDER BY recipient_id, created_at DESC';
        const results = await this.query(query, values);
        return this.mapRowsToCamelCase(results);
    }
    async bulkCreate(messages) {
        if (messages.length === 0) {
            return [];
        }
        return this.withTransaction(async (client) => {
            const createdMessages = [];
            for (const messageData of messages) {
                const query = `
          INSERT INTO messages (
            event_id, recipient_id, content, message_type, scheduled_at
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
                const values = [
                    messageData.eventId,
                    messageData.recipientId,
                    messageData.content,
                    messageData.messageType,
                    messageData.scheduledAt || null
                ];
                const result = await client.query(query, values);
                createdMessages.push(this.mapRowToCamelCase(result.rows[0]));
            }
            return createdMessages;
        });
    }
}
exports.MessageRepository = MessageRepository;
//# sourceMappingURL=MessageRepository.js.map