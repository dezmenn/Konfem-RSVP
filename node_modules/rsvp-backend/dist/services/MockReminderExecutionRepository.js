"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockReminderExecutionRepository = void 0;
class MockReminderExecutionRepository {
    constructor() {
        this.executions = [];
        this.nextId = 1;
    }
    async create(executionData) {
        const execution = {
            id: `mock-execution-${this.nextId++}`,
            ...executionData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.executions.push(execution);
        return execution;
    }
    async findByEventId(eventId) {
        return this.executions.filter(exec => exec.eventId === eventId);
    }
    async deleteByReminderScheduleId(scheduleId) {
        this.executions = this.executions.filter(exec => exec.reminderScheduleId !== scheduleId);
    }
    async getExecutionStatistics(eventId) {
        const eventExecutions = this.executions.filter(exec => exec.eventId === eventId);
        const lastExecution = eventExecutions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const totalRemindersScheduled = eventExecutions
            .reduce((sum, exec) => sum + (exec.remindersScheduled || 0), 0);
        return {
            lastExecutionDate: lastExecution ? new Date(lastExecution.createdAt) : undefined,
            totalRemindersScheduled
        };
    }
    // Helper method to clear all data (useful for testing)
    clear() {
        this.executions = [];
        this.nextId = 1;
    }
}
exports.MockReminderExecutionRepository = MockReminderExecutionRepository;
//# sourceMappingURL=MockReminderExecutionRepository.js.map