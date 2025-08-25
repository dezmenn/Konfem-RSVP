import { InvitationSchedule } from '../../../shared/src/types';
import { InvitationScheduleInput, InvitationScheduleUpdate } from '../models/InvitationSchedule';

export class MockInvitationScheduleRepository {
  private schedules: Map<string, InvitationSchedule> = new Map();
  private nextId = 1;

  async create(input: InvitationScheduleInput): Promise<InvitationSchedule> {
    const id = `schedule-${this.nextId++}`;
    const now = new Date();
    
    const schedule: InvitationSchedule = {
      id,
      eventId: input.eventId,
      triggerDays: input.triggerDays,
      messageTemplate: input.messageTemplate,
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    this.schedules.set(id, schedule);
    return schedule;
  }

  async findById(id: string): Promise<InvitationSchedule | null> {
    return this.schedules.get(id) || null;
  }

  async findByEventId(eventId: string): Promise<InvitationSchedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.eventId === eventId
    );
  }

  async findActiveByEventId(eventId: string): Promise<InvitationSchedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.eventId === eventId && schedule.isActive
    );
  }

  async findSchedulesToExecute(): Promise<InvitationSchedule[]> {
    // For demo purposes, return empty array
    // In real implementation, this would check trigger dates
    return [];
  }

  async update(id: string, update: InvitationScheduleUpdate): Promise<InvitationSchedule | null> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return null;
    }

    const updatedSchedule: InvitationSchedule = {
      ...schedule,
      ...update,
      updatedAt: new Date()
    };

    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async delete(id: string): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async setActive(id: string, isActive: boolean): Promise<InvitationSchedule | null> {
    return this.update(id, { isActive });
  }

  async existsForEventAndTriggerDays(eventId: string, triggerDays: number): Promise<boolean> {
    return Array.from(this.schedules.values()).some(
      schedule => schedule.eventId === eventId && schedule.triggerDays === triggerDays
    );
  }

  async getStatistics(eventId: string): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    inactiveSchedules: number;
  }> {
    const eventSchedules = Array.from(this.schedules.values()).filter(
      schedule => schedule.eventId === eventId
    );

    return {
      totalSchedules: eventSchedules.length,
      activeSchedules: eventSchedules.filter(s => s.isActive).length,
      inactiveSchedules: eventSchedules.filter(s => !s.isActive).length
    };
  }

  // Clear all data (for testing)
  clear(): void {
    this.schedules.clear();
    this.nextId = 1;
  }
}