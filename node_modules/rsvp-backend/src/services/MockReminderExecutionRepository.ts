export class MockReminderExecutionRepository {
  private executions: any[] = [];
  private nextId = 1;

  async create(executionData: any): Promise<any> {
    const execution = {
      id: `mock-execution-${this.nextId++}`,
      ...executionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.executions.push(execution);
    return execution;
  }

  async findByEventId(eventId: string): Promise<any[]> {
    return this.executions.filter(exec => exec.eventId === eventId);
  }

  async deleteByReminderScheduleId(scheduleId: string): Promise<void> {
    this.executions = this.executions.filter(exec => exec.reminderScheduleId !== scheduleId);
  }

  async getExecutionStatistics(eventId: string): Promise<{
    lastExecutionDate?: Date;
    totalRemindersScheduled: number;
  }> {
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
  clear(): void {
    this.executions = [];
    this.nextId = 1;
  }
}