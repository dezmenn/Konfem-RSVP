import { ReminderSchedule } from '../../../shared/src/types';
import { ReminderScheduleInput } from '../models/ReminderSchedule';
export declare class MockReminderScheduleRepository {
    private schedules;
    private nextId;
    create(input: ReminderScheduleInput): Promise<ReminderSchedule>;
    findByEventId(eventId: string): Promise<ReminderSchedule[]>;
    findById(id: string): Promise<ReminderSchedule | null>;
    update(id: string, updates: Partial<ReminderScheduleInput>): Promise<ReminderSchedule | null>;
    delete(id: string): Promise<boolean>;
    existsForEventAndTriggerDays(eventId: string, triggerDays: number): Promise<boolean>;
    findActiveByEventId(eventId: string): Promise<ReminderSchedule[]>;
    findSchedulesToExecute(): Promise<Array<ReminderSchedule & {
        eventId: string;
        rsvpDeadline: Date;
    }>>;
    setActive(id: string, isActive: boolean): Promise<ReminderSchedule | null>;
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
    clear(): void;
}
//# sourceMappingURL=MockReminderScheduleRepository.d.ts.map