import { BaseRepository } from './BaseRepository';
import { ReminderExecution } from '../../../shared/src/types';
import { logger } from '../utils/logger';

export interface ReminderExecutionInput {
  reminderScheduleId: string;
  eventId: string;
  guestsProcessed: number;
  remindersScheduled: number;
  remindersSkipped: number;
  errors: string[];
}

export interface ReminderExecutionUpdate {
  guestsProcessed?: number;
  remindersScheduled?: number;
  remindersSkipped?: number;
  errors?: string[];
}

export class ReminderExecutionRepository extends BaseRepository {

  async create(executionData: ReminderExecutionInput): Promise<ReminderExecution> {
    const query = `
      INSERT INTO reminder_executions (
        reminder_schedule_id, event_id, guests_processed, 
        reminders_scheduled, reminders_skipped, errors
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      executionData.reminderScheduleId,
      executionData.eventId,
      executionData.guestsProcessed,
      executionData.remindersScheduled,
      executionData.remindersSkipped,
      JSON.stringify(executionData.errors)
    ];

    const result = await this.query(query, values);
    const row = result[0];
    return {
      id: row.id,
      reminderScheduleId: row.reminder_schedule_id,
      invitationScheduleId: row.reminder_schedule_id, // For backward compatibility
      eventId: row.event_id,
      executedAt: new Date(row.executed_at),
      guestsProcessed: row.guests_processed,
      remindersScheduled: row.reminders_scheduled,
      invitationsScheduled: row.reminders_scheduled, // For backward compatibility
      remindersSkipped: row.reminders_skipped,
      invitationsSkipped: row.reminders_skipped, // For backward compatibility
      errors: JSON.parse(row.errors || '[]')
    };
  }

  async findById(id: string): Promise<ReminderExecution | null> {
    const query = 'SELECT * FROM reminder_executions WHERE id = $1';
    const result = await this.queryOne(query, [id]);
    if (!result) return null;
    
    return {
      id: result.id,
      reminderScheduleId: result.reminder_schedule_id,
      invitationScheduleId: result.reminder_schedule_id, // For backward compatibility
      eventId: result.event_id,
      executedAt: new Date(result.executed_at),
      guestsProcessed: result.guests_processed,
      remindersScheduled: result.reminders_scheduled,
      invitationsScheduled: result.reminders_scheduled, // For backward compatibility
      remindersSkipped: result.reminders_skipped,
      invitationsSkipped: result.reminders_skipped, // For backward compatibility
      errors: JSON.parse(result.errors || '[]')
    };
  }

  async update(id: string, updates: ReminderExecutionUpdate): Promise<ReminderExecution | null> {
    const updateData: any = {};
    
    if (updates.guestsProcessed !== undefined) {
      updateData.guestsProcessed = updates.guestsProcessed;
    }
    if (updates.remindersScheduled !== undefined) {
      updateData.remindersScheduled = updates.remindersScheduled;
    }
    if (updates.remindersSkipped !== undefined) {
      updateData.remindersSkipped = updates.remindersSkipped;
    }
    if (updates.errors !== undefined) {
      updateData.errors = JSON.stringify(updates.errors);
    }

    const { query, values } = this.buildUpdateQuery('reminder_executions', updateData, `WHERE id = $${Object.keys(updateData).length + 1} RETURNING *`);
    values.push(id);

    const result = await this.queryOne(query, values);
    if (!result) return null;
    
    return {
      id: result.id,
      reminderScheduleId: result.reminder_schedule_id,
      invitationScheduleId: result.reminder_schedule_id, // For backward compatibility
      eventId: result.event_id,
      executedAt: new Date(result.executed_at),
      guestsProcessed: result.guests_processed,
      remindersScheduled: result.reminders_scheduled,
      invitationsScheduled: result.reminders_scheduled, // For backward compatibility
      remindersSkipped: result.reminders_skipped,
      invitationsSkipped: result.reminders_skipped, // For backward compatibility
      errors: JSON.parse(result.errors || '[]')
    };
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM reminder_executions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Find executions for a specific reminder schedule
   */
  async findByReminderScheduleId(reminderScheduleId: string): Promise<ReminderExecution[]> {
    const query = 'SELECT * FROM reminder_executions WHERE reminder_schedule_id = $1 ORDER BY executed_at DESC';
    const results = await this.query(query, [reminderScheduleId]);
    
    return results.map(row => ({
      id: row.id,
      reminderScheduleId: row.reminder_schedule_id,
      invitationScheduleId: row.reminder_schedule_id, // For backward compatibility
      eventId: row.event_id,
      executedAt: new Date(row.executed_at),
      guestsProcessed: row.guests_processed,
      remindersScheduled: row.reminders_scheduled,
      invitationsScheduled: row.reminders_scheduled, // For backward compatibility
      remindersSkipped: row.reminders_skipped,
      invitationsSkipped: row.reminders_skipped, // For backward compatibility
      errors: JSON.parse(row.errors || '[]')
    }));
  }

  /**
   * Find executions for an event
   */
  async findByEventId(eventId: string): Promise<ReminderExecution[]> {
    const query = 'SELECT * FROM reminder_executions WHERE event_id = $1 ORDER BY executed_at DESC';
    const results = await this.query(query, [eventId]);
    
    return results.map(row => ({
      id: row.id,
      reminderScheduleId: row.reminder_schedule_id,
      invitationScheduleId: row.reminder_schedule_id, // For backward compatibility
      eventId: row.event_id,
      executedAt: new Date(row.executed_at),
      guestsProcessed: row.guests_processed,
      remindersScheduled: row.reminders_scheduled,
      invitationsScheduled: row.reminders_scheduled, // For backward compatibility
      remindersSkipped: row.reminders_skipped,
      invitationsSkipped: row.reminders_skipped, // For backward compatibility
      errors: JSON.parse(row.errors || '[]')
    }));
  }

  /**
   * Check if a reminder schedule was executed today
   */
  async wasExecutedToday(reminderScheduleId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM reminder_executions 
      WHERE reminder_schedule_id = $1 
      AND DATE(executed_at) = CURRENT_DATE 
      LIMIT 1
    `;
    const result = await this.queryOne(query, [reminderScheduleId]);
    return result !== null;
  }

  /**
   * Get execution statistics for an event
   */
  async getExecutionStatistics(eventId: string): Promise<{
    totalExecutions: number;
    totalGuestsProcessed: number;
    totalRemindersScheduled: number;
    totalRemindersSkipped: number;
    totalErrors: number;
    lastExecutionDate?: Date;
    executionsByDate: Array<{
      date: string;
      executions: number;
      guestsProcessed: number;
      remindersScheduled: number;
    }>;
  }> {
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_executions,
        COALESCE(SUM(guests_processed), 0) as total_guests_processed,
        COALESCE(SUM(reminders_scheduled), 0) as total_reminders_scheduled,
        COALESCE(SUM(reminders_skipped), 0) as total_reminders_skipped,
        COALESCE(SUM(array_length(string_to_array(errors, ','), 1)), 0) as total_errors,
        MAX(executed_at) as last_execution_date
      FROM reminder_executions 
      WHERE event_id = $1
    `;

    // Get executions by date
    const dailyQuery = `
      SELECT 
        DATE(executed_at) as execution_date,
        COUNT(*) as executions,
        COALESCE(SUM(guests_processed), 0) as guests_processed,
        COALESCE(SUM(reminders_scheduled), 0) as reminders_scheduled
      FROM reminder_executions 
      WHERE event_id = $1
      GROUP BY DATE(executed_at)
      ORDER BY execution_date DESC
      LIMIT 30
    `;

    const [statsResults, dailyResults] = await Promise.all([
      this.query(statsQuery, [eventId]),
      this.query(dailyQuery, [eventId])
    ]);

    const stats = statsResults[0] || {};
    
    return {
      totalExecutions: parseInt(stats.total_executions) || 0,
      totalGuestsProcessed: parseInt(stats.total_guests_processed) || 0,
      totalRemindersScheduled: parseInt(stats.total_reminders_scheduled) || 0,
      totalRemindersSkipped: parseInt(stats.total_reminders_skipped) || 0,
      totalErrors: parseInt(stats.total_errors) || 0,
      lastExecutionDate: stats.last_execution_date ? new Date(stats.last_execution_date) : undefined,
      executionsByDate: dailyResults.map(row => ({
        date: row.execution_date,
        executions: parseInt(row.executions),
        guestsProcessed: parseInt(row.guests_processed),
        remindersScheduled: parseInt(row.reminders_scheduled)
      }))
    };
  }

  /**
   * Delete executions for a reminder schedule
   */
  async deleteByReminderScheduleId(reminderScheduleId: string): Promise<number> {
    const query = 'DELETE FROM reminder_executions WHERE reminder_schedule_id = $1';
    const result = await this.pool.query(query, [reminderScheduleId]);
    return result.rowCount || 0;
  }

  /**
   * Delete executions for an event
   */
  async deleteByEventId(eventId: string): Promise<number> {
    const query = 'DELETE FROM reminder_executions WHERE event_id = $1';
    const result = await this.pool.query(query, [eventId]);
    return result.rowCount || 0;
  }
}