"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopReminderScheduler = exports.startReminderScheduler = exports.getReminderScheduler = exports.ReminderScheduler = void 0;
const ReminderService_1 = require("./ReminderService");
const MessagingService_1 = require("./MessagingService");
const WhatsAppMockService_1 = require("./WhatsAppMockService");
const MessageRepository_1 = require("../repositories/MessageRepository");
const logger_1 = require("../utils/logger");
class ReminderScheduler {
    constructor(checkIntervalMs = 60000) {
        this.intervalId = null;
        this.isRunning = false;
        // Initialize services
        const messageRepository = new MessageRepository_1.MessageRepository();
        const whatsAppService = new WhatsAppMockService_1.WhatsAppMockService(messageRepository);
        const messagingService = new MessagingService_1.MessagingService(whatsAppService);
        this.reminderService = new ReminderService_1.ReminderService(messagingService);
        this.checkIntervalMs = checkIntervalMs;
    }
    /**
     * Start the reminder scheduler
     */
    start() {
        if (this.isRunning) {
            logger_1.logger.warn('Reminder scheduler is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info(`Starting reminder scheduler with ${this.checkIntervalMs}ms interval`);
        // Execute immediately on start
        this.executeScheduledReminders();
        // Set up recurring execution
        this.intervalId = setInterval(() => {
            this.executeScheduledReminders();
        }, this.checkIntervalMs);
    }
    /**
     * Stop the reminder scheduler
     */
    stop() {
        if (!this.isRunning) {
            logger_1.logger.warn('Reminder scheduler is not running');
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger_1.logger.info('Reminder scheduler stopped');
    }
    /**
     * Check if scheduler is running
     */
    isSchedulerRunning() {
        return this.isRunning;
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            checkIntervalMs: this.checkIntervalMs,
            nextCheckIn: this.isRunning ? this.checkIntervalMs : undefined
        };
    }
    /**
     * Execute scheduled reminders
     */
    async executeScheduledReminders() {
        try {
            logger_1.logger.debug('Checking for scheduled reminders to execute');
            const results = await this.reminderService.executeScheduledReminders();
            if (results.length > 0) {
                const summary = {
                    totalExecutions: results.length,
                    totalGuestsProcessed: results.reduce((sum, r) => sum + r.guestsProcessed, 0),
                    totalRemindersScheduled: results.reduce((sum, r) => sum + r.remindersScheduled, 0),
                    totalRemindersSkipped: results.reduce((sum, r) => sum + r.remindersSkipped, 0),
                    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
                };
                logger_1.logger.info('Scheduled reminder execution completed:', summary);
            }
            else {
                logger_1.logger.debug('No scheduled reminders due for execution');
            }
        }
        catch (error) {
            logger_1.logger.error('Error executing scheduled reminders:', error);
        }
    }
    /**
     * Update check interval
     */
    updateInterval(newIntervalMs) {
        if (newIntervalMs < 10000) { // Minimum 10 seconds
            throw new Error('Check interval must be at least 10 seconds');
        }
        this.checkIntervalMs = newIntervalMs;
        if (this.isRunning) {
            // Restart with new interval
            this.stop();
            this.start();
            logger_1.logger.info(`Reminder scheduler interval updated to ${newIntervalMs}ms`);
        }
    }
    /**
     * Execute reminders manually (for testing/admin purposes)
     */
    async executeNow() {
        logger_1.logger.info('Manual reminder execution triggered');
        try {
            const results = await this.reminderService.executeScheduledReminders();
            const summary = {
                totalExecutions: results.length,
                totalGuestsProcessed: results.reduce((sum, r) => sum + r.guestsProcessed, 0),
                totalRemindersScheduled: results.reduce((sum, r) => sum + r.remindersScheduled, 0),
                totalRemindersSkipped: results.reduce((sum, r) => sum + r.remindersSkipped, 0),
                totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
            };
            logger_1.logger.info('Manual reminder execution completed:', summary);
            return {
                success: true,
                executions: results,
                summary
            };
        }
        catch (error) {
            logger_1.logger.error('Error in manual reminder execution:', error);
            throw error;
        }
    }
}
exports.ReminderScheduler = ReminderScheduler;
// Singleton instance for global use
let schedulerInstance = null;
const getReminderScheduler = () => {
    if (!schedulerInstance) {
        schedulerInstance = new ReminderScheduler();
    }
    return schedulerInstance;
};
exports.getReminderScheduler = getReminderScheduler;
const startReminderScheduler = () => {
    const scheduler = (0, exports.getReminderScheduler)();
    scheduler.start();
};
exports.startReminderScheduler = startReminderScheduler;
const stopReminderScheduler = () => {
    if (schedulerInstance) {
        schedulerInstance.stop();
    }
};
exports.stopReminderScheduler = stopReminderScheduler;
//# sourceMappingURL=ReminderScheduler.js.map