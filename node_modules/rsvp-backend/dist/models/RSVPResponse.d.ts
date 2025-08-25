import { AdditionalGuestDetail } from '../../../shared/src/types';
export interface RSVPResponseInput {
    guestId: string;
    eventId: string;
    rsvpTokenId: string;
    attendanceStatus: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestDetails?: AdditionalGuestDetail[];
}
export interface RSVPResponseUpdate {
    attendanceStatus?: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestDetails?: AdditionalGuestDetail[];
}
export declare class RSVPResponseModel {
    static readonly VALID_ATTENDANCE_STATUSES: readonly ["accepted", "declined"];
    static readonly MAX_ADDITIONAL_GUESTS = 10;
    static validate(input: RSVPResponseInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: RSVPResponseUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: RSVPResponseInput): RSVPResponseInput;
}
//# sourceMappingURL=RSVPResponse.d.ts.map