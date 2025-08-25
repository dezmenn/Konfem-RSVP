import { BaseRepository } from './BaseRepository';
import { ReminderSchedule } from '../../../shared/src/types';
import { ReminderScheduleInput, ReminderScheduleUpdate } from '../models/ReminderSchedule';
export declare class ReminderScheduleRepository extends BaseRepository {
    create(scheduleData: ReminderScheduleInput): Promise<ReminderSchedule>;
    findById(id: string): Promise<ReminderSchedule | null>;
    update(id: string, updates: ReminderScheduleUpdate): Promise<ReminderSchedule | null>;
    delete(id: string): Promise<boolean>;
    /**
     * Find all reminder schedules for an event
     */
    findByEventId(eventId: string): Promise<ReminderSchedule[]>;
    /**
     * Find active reminder schedules for an event
     */
    findActiveByEventId(eventId: string): Promise<ReminderSchedule[]>;
    /**
     * Find reminder schedules that should be executed for events with upcoming deadlines
     */
    findSchedulesToExecute(): Promise<Array<ReminderSchedule & {
        eventId: string;
        rsvpDeadline: Date;
    }>>;
    /**
     * Check if a reminder schedule exists for specific trigger days
     */
    existsForEventAndTriggerDays(eventId: string, triggerDays: number): Promise<boolean>;
    /**
     * Delete all reminder schedules for an event
     */
    deleteByEventId(eventId: string): Promise<number>;
    /**
     * Activate or deactivate a reminder schedule
     */
    setActive(id: string, isActive: boolean): Promise<ReminderSchedule | null>;
    /**
     * Get reminder schedule statistics for an event
     */
    getStatistics(eventId: string): Promise<{
        totalSchedules: number;
        activeSchedules: number;
        inactiveSchedules: number;
        averageTriggerDays: number;
        schedulesByTriggerDays: Array<{
            triggerDays: number;
            count: number;
            isActive: boolean;
        }>;
    }>;
}
//# sourceMappingURL=ReminderScheduleRepository.d.ts.map