import { Guest, RelationshipType } from '../../../../shared/src/types';
import { GuestInput } from '../../models/Guest';
export declare const mockGuestData: Guest[];
export declare const mockGuestInputs: GuestInput[];
export declare const invalidGuestInputs: ({
    eventId: string;
    name: string;
    phoneNumber: string;
    relationshipType: any;
    brideOrGroomSide: "bride";
    additionalGuestCount?: undefined;
} | {
    eventId: string;
    name: string;
    phoneNumber: string;
    relationshipType: RelationshipType;
    brideOrGroomSide: any;
    additionalGuestCount?: undefined;
} | {
    eventId: string;
    name: string;
    phoneNumber: string;
    relationshipType: RelationshipType;
    brideOrGroomSide: "bride";
    additionalGuestCount: number;
})[];
export declare const mockGuestFilters: ({
    eventId: string;
    rsvpStatus?: undefined;
    relationshipType?: undefined;
    brideOrGroomSide?: undefined;
    search?: undefined;
} | {
    eventId: string;
    rsvpStatus: string;
    relationshipType?: undefined;
    brideOrGroomSide?: undefined;
    search?: undefined;
} | {
    eventId: string;
    relationshipType: RelationshipType;
    rsvpStatus?: undefined;
    brideOrGroomSide?: undefined;
    search?: undefined;
} | {
    eventId: string;
    brideOrGroomSide: "bride";
    rsvpStatus?: undefined;
    relationshipType?: undefined;
    search?: undefined;
} | {
    eventId: string;
    search: string;
    rsvpStatus?: undefined;
    relationshipType?: undefined;
    brideOrGroomSide?: undefined;
} | {
    eventId: string;
    rsvpStatus: string;
    brideOrGroomSide: "groom";
    search: string;
    relationshipType?: undefined;
})[];
export declare const mockGuestAnalytics: {
    totalGuests: number;
    rsvpStatusCounts: {
        pending: number;
        accepted: number;
        declined: number;
        no_response: number;
    };
    dietaryRestrictionsSummary: {
        vegetarian: number;
        'gluten-free': number;
        'dairy-free': number;
        vegan: number;
        kosher: number;
        pescatarian: number;
        halal: number;
    };
    brideGroomSideCounts: {
        bride: number;
        groom: number;
    };
    relationshipTypeCounts: {
        Friend: number;
        Cousin: number;
        Uncle: number;
        Colleague: number;
        Grandparent: number;
        Sibling: number;
        Aunt: number;
    };
};
export declare function createMockGuest(overrides?: Partial<Guest>): Guest;
export declare function createMockGuestInput(overrides?: Partial<GuestInput>): GuestInput;
export declare function getGuestsByEvent(eventId: string): Guest[];
export declare function getGuestsByRSVPStatus(status: string): Guest[];
export declare function getGuestsByBrideGroomSide(side: 'bride' | 'groom'): Guest[];
export declare function getGuestsByRelationshipType(relationshipType: RelationshipType): Guest[];
//# sourceMappingURL=guestFixtures.d.ts.map