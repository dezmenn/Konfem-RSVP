import { Event } from '../../../shared/src/types';
export declare class MockEventService {
    private demoDataService;
    constructor();
    findById(eventId: string): Promise<Event | null>;
    findByOrganizerId(organizerId: string): Promise<Event[]>;
    findUpcomingEvents(organizerId?: string): Promise<Event[]>;
    findPastEvents(organizerId?: string): Promise<Event[]>;
    findAll(): Promise<Event[]>;
    isRSVPDeadlinePassed(eventId: string): Promise<boolean>;
    create(eventData: any): Promise<Event>;
    update(id: string, updates: any): Promise<Event | null>;
    delete(id: string): Promise<boolean>;
    enablePublicRSVP(eventId: string): Promise<Event | null>;
    disablePublicRSVP(eventId: string): Promise<Event | null>;
}
//# sourceMappingURL=MockEventService.d.ts.map