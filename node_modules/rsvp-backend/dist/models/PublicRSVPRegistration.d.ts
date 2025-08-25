import { AdditionalGuestDetail } from '../../../shared/src/types';
export interface PublicRSVPRegistrationInput {
    eventId: string;
    name: string;
    phoneNumber: string;
    relationshipType: string;
    brideOrGroomSide: 'bride' | 'groom';
    attendanceStatus: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestCount?: number;
    additionalGuestDetails?: AdditionalGuestDetail[];
}
export interface PublicRSVPRegistrationUpdate {
    name?: string;
    phoneNumber?: string;
    relationshipType?: string;
    brideOrGroomSide?: 'bride' | 'groom';
    attendanceStatus?: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestCount?: number;
    additionalGuestDetails?: AdditionalGuestDetail[];
}
export declare class PublicRSVPRegistrationModel {
    static readonly VALID_ATTENDANCE_STATUSES: readonly ["accepted", "declined"];
    static readonly MAX_ADDITIONAL_GUESTS = 10;
    static validate(input: PublicRSVPRegistrationInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: PublicRSVPRegistrationUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: PublicRSVPRegistrationInput): PublicRSVPRegistrationInput;
}
//# sourceMappingURL=PublicRSVPRegistration.d.ts.map