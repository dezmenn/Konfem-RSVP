import { BaseRepository } from './BaseRepository';
import { Message } from '../../../shared/src/types';
import { MessageInput, MessageUpdate } from '../models/Message';
export interface MessageFilters {
    eventId?: string;
    recipientId?: string;
    messageType?: 'invitation' | 'reminder' | 'confirmation';
    deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
    scheduledBefore?: Date;
    scheduledAfter?: Date;
}
export declare class MessageRepository extends BaseRepository {
    create(messageData: MessageInput): Promise<Message>;
    findById(id: string): Promise<Message | null>;
    findByEventId(eventId: string): Promise<Message[]>;
    findByRecipientId(recipientId: string): Promise<Message[]>;
    findWithFilters(filters: MessageFilters): Promise<Message[]>;
    update(id: string, updates: MessageUpdate): Promise<Message | null>;
    markAsSent(id: string): Promise<Message | null>;
    markAsDelivered(id: string): Promise<Message | null>;
    markAsFailed(id: string): Promise<Message | null>;
    delete(id: string): Promise<boolean>;
    findPendingMessages(): Promise<Message[]>;
    findScheduledMessages(beforeDate?: Date): Promise<Message[]>;
    getMessageStats(eventId: string): Promise<Record<string, number>>;
    getDeliveryStatusSummary(eventId: string): Promise<Record<string, number>>;
    findRecent(limit?: number): Promise<Message[]>;
    findLatestMessageByRecipient(eventId: string, messageType?: string): Promise<Message[]>;
    bulkCreate(messages: MessageInput[]): Promise<Message[]>;
}
//# sourceMappingURL=MessageRepository.d.ts.map