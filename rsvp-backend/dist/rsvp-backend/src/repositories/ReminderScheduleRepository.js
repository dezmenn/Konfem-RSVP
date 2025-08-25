"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduleRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ReminderScheduleRepository extends BaseRepository_1.BaseRepository {
    async create(scheduleData) {
        const query = `
      INSERT INTO reminder_schedules (
        event_id, trigger_days, message_template, is_active
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [
            scheduleData.eventId,
            scheduleData.triggerDays,
            scheduleData.messageTemplate,
            scheduleData.isActive !== undefined ? scheduleData.isActive : true
        ];
        const result = await this.query(query, values);
        return this.mapRowToCamelCase(result[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM reminder_schedules WHERE id = $1';
        const result = await this.queryOne(query, [id]);
        return result ? this.mapRowToCamelCase(result) : null;
    }
    async update(id, updates) {
        const { query, values } = this.buildUpdateQuery('reminder_schedules', updates, `WHERE id = $${Object.keys(updates).length + 1} RETURNING *`);
        values.push(id);
        const result = await this.queryOne(query, values);
        return result ? this.mapRowToCamelCase(result) : null;
    }
    async delete(id) {
        const query = 'DELETE FROM reminder_schedules WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    /**
     * Find all reminder schedules for an event
     */
    async findByEventId(eventId) {
        const query = 'SELECT * FROM reminder_schedules WHERE event_id = $1 ORDER BY trigger_days DESC';
        const results = await this.query(query, [eventId]);
        return this.mapRowsToCamelCase(results);
    }
    /**
     * Find active reminder schedules for an event
     */
    async findActiveByEventId(eventId) {
        const query = 'SELECT * FROM reminder_schedules WHERE event_id = $1 AND is_active = true ORDER BY trigger_days DESC';
        const results = await this.query(query, [eventId]);
        return this.mapRowsToCamelCase(results);
    }
    /**
     * Find reminder schedules that should be executed for events with upcoming deadlines
     */
    async findSchedulesToExecute() {
        const query = `
      SELECT 
        rs.*,
        e.rsvp_deadline,
        e.id as event_id
      FROM reminder_schedules rs
      JOIN events e ON rs.event_id = e.id
      WHERE rs.is_active = true
        AND e.rsvp_deadline > NOW()
        AND (e.rsvp_deadline - INTERVAL '1 day' * rs.trigger_days) <= NOW()
        AND NOT EXISTS (
          SELECT 1 FROM reminder_executions re 
          WHERE re.reminder_schedule_id = rs.id 
          AND DATE(re.executed_at) = CURRENT_DATE
        )
      ORDER BY rs.trigger_days DESC
    `;
        const results = await this.query(query);
        return results.map(row => ({
            ...this.mapRowToCamelCase(row),
            eventId: row.event_id,
            rsvpDeadline: new Date(row.rsvp_deadline)
        }));
    }
    /**
     * Check if a reminder schedule exists for specific trigger days
     */
    async existsForEventAndTriggerDays(eventId, triggerDays) {
        const query = 'SELECT 1 FROM reminder_schedules WHERE event_id = $1 AND trigger_days = $2 LIMIT 1';
        const result = await this.queryOne(query, [eventId, triggerDays]);
        return result !== null;
    }
    /**
     * Delete all reminder schedules for an event
     */
    async deleteByEventId(eventId) {
        const query = 'DELETE FROM reminder_schedules WHERE event_id = $1';
        const result = await this.pool.query(query, [eventId]);
        return result.rowCount || 0;
    }
    /**
     * Activate or deactivate a reminder schedule
     */
    async setActive(id, isActive) {
        const query = `
      UPDATE reminder_schedules 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
        const result = await this.queryOne(query, [isActive, id]);
        return result ? this.mapRowToCamelCase(result) : null;
    }
    /**
     * Get reminder schedule statistics for an event
     */
    async getStatistics(eventId) {
        // Get basic counts
        const countQuery = `
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_schedules,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_schedules,
        AVG(trigger_days) as average_trigger_days
      FROM reminder_schedules 
      WHERE event_id = $1
    `;
        // Get breakdown by trigger days
        const breakdownQuery = `
      SELECT 
        trigger_days,
        COUNT(*) as count,
        bool_and(is_active) as is_active
      FROM reminder_schedules 
      WHERE event_id = $1
      GROUP BY trigger_days
      ORDER BY trigger_days DESC
    `;
        const [countResults, breakdownResults] = await Promise.all([
            this.query(countQuery, [eventId]),
            this.query(breakdownQuery, [eventId])
        ]);
        const stats = countResults[0] || {};
        return {
            totalSchedules: parseInt(stats.total_schedules) || 0,
            activeSchedules: parseInt(stats.active_schedules) || 0,
            inactiveSchedules: parseInt(stats.inactive_schedules) || 0,
            averageTriggerDays: parseFloat(stats.average_trigger_days) || 0,
            schedulesByTriggerDays: breakdownResults.map(row => ({
                triggerDays: row.trigger_days,
                count: parseInt(row.count),
                isActive: row.is_active
            }))
        };
    }
}
exports.ReminderScheduleRepository = ReminderScheduleRepository;
//# sourceMappingURL=ReminderScheduleRepository.js.map