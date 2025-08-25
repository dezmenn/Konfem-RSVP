"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppMockService = void 0;
const logger_1 = require("../utils/logger");
class WhatsAppMockService {
    constructor(messageRepository, config) {
        this.sentMessages = new Map();
        this.deliveryStatuses = new Map();
        this.rateLimitTracker = new Map(); // phone -> timestamps
        this.messageRepository = messageRepository;
        this.config = {
            enableRateLimiting: true,
            rateLimitPerMinute: 10,
            simulateDeliveryDelay: true,
            deliveryDelayMs: 2000,
            errorRate: 0.1, // 10% error rate by default
            deliveryFailureRate: 0.05, // 5% delivery failure rate by default
            enableLogging: true,
            ...config
        };
    }
    async sendMessage(to, content, messageId) {
        try {
            // Check rate limiting
            if (this.config.enableRateLimiting && this.isRateLimited(to)) {
                const error = `Rate limit exceeded for ${to}. Max ${this.config.rateLimitPerMinute} messages per minute.`;
                this.logMessage('RATE_LIMITED', { to, content, messageId, error });
                // Update message status to failed
                await this.messageRepository.markAsFailed(messageId);
                this.setDeliveryStatus(messageId, 'failed', error);
                return { success: false, error };
            }
            // Track rate limiting
            this.trackRateLimit(to);
            // Simulate random errors
            if (Math.random() < this.config.errorRate) {
                const error = 'Simulated WhatsApp API error';
                this.logMessage('SEND_FAILED', { to, content, messageId, error });
                await this.messageRepository.markAsFailed(messageId);
                this.setDeliveryStatus(messageId, 'failed', error);
                return { success: false, error };
            }
            // Store sent message
            const whatsAppMessage = {
                to,
                content,
                messageId,
                timestamp: new Date()
            };
            this.sentMessages.set(messageId, whatsAppMessage);
            this.logMessage('SENT', whatsAppMessage);
            // Mark as sent in database
            await this.messageRepository.markAsSent(messageId);
            this.setDeliveryStatus(messageId, 'sent');
            // Simulate delivery delay
            if (this.config.simulateDeliveryDelay) {
                setTimeout(() => {
                    this.simulateDelivery(messageId);
                }, this.config.deliveryDelayMs);
            }
            else {
                // Immediate delivery
                this.simulateDelivery(messageId);
            }
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logMessage('SEND_ERROR', { to, content, messageId, error: errorMessage });
            await this.messageRepository.markAsFailed(messageId);
            this.setDeliveryStatus(messageId, 'failed', errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    async sendBulkMessages(messages) {
        const results = [];
        let successfulSends = 0;
        let failedSends = 0;
        this.logMessage('BULK_SEND_START', { totalMessages: messages.length });
        for (const message of messages) {
            const result = await this.sendMessage(message.to, message.content, message.messageId);
            results.push({
                messageId: message.messageId,
                success: result.success,
                error: result.error
            });
            if (result.success) {
                successfulSends++;
            }
            else {
                failedSends++;
            }
            // Add small delay between bulk messages to simulate real API behavior
            await this.delay(100);
        }
        const bulkResult = {
            totalMessages: messages.length,
            successfulSends,
            failedSends,
            results
        };
        this.logMessage('BULK_SEND_COMPLETE', bulkResult);
        return bulkResult;
    }
    async simulateDelivery(messageId) {
        try {
            // Simulate occasional delivery failures based on config
            if (Math.random() < this.config.deliveryFailureRate) {
                this.logMessage('DELIVERY_FAILED', { messageId });
                this.setDeliveryStatus(messageId, 'failed', 'Message delivery failed');
                try {
                    await this.messageRepository.markAsFailed(messageId);
                }
                catch (repoError) {
                    // Repository error doesn't affect in-memory status
                    logger_1.logger.error('Repository error marking as failed:', repoError);
                }
                return;
            }
            // Mark as delivered
            this.logMessage('DELIVERED', { messageId });
            this.setDeliveryStatus(messageId, 'delivered');
            try {
                await this.messageRepository.markAsDelivered(messageId);
            }
            catch (repoError) {
                // Repository error doesn't affect in-memory status
                logger_1.logger.error('Repository error marking as delivered:', repoError);
            }
        }
        catch (error) {
            logger_1.logger.error('Error simulating delivery:', error);
            // If there's an error, mark as failed in memory
            this.setDeliveryStatus(messageId, 'failed', 'Delivery simulation error');
        }
    }
    isRateLimited(phoneNumber) {
        if (!this.config.enableRateLimiting) {
            return false;
        }
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const timestamps = this.rateLimitTracker.get(phoneNumber) || [];
        // Remove timestamps older than 1 minute
        const recentTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
        this.rateLimitTracker.set(phoneNumber, recentTimestamps);
        return recentTimestamps.length >= this.config.rateLimitPerMinute;
    }
    trackRateLimit(phoneNumber) {
        if (!this.config.enableRateLimiting) {
            return;
        }
        const timestamps = this.rateLimitTracker.get(phoneNumber) || [];
        timestamps.push(Date.now());
        this.rateLimitTracker.set(phoneNumber, timestamps);
    }
    setDeliveryStatus(messageId, status, errorMessage) {
        this.deliveryStatuses.set(messageId, {
            messageId,
            status,
            timestamp: new Date(),
            errorMessage
        });
    }
    logMessage(event, data) {
        if (!this.config.enableLogging) {
            return;
        }
        const logData = {
            event,
            timestamp: new Date().toISOString(),
            ...data
        };
        switch (event) {
            case 'SENT':
                logger_1.logger.info(`📱 WhatsApp Mock: Message sent to ${data.to}`, logData);
                console.log(`📱 [WhatsApp Mock] Message sent to ${data.to}: "${data.content.substring(0, 50)}..."`);
                break;
            case 'DELIVERED':
                logger_1.logger.info(`✅ WhatsApp Mock: Message delivered (${data.messageId})`, logData);
                console.log(`✅ [WhatsApp Mock] Message delivered: ${data.messageId}`);
                break;
            case 'SEND_FAILED':
            case 'DELIVERY_FAILED':
                logger_1.logger.warn(`❌ WhatsApp Mock: ${event} (${data.messageId})`, logData);
                console.log(`❌ [WhatsApp Mock] ${event}: ${data.messageId} - ${data.error || 'Unknown error'}`);
                break;
            case 'RATE_LIMITED':
                logger_1.logger.warn(`⏱️ WhatsApp Mock: Rate limited (${data.to})`, logData);
                console.log(`⏱️ [WhatsApp Mock] Rate limited: ${data.to}`);
                break;
            case 'BULK_SEND_START':
                logger_1.logger.info(`📦 WhatsApp Mock: Bulk send started (${data.totalMessages} messages)`, logData);
                console.log(`📦 [WhatsApp Mock] Starting bulk send of ${data.totalMessages} messages`);
                break;
            case 'BULK_SEND_COMPLETE':
                logger_1.logger.info(`📦 WhatsApp Mock: Bulk send completed`, logData);
                console.log(`📦 [WhatsApp Mock] Bulk send completed: ${data.successfulSends} sent, ${data.failedSends} failed`);
                break;
            default:
                logger_1.logger.info(`WhatsApp Mock: ${event}`, logData);
                console.log(`[WhatsApp Mock] ${event}:`, data);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Admin interface methods
    getSentMessages() {
        return Array.from(this.sentMessages.values());
    }
    getDeliveryStatuses() {
        return Array.from(this.deliveryStatuses.values());
    }
    getMessageById(messageId) {
        return this.sentMessages.get(messageId);
    }
    getDeliveryStatus(messageId) {
        return this.deliveryStatuses.get(messageId);
    }
    getStats() {
        const statuses = Array.from(this.deliveryStatuses.values());
        const totalSent = statuses.filter(s => s.status === 'sent').length;
        const totalDelivered = statuses.filter(s => s.status === 'delivered').length;
        const totalFailed = statuses.filter(s => s.status === 'failed').length;
        const totalPending = statuses.filter(s => s.status === 'pending').length;
        // Total messages that were successfully sent (either sent or delivered)
        const totalSuccessfulSends = totalSent + totalDelivered;
        const deliveryRate = totalSuccessfulSends > 0 ? (totalDelivered / totalSuccessfulSends) * 100 : 0;
        return {
            totalSent: totalSuccessfulSends, // This represents total messages that were sent (not failed)
            totalDelivered,
            totalFailed,
            totalPending,
            deliveryRate: Math.round(deliveryRate * 100) / 100
        };
    }
    getRateLimitStatus() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const status = [];
        for (const [phoneNumber, timestamps] of this.rateLimitTracker.entries()) {
            const recentTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
            status.push({
                phoneNumber,
                recentMessages: recentTimestamps.length,
                isLimited: recentTimestamps.length >= this.config.rateLimitPerMinute
            });
        }
        return status;
    }
    // Configuration methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logMessage('CONFIG_UPDATED', this.config);
    }
    getConfig() {
        return { ...this.config };
    }
    // Demo data seeding
    async seedDemoData(demoMessages) {
        for (const message of demoMessages) {
            // Add the message to sent messages
            const whatsAppMessage = {
                to: message.recipientPhone,
                content: message.content,
                messageId: message.id,
                timestamp: new Date(message.sentAt || message.createdAt)
            };
            this.sentMessages.set(message.id, whatsAppMessage);
            // Add delivery status based on demo data
            const deliveryStatus = {
                messageId: message.id,
                status: message.deliveryStatus || 'delivered',
                timestamp: new Date(message.deliveredAt || message.sentAt || message.createdAt),
                errorMessage: message.failureReason
            };
            this.deliveryStatuses.set(message.id, deliveryStatus);
            // Update rate limit tracker
            const phoneNumber = message.recipientPhone;
            if (!this.rateLimitTracker.has(phoneNumber)) {
                this.rateLimitTracker.set(phoneNumber, []);
            }
            this.rateLimitTracker.get(phoneNumber).push(new Date(message.sentAt || message.createdAt).getTime());
        }
        logger_1.logger.info(`Seeded WhatsApp mock service with ${demoMessages.length} demo messages`);
    }
    // Reset methods for testing
    reset() {
        this.sentMessages.clear();
        this.deliveryStatuses.clear();
        this.rateLimitTracker.clear();
        this.logMessage('SERVICE_RESET', {});
    }
    clearRateLimits() {
        this.rateLimitTracker.clear();
        this.logMessage('RATE_LIMITS_CLEARED', {});
    }
}
exports.WhatsAppMockService = WhatsAppMockService;
//# sourceMappingURL=WhatsAppMockService.js.map