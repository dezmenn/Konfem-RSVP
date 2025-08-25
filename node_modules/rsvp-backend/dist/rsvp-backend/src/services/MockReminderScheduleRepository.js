"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockReminderScheduleRepository = void 0;
class MockReminderScheduleRepository {
    constructor() {
        this.schedules = [];
        this.nextId = 1;
    }
    async create(input) {
        const schedule = {
            id: `mock-schedule-${this.nextId++}`,
            eventId: input.eventId,
            triggerDays: input.triggerDays,
            messageTemplate: input.messageTemplate,
            isActive: input.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.schedules.push(schedule);
        return schedule;
    }
    async findByEventId(eventId) {
        return this.schedules.filter(schedule => schedule.eventId === eventId);
    }
    async findById(id) {
        return this.schedules.find(schedule => schedule.id === id) || null;
    }
    async update(id, updates) {
        const index = this.schedules.findIndex(schedule => schedule.id === id);
        if (index === -1)
            return null;
        this.schedules[index] = {
            ...this.schedules[index],
            ...updates,
            updatedAt: new Date()
        };
        return this.schedules[index];
    }
    async delete(id) {
        const index = this.schedules.findIndex(schedule => schedule.id === id);
        if (index === -1)
            return false;
        this.schedules.splice(index, 1);
        return true;
    }
    async existsForEventAndTriggerDays(eventId, triggerDays) {
        return this.schedules.some(schedule => schedule.eventId === eventId && schedule.triggerDays === triggerDays);
    }
    async findActiveByEventId(eventId) {
        return this.schedules.filter(schedule => schedule.eventId === eventId && schedule.isActive);
    }
    async findSchedulesToExecute() {
        // For mock implementation, return empty array since we don't have event data here
        // This method is used by the scheduler, but for manual execution we use other methods
        return [];
    }
    async setActive(id, isActive) {
        const index = this.schedules.findIndex(schedule => schedule.id === id);
        if (index === -1)
            return null;
        this.schedules[index] = {
            ...this.schedules[index],
            isActive,
            updatedAt: new Date()
        };
        return this.schedules[index];
    }
    async getStatistics(eventId) {
        const eventSchedules = this.schedules.filter(schedule => schedule.eventId === eventId);
        const activeSchedules = eventSchedules.filter(schedule => schedule.isActive);
        const inactiveSchedules = eventSchedules.filter(schedule => !schedule.isActive);
        const averageTriggerDays = eventSchedules.length > 0
            ? eventSchedules.reduce((sum, schedule) => sum + schedule.triggerDays, 0) / eventSchedules.length
            : 0;
        // Group by trigger days
        const triggerDaysMap = new Map();
        eventSchedules.forEach(schedule => {
            const existing = triggerDaysMap.get(schedule.triggerDays);
            if (existing) {
                existing.count++;
                existing.isActive = existing.isActive && schedule.isActive;
            }
            else {
                triggerDaysMap.set(schedule.triggerDays, { count: 1, isActive: schedule.isActive });
            }
        });
        const schedulesByTriggerDays = Array.from(triggerDaysMap.entries())
            .map(([triggerDays, data]) => ({
            triggerDays,
            count: data.count,
            isActive: data.isActive
        }))
            .sort((a, b) => b.triggerDays - a.triggerDays);
        return {
            totalSchedules: eventSchedules.length,
            activeSchedules: activeSchedules.length,
            inactiveSchedules: inactiveSchedules.length,
            averageTriggerDays,
            schedulesByTriggerDays
        };
    }
    // Helper method to clear all data (useful for testing)
    clear() {
        this.schedules = [];
        this.nextId = 1;
    }
}
exports.MockReminderScheduleRepository = MockReminderScheduleRepository;
//# sourceMappingURL=MockReminderScheduleRepository.js.map