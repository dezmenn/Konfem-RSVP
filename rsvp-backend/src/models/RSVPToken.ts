import { RSVPToken as RSVPTokenInterface } from '../../../shared/src/types';
import { randomBytes } from 'crypto';

export interface RSVPTokenInput {
  guestId: string;
  eventId: string;
  expiresAt?: Date;
}

export interface RSVPTokenUpdate {
  isUsed?: boolean;
  expiresAt?: Date;
}

export class RSVPTokenModel {
  static readonly DEFAULT_EXPIRY_DAYS = 30;

  static validate(input: RSVPTokenInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.guestId || input.guestId.trim().length === 0) {
      errors.push('Guest ID is required');
    }

    if (!input.eventId || input.eventId.trim().length === 0) {
      errors.push('Event ID is required');
    }

    if (input.expiresAt && isNaN(input.expiresAt.getTime())) {
      errors.push('Expiry date must be a valid date');
    }

    if (input.expiresAt && input.expiresAt <= new Date()) {
      errors.push('Expiry date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUpdate(update: RSVPTokenUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (update.expiresAt && isNaN(update.expiresAt.getTime())) {
      errors.push('Expiry date must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  static generateExpiryDate(days: number = this.DEFAULT_EXPIRY_DAYS): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  }

  static sanitize(input: RSVPTokenInput): RSVPTokenInput & { token: string } {
    return {
      ...input,
      token: this.generateToken(),
      expiresAt: input.expiresAt || this.generateExpiryDate()
    };
  }

  static isTokenValid(token: RSVPTokenInterface): boolean {
    return !token.isUsed && token.expiresAt > new Date();
  }
}