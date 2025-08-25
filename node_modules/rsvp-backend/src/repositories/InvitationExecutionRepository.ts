import { InvitationExecution } from '../../../shared/src/types';

export interface InvitationExecutionInput {
  invitationScheduleId: string;
  eventId: string;
  guestsProcessed: number;
  invitationsScheduled: number;
  invitationsSkipped: number;
  errors: string[];
}

export class InvitationExecutionRepository {
  async create(input: InvitationExecutionInput): Promise<InvitationExecution> {
    // This would be implemented with actual database operations
    // For now, throw an error since we're using mock services in demo mode
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }

  async findById(id: string): Promise<InvitationExecution | null> {
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }

  async findByEventId(eventId: string): Promise<InvitationExecution[]> {
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }

  async findByInvitationScheduleId(scheduleId: string): Promise<InvitationExecution[]> {
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }

  async deleteByInvitationScheduleId(scheduleId: string): Promise<void> {
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }

  async getExecutionStatistics(eventId: string): Promise<{
    totalExecutions: number;
    totalInvitationsScheduled: number;
    totalInvitationsSkipped: number;
    totalErrors: number;
    lastExecutionDate?: Date;
  }> {
    throw new Error('InvitationExecutionRepository not implemented - use MockInvitationExecutionRepository in demo mode');
  }
}