interface DemoData {
    event: any;
    guests: any[];
    invitationTemplates: any[];
    messages: any[];
    rsvpTokens: any[];
    publicRSVPRegistrations: any[];
    tables: any[];
    venueElements: any[];
    analytics: any;
}
export declare class DemoDataService {
    private static instance;
    private demoData;
    private constructor();
    static getInstance(): DemoDataService;
    loadDemoData(): Promise<void>;
    getEvent(eventId: string): any;
    getGuests(eventId: string): any[];
    getGuestById(guestId: string): any;
    addGuest(guest: any): any;
    updateGuest(guestId: string, updates: any): any;
    deleteGuest(guestId: string): boolean;
    getInvitationTemplates(eventId: string): any[];
    getInvitationTemplate(templateId: string): any;
    addInvitationTemplate(template: any): any;
    updateInvitationTemplate(templateId: string, updates: any): any;
    getTables(eventId: string): any[];
    getTableById(tableId: string): any;
    addTable(table: any): any;
    updateTable(tableId: string, updates: any): any;
    deleteTable(tableId: string): boolean;
    getVenueElements(eventId: string): any[];
    getVenueElementById(elementId: string): any;
    addVenueElement(element: any): any;
    updateVenueElement(elementId: string, updates: any): any;
    deleteVenueElement(elementId: string): boolean;
    deleteInvitationTemplate(templateId: string): boolean;
    setDefaultInvitationTemplate(templateId: string, eventId: string): any;
    getMessages(eventId: string): any[];
    getRSVPTokens(eventId: string): any[];
    getRSVPToken(token: string): any;
    getPublicRSVPRegistrations(eventId: string): any[];
    addPublicRSVPRegistration(registration: any): any;
    getAnalytics(): any;
    getAllData(): DemoData | null;
}
export {};
//# sourceMappingURL=DemoDataService.d.ts.map