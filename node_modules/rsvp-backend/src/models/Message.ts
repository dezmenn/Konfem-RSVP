import { Message as MessageInterface } from '../../../shared/src/types';

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

export class MessageModel {
  static readonly VALID_MESSAGE_TYPES = ['invitation', 'reminder', 'confirmation'] as const;
  static readonly VALID_DELIVERY_STATUSES = ['pending', 'sent', 'delivered', 'failed'] as const;

  static validate(input: MessageInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (!input.recipientId || input.recipientId.trim().length === 0) {
      errors.push('Recipient ID is required');
    }

    if (!input.content || input.content.trim().length === 0) {
      errors.push('Message content is required');
    }

    if (input.content && input.content.length > 4096) {
      errors.push('Message content cannot exceed 4096 characters');
    }

    if (!this.VALID_MESSAGE_TYPES.includes(input.messageType)) {
      errors.push(`Invalid message type. Must be one of: ${this.VALID_MESSAGE_TYPES.join(', ')}`);
    }

    if (input.scheduledAt && isNaN(input.scheduledAt.getTime())) {
      errors.push('Scheduled date must be a valid date');
    }

    if (input.scheduledAt && input.scheduledAt <= new Date()) {
      errors.push('Scheduled date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: MessageUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.content !== undefined) {
      if (update.content.trim().length === 0) {
        errors.push('Message content cannot be empty');
      }
      if (update.content.length > 4096) {
        errors.push('Message content cannot exceed 4096 characters');
      }
    }

    if (update.deliveryStatus !== undefined && !this.VALID_DELIVERY_STATUSES.includes(update.deliveryStatus)) {
      errors.push(`Invalid delivery status. Must be one of: ${this.VALID_DELIVERY_STATUSES.join(', ')}`);
    }

    if (update.scheduledAt !== undefined && isNaN(update.scheduledAt.getTime())) {
      errors.push('Scheduled date must be a valid date');
    }

    if (update.sentAt !== undefined && isNaN(update.sentAt.getTime())) {
      errors.push('Sent date must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitize(input: MessageInput): MessageInput {
    return {
      ...input,
      content: input.content.trim()
    };
  }
}