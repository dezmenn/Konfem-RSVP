export interface TextElement {
    id: string;
    type: 'title' | 'subtitle' | 'body' | 'date' | 'location' | 'rsvp' | 'custom';
    content: string;
    position: {
        x: number;
        y: number;
    };
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    textAlign: 'left' | 'center' | 'right';
    width: number;
    height: number;
}
export interface ImageElement {
    id: string;
    type: 'header' | 'background' | 'decoration';
    src: string;
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    opacity: number;
    zIndex: number;
}
export interface InvitationTemplate {
    id: string;
    eventId: string;
    name: string;
    backgroundColor: string;
    backgroundImage?: string;
    backgroundImageOpacity?: number;
    width: number;
    height: number;
    textElements: TextElement[];
    imageElements: ImageElement[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RSVPToken {
    id: string;
    guestId: string;
    eventId: string;
    token: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
}
export interface RSVPResponse {
    id: string;
    guestId: string;
    eventId: string;
    rsvpTokenId: string;
    attendanceStatus: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestDetails?: AdditionalGuestDetail[];
    submittedAt: Date;
}
export interface AdditionalGuestDetail {
    name: string;
    mealPreferences?: string[];
    dietaryRestrictions?: string[];
}
export interface PublicRSVPRegistration {
    id: string;
    eventId: string;
    name: string;
    phoneNumber: string;
    relationshipType: string;
    brideOrGroomSide: 'bride' | 'groom';
    attendanceStatus: 'accepted' | 'declined';
    mealPreferences?: string[];
    specialRequests?: string;
    additionalGuestCount: number;
    additionalGuestDetails?: AdditionalGuestDetail[];
    submittedAt: Date;
}
export interface InvitationPreview {
    subject: string;
    content: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    headerImage?: string;
    footerText?: string;
    rsvpLink: string;
    template?: InvitationTemplate;
}
