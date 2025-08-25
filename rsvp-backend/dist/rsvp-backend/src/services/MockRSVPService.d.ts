export declare class MockRSVPService {
    private demoDataService;
    private invitationTemplateService;
    constructor();
    createInvitationTemplate(templateData: any): Promise<any>;
    getInvitationTemplates(eventId: string): Promise<any[]>;
    getInvitationTemplatesByEvent(eventId: string): Promise<any[]>;
    getDefaultInvitationTemplate(eventId: string): Promise<any>;
    getInvitationTemplate(templateId: string): Promise<any>;
    updateInvitationTemplate(templateId: string, updates: any): Promise<any>;
    deleteInvitationTemplate(templateId: string): Promise<void>;
    generateRSVPToken(guestId: string, eventId: string, expiryDays?: number): Promise<any>;
    getRSVPLink(guestId: string, eventId: string): Promise<string>;
    validateRSVPToken(token: string): Promise<any>;
    submitRSVPResponse(token: string, responseData: any): Promise<any>;
    createPublicRSVPRegistration(eventId: string, registrationData: any): Promise<any>;
    getPublicRSVPRegistrations(eventId: string): Promise<any[]>;
    getRSVPStatistics(eventId: string): Promise<any>;
    previewInvitation(templateId: string, guestId: string): Promise<any>;
    updateRSVPResponse(id: string, updates: any): Promise<any>;
    getRSVPResponse(guestId: string): Promise<any>;
    getEventRSVPResponses(eventId: string): Promise<any[]>;
    submitPublicRSVP(eventId: string, registrationData: any): Promise<any>;
    generateInvitationPreview(templateId: string, guestId: string): Promise<any>;
    getEventRSVPStatistics(eventId: string): Promise<any>;
    getEventRSVPTokens(eventId: string): Promise<any[]>;
    createRSVPResponse(responseData: any): Promise<any>;
    getRSVPResponseByGuestAndEvent(guestId: string, eventId: string): Promise<any>;
    cleanupExpiredTokens(): Promise<number>;
}
//# sourceMappingURL=MockRSVPService.d.ts.map