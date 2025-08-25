import { BaseRepository } from './BaseRepository';
import { Message } from '../../../shared/src/types';
import { MessageInput, MessageUpdate } from '../models/Message';

export interface MessageFilters {
  eventId?: string;
  recipientId?: string;
  messageType?: 'invitation' | 'reminder' | 'confirmation';
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduledBefore?: Date;
  scheduledAfter?: Date;
}

export class MessageRepository extends BaseRepository {
  async create(messageData: MessageInput): Promise<Message> {
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
    return this.mapRowToCamelCase<Message>(result[0]);
  }

  async findById(id: string): Promise<Message | null> {
    const query = 'SELECT * FROM messages WHERE id = $1';
    const result = await this.queryOne(query, [id]);
    return result ? this.mapRowToCamelCase<Message>(result) : null;
  }

  async findByEventId(eventId: string): Promise<Message[]> {
    const query = 'SELECT * FROM messages WHERE event_id = $1 ORDER BY created_at DESC';
    const results = await this.query(query, [eventId]);
    return this.mapRowsToCamelCase<Message>(results);
  }

  async findByRecipientId(recipientId: string): Promise<Message[]> {
    const query = 'SELECT * FROM messages WHERE recipient_id = $1 ORDER BY created_at DESC';
    const results = await this.query(query, [recipientId]);
    return this.mapRowsToCamelCase<Message>(results);
  }

  async findWithFilters(filters: MessageFilters): Promise<Message[]> {
    let query = 'SELECT * FROM messages WHERE 1=1';
    const values: any[] = [];
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
    return this.mapRowsToCamelCase<Message>(results);
  }

  async update(id: string, updates: MessageUpdate): Promise<Message | null> {
    const { query, values } = this.buildUpdateQuery('messages', updates, `WHERE id = $${Object.keys(updates).length + 1} RETURNING *`);
    values.push(id);

    const result = await this.queryOne(query, values);
    return result ? this.mapRowToCamelCase<Message>(result) : null;
  }

  async markAsSent(id: string): Promise<Message | null> {
    return this.update(id, {
      deliveryStatus: 'sent',
      sentAt: new Date()
    });
  }

  async markAsDelivered(id: string): Promise<Message | null> {
    return this.update(id, {
      deliveryStatus: 'delivered'
    });
  }

  async markAsFailed(id: string): Promise<Message | null> {
    return this.update(id, {
      deliveryStatus: 'failed'
    });
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM messages WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async findPendingMessages(): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE delivery_status = 'pending' 
      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
      ORDER BY created_at ASC
    `;
    
    const results = await this.query(query);
    return this.mapRowsToCamelCase<Message>(results);
  }

  async findScheduledMessages(beforeDate?: Date): Promise<Message[]> {
    let query = `
      SELECT * FROM messages 
      WHERE delivery_status = 'pending' 
      AND scheduled_at IS NOT NULL
    `;
    
    const values: any[] = [];
    
    if (beforeDate) {
      query += ' AND scheduled_at <= $1';
      values.push(beforeDate);
    }
    
    query += ' ORDER BY scheduled_at ASC';

    const results = await this.query(query, values);
    return this.mapRowsToCamelCase<Message>(results);
  }

  async getMessageStats(eventId: string): Promise<Record<string, number>> {
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
    const stats: Record<string, number> = {};
    
    results.forEach(row => {
      const key = `${row.message_type}_${row.delivery_status}`;
      stats[key] = parseInt(row.count);
    });

    return stats;
  }

  async getDeliveryStatusSummary(eventId: string): Promise<Record<string, number>> {
    const query = `
      SELECT delivery_status, COUNT(*) as count 
      FROM messages 
      WHERE event_id = $1 
      GROUP BY delivery_status
    `;
    
    const results = await this.query(query, [eventId]);
    const summary: Record<string, number> = {};
    
    results.forEach(row => {
      summary[row.delivery_status] = parseInt(row.count);
    });

    return summary;
  }

  async findRecent(limit: number = 10): Promise<Message[]> {
    const query = 'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1';
    const results = await this.query(query, [limit]);
    return this.mapRowsToCamelCase<Message>(results);
  }

  async findLatestMessageByRecipient(eventId: string, messageType?: string): Promise<Message[]> {
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
    return this.mapRowsToCamelCase<Message>(results);
  }

  async bulkCreate(messages: MessageInput[]): Promise<Message[]> {
    if (messages.length === 0) {
      return [];
    }

    return this.withTransaction(async (client) => {
      const createdMessages: Message[] = [];
      
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
        createdMessages.push(this.mapRowToCamelCase<Message>(result.rows[0]));
      }

      return createdMessages;
    });
  }
}