export declare class MockReminderExecutionRepository {
    private executions;
    private nextId;
    create(executionData: any): Promise<any>;
    findByEventId(eventId: string): Promise<any[]>;
    deleteByReminderScheduleId(scheduleId: string): Promise<void>;
    getExecutionStatistics(eventId: string): Promise<{
        lastExecutionDate?: Date;
        totalRemindersScheduled: number;
    }>;
    clear(): void;
}
//# sourceMappingURL=MockReminderExecutionRepository.d.ts.map