import { RSVPToken as RSVPTokenInterface } from '../../../shared/src/types';
export interface RSVPTokenInput {
    guestId: string;
    eventId: string;
    expiresAt?: Date;
}
export interface RSVPTokenUpdate {
    isUsed?: boolean;
    expiresAt?: Date;
}
export declare class RSVPTokenModel {
    static readonly DEFAULT_EXPIRY_DAYS = 30;
    static validate(input: RSVPTokenInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: RSVPTokenUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static generateToken(): string;
    static generateExpiryDate(days?: number): Date;
    static sanitize(input: RSVPTokenInput): RSVPTokenInput & {
        token: string;
    };
    static isTokenValid(token: RSVPTokenInterface): boolean;
}
//# sourceMappingURL=RSVPToken.d.ts.map