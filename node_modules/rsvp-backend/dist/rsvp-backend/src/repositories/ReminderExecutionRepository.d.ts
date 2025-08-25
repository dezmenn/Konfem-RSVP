import { BaseRepository } from './BaseRepository';
import { ReminderExecution } from '../../../shared/src/types';
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
export declare class ReminderExecutionRepository extends BaseRepository {
    create(executionData: ReminderExecutionInput): Promise<ReminderExecution>;
    findById(id: string): Promise<ReminderExecution | null>;
    update(id: string, updates: ReminderExecutionUpdate): Promise<ReminderExecution | null>;
    delete(id: string): Promise<boolean>;
    /**
     * Find executions for a specific reminder schedule
     */
    findByReminderScheduleId(reminderScheduleId: string): Promise<ReminderExecution[]>;
    /**
     * Find executions for an event
     */
    findByEventId(eventId: string): Promise<ReminderExecution[]>;
    /**
     * Check if a reminder schedule was executed today
     */
    wasExecutedToday(reminderScheduleId: string): Promise<boolean>;
    /**
     * Get execution statistics for an event
     */
    getExecutionStatistics(eventId: string): Promise<{
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
    }>;
    /**
     * Delete executions for a reminder schedule
     */
    deleteByReminderScheduleId(reminderScheduleId: string): Promise<number>;
    /**
     * Delete executions for an event
     */
    deleteByEventId(eventId: string): Promise<number>;
}
//# sourceMappingURL=ReminderExecutionRepository.d.ts.map