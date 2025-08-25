import { MessagingService } from './MessagingService';
import { ReminderSchedule, ReminderExecution } from '../../../shared/src/types';
import { ReminderScheduleUpdate } from '../models/ReminderSchedule';
export interface ReminderConfiguration {
    eventId: string;
    schedules: Array<{
        triggerDays: number;
        messageTemplate: string;
        isActive?: boolean;
    }>;
}
export interface ReminderExecutionResult {
    reminderScheduleId: string;
    eventId: string;
    guestsProcessed: number;
    remindersScheduled: number;
    remindersSkipped: number;
    errors: string[];
    executionId: string;
}
export interface ReminderStatus {
    eventId: string;
    eventTitle: string;
    rsvpDeadline: Date;
    totalGuests: number;
    pendingGuests: number;
    activeSchedules: number;
    nextReminderDate?: Date;
    lastExecutionDate?: Date;
    totalRemindersScheduled: number;
    totalRemindersSent: number;
}
export declare class ReminderService {
    private reminderScheduleRepository;
    private reminderExecutionRepository;
    private guestRepository;
    private eventRepository;
    private messageRepository;
    private rsvpService;
    private messagingService;
    constructor(messagingService: MessagingService, mockEventService?: any, mockGuestService?: any);
    /**
     * Execute reminders for a specific schedule
     */
    executeReminders(scheduleId: string): Promise<ReminderExecutionResult>;
    /**
     * Execute all active reminders for an event
     */
    executeAllReminders(eventId: string): Promise<ReminderExecutionResult[]>;
    /**
     * Configure reminder schedules for an event
     */
    configureReminders(config: ReminderConfiguration): Promise<ReminderSchedule[]>;
    /**
     * Get reminder schedules for an event
     */
    getReminderSchedules(eventId: string): Promise<ReminderSchedule[]>;
    /**
     * Update a reminder schedule
     */
    updateReminderSchedule(scheduleId: string, update: ReminderScheduleUpdate): Promise<ReminderSchedule | null>;
    /**
     * Delete a reminder schedule
     */
    deleteReminderSchedule(scheduleId: string): Promise<boolean>;
    /**
     * Execute all due reminder schedules
     */
    executeScheduledReminders(): Promise<ReminderExecutionResult[]>;
    /**
     * Execute a specific reminder schedule
     */
    executeReminderSchedule(schedule: ReminderSchedule): Promise<ReminderExecutionResult>;
    /**
     * Stop reminders for a guest who has responded
     */
    stopRemindersForGuest(guestId: string, eventId: string): Promise<void>;
    /**
     * Get reminder status for an event
     */
    getReminderStatus(eventId: string): Promise<ReminderStatus>;
    /**
     * Get reminder execution history for an event
     */
    getReminderExecutions(eventId: string): Promise<ReminderExecution[]>;
    /**
     * Create default reminder schedules for an event
     */
    createDefaultReminders(eventId: string): Promise<ReminderSchedule[]>;
    /**
     * Activate or deactivate a reminder schedule
     */
    setReminderScheduleActive(scheduleId: string, isActive: boolean): Promise<ReminderSchedule | null>;
    /**
     * Get reminder statistics for an event
     */
    getReminderStatistics(eventId: string): Promise<{
        scheduleStats: any;
        executionStats: any;
        messageStats: any;
    }>;
    /**
     * Utility method for delays
     */
    private delay;
}
//# sourceMappingURL=ReminderService.d.ts.map