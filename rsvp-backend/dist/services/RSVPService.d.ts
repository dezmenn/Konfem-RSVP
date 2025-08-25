import { InvitationTemplate, RSVPToken, RSVPResponse, PublicRSVPRegistration, InvitationPreview } from '../../../shared/src/types';
import { InvitationTemplateInput, InvitationTemplateUpdate } from '../models/InvitationTemplate';
import { RSVPResponseInput, RSVPResponseUpdate } from '../models/RSVPResponse';
import { PublicRSVPRegistrationInput } from '../models/PublicRSVPRegistration';
export declare class RSVPService {
    private invitationTemplateRepository;
    private rsvpTokenRepository;
    private rsvpResponseRepository;
    private publicRSVPRegistrationRepository;
    private guestRepository;
    private eventRepository;
    constructor();
    createInvitationTemplate(templateData: InvitationTemplateInput): Promise<InvitationTemplate>;
    updateInvitationTemplate(id: string, updates: InvitationTemplateUpdate): Promise<InvitationTemplate>;
    getInvitationTemplate(id: string): Promise<InvitationTemplate>;
    getInvitationTemplatesByEvent(eventId: string): Promise<InvitationTemplate[]>;
    getDefaultInvitationTemplate(eventId: string): Promise<InvitationTemplate>;
    deleteInvitationTemplate(id: string): Promise<void>;
    generateRSVPToken(guestId: string, eventId: string, expiryDays?: number): Promise<RSVPToken>;
    validateRSVPToken(token: string): Promise<{
        isValid: boolean;
        rsvpToken?: RSVPToken;
        error?: string;
    }>;
    getRSVPLink(guestId: string, eventId: string): Promise<string>;
    submitRSVPResponse(token: string, responseData: Omit<RSVPResponseInput, 'guestId' | 'eventId' | 'rsvpTokenId'>): Promise<RSVPResponse>;
    updateRSVPResponse(responseId: string, updates: RSVPResponseUpdate): Promise<RSVPResponse>;
    getRSVPResponse(guestId: string): Promise<RSVPResponse | null>;
    getEventRSVPResponses(eventId: string): Promise<RSVPResponse[]>;
    submitPublicRSVP(eventId: string, registrationData: Omit<PublicRSVPRegistrationInput, 'eventId'>): Promise<PublicRSVPRegistration>;
    getPublicRSVPRegistrations(eventId: string): Promise<PublicRSVPRegistration[]>;
    generateInvitationPreview(templateId: string, guestId: string): Promise<InvitationPreview>;
    private personalizeInvitationContent;
    getEventRSVPStatistics(eventId: string): Promise<{
        invitedGuests: number;
        totalResponses: number;
        acceptedCount: number;
        declinedCount: number;
        pendingCount: number;
        totalAttendees: number;
        publicRegistrations: number;
        publicAttendees: number;
        responseRate: number;
        mealPreferenceCounts: Record<string, number>;
    }>;
    cleanupExpiredTokens(): Promise<number>;
}
//# sourceMappingURL=RSVPService.d.ts.map