export interface MessageInput {
    eventId: string;
    recipientId: string;
    content: string;
    messageType: 'invitation' | 'reminder' | 'confirmation';
    scheduledAt?: Date;
}
export interface MessageUpdate {
    content?: string;
    deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
    scheduledAt?: Date;
    sentAt?: Date;
}
export declare class MessageModel {
    static readonly VALID_MESSAGE_TYPES: readonly ["invitation", "reminder", "confirmation"];
    static readonly VALID_DELIVERY_STATUSES: readonly ["pending", "sent", "delivered", "failed"];
    static validate(input: MessageInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: MessageUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: MessageInput): MessageInput;
}
//# sourceMappingURL=Message.d.ts.map