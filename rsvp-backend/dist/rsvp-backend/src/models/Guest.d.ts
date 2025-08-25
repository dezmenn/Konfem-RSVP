import { RelationshipType } from '../../../shared/src/types';
export interface GuestInput {
    eventId: string;
    name: string;
    phoneNumber: string;
    dietaryRestrictions?: string[];
    additionalGuestCount?: number;
    relationshipType: RelationshipType;
    brideOrGroomSide: 'bride' | 'groom';
    specialRequests?: string;
}
export interface GuestUpdate {
    name?: string;
    phoneNumber?: string;
    dietaryRestrictions?: string[];
    additionalGuestCount?: number;
    relationshipType?: RelationshipType;
    brideOrGroomSide?: 'bride' | 'groom';
    rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'no_response';
    specialRequests?: string;
    tableAssignment?: string;
}
export declare class GuestModel {
    static validate(input: GuestInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: GuestUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: GuestInput): GuestInput;
}
//# sourceMappingURL=Guest.d.ts.map