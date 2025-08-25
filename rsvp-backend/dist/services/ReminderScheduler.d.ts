export declare class ReminderScheduler {
    private reminderService;
    private intervalId;
    private isRunning;
    private checkIntervalMs;
    constructor(checkIntervalMs?: number);
    /**
     * Start the reminder scheduler
     */
    start(): void;
    /**
     * Stop the reminder scheduler
     */
    stop(): void;
    /**
     * Check if scheduler is running
     */
    isSchedulerRunning(): boolean;
    /**
     * Get scheduler status
     */
    getStatus(): {
        isRunning: boolean;
        checkIntervalMs: number;
        nextCheckIn?: number;
    };
    /**
     * Execute scheduled reminders
     */
    private executeScheduledReminders;
    /**
     * Update check interval
     */
    updateInterval(newIntervalMs: number): void;
    /**
     * Execute reminders manually (for testing/admin purposes)
     */
    executeNow(): Promise<any>;
}
export declare const getReminderScheduler: () => ReminderScheduler;
export declare const startReminderScheduler: () => void;
export declare const stopReminderScheduler: () => void;
//# sourceMappingURL=ReminderScheduler.d.ts.map