import { InvitationExecution } from '../../../shared/src/types';

export interface InvitationExecutionInput {
  invitationScheduleId: string;
  eventId: string;
  guestsProcessed: number;
  invitationsScheduled: number;
  invitationsSkipped: number;
  errors: string[];
}

export class MockInvitationExecutionRepository {
  private executions: Map<string, InvitationExecution> = new Map();
  private nextId = 1;

  async create(input: InvitationExecutionInput): Promise<InvitationExecution> {
    const id = `execution-${this.nextId++}`;
    const now = new Date();
    
    const execution: InvitationExecution = {
      id,
      invitationScheduleId: input.invitationScheduleId,
      eventId: input.eventId,
      executedAt: now,
      guestsProcessed: input.guestsProcessed,
      invitationsScheduled: input.invitationsScheduled,
      invitationsSkipped: input.invitationsSkipped,
      errors: input.errors
    };

    this.executions.set(id, execution);
    return execution;
  }

  async findById(id: string): Promise<InvitationExecution | null> {
    return this.executions.get(id) || null;
  }

  async findByEventId(eventId: string): Promise<InvitationExecution[]> {
    return Array.from(this.executions.values())
      .filter(execution => execution.eventId === eventId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  async findByInvitationScheduleId(scheduleId: string): Promise<InvitationExecution[]> {
    return Array.from(this.executions.values())
      .filter(execution => execution.invitationScheduleId === scheduleId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  async deleteByInvitationScheduleId(scheduleId: string): Promise<void> {
    const toDelete = Array.from(this.executions.entries())
      .filter(([_, execution]) => execution.invitationScheduleId === scheduleId)
      .map(([id, _]) => id);

    toDelete.forEach(id => this.executions.delete(id));
  }

  async getExecutionStatistics(eventId: string): Promise<{
    totalExecutions: number;
    totalInvitationsScheduled: number;
    totalInvitationsSkipped: number;
    totalErrors: number;
    lastExecutionDate?: Date;
  }> {
    const eventExecutions = Array.from(this.executions.values()).filter(
      execution => execution.eventId === eventId
    );

    const lastExecution = eventExecutions.sort(
      (a, b) => b.executedAt.getTime() - a.executedAt.getTime()
    )[0];

    return {
      totalExecutions: eventExecutions.length,
      totalInvitationsScheduled: eventExecutions.reduce((sum, e) => sum + e.invitationsScheduled, 0),
      totalInvitationsSkipped: eventExecutions.reduce((sum, e) => sum + e.invitationsSkipped, 0),
      totalErrors: eventExecutions.reduce((sum, e) => sum + e.errors.length, 0),
      lastExecutionDate: lastExecution?.executedAt
    };
  }

  // Clear all data (for testing)
  clear(): void {
    this.executions.clear();
    this.nextId = 1;
  }
}