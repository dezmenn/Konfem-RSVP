import { MessageRepository } from '../repositories/MessageRepository';
export interface WhatsAppMessage {
    to: string;
    content: string;
    messageId: string;
    timestamp: Date;
}
export interface DeliveryStatus {
    messageId: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    timestamp: Date;
    errorMessage?: string;
}
export interface BulkMessageResult {
    totalMessages: number;
    successfulSends: number;
    failedSends: number;
    results: Array<{
        messageId: string;
        success: boolean;
        error?: string;
    }>;
}
export interface WhatsAppMockConfig {
    enableRateLimiting: boolean;
    rateLimitPerMinute: number;
    simulateDeliveryDelay: boolean;
    deliveryDelayMs: number;
    errorRate: number;
    deliveryFailureRate: number;
    enableLogging: boolean;
}
export declare class WhatsAppMockService {
    private messageRepository;
    private sentMessages;
    private deliveryStatuses;
    private rateLimitTracker;
    private config;
    constructor(messageRepository: MessageRepository, config?: Partial<WhatsAppMockConfig>);
    sendMessage(to: string, content: string, messageId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendBulkMessages(messages: Array<{
        to: string;
        content: string;
        messageId: string;
    }>): Promise<BulkMessageResult>;
    private simulateDelivery;
    private isRateLimited;
    private trackRateLimit;
    private setDeliveryStatus;
    private logMessage;
    private delay;
    getSentMessages(): WhatsAppMessage[];
    getDeliveryStatuses(): DeliveryStatus[];
    getMessageById(messageId: string): WhatsAppMessage | undefined;
    getDeliveryStatus(messageId: string): DeliveryStatus | undefined;
    getStats(): {
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        totalPending: number;
        deliveryRate: number;
    };
    getRateLimitStatus(): Array<{
        phoneNumber: string;
        recentMessages: number;
        isLimited: boolean;
    }>;
    updateConfig(newConfig: Partial<WhatsAppMockConfig>): void;
    getConfig(): WhatsAppMockConfig;
    seedDemoData(demoMessages: any[]): Promise<void>;
    reset(): void;
    clearRateLimits(): void;
}
//# sourceMappingURL=WhatsAppMockService.d.ts.map