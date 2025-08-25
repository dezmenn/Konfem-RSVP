import { BaseRepository } from './BaseRepository';
import { Event } from '../../../shared/src/types';
import { EventInput, EventUpdate } from '../models/Event';
export declare class EventRepository extends BaseRepository {
    create(eventData: EventInput): Promise<Event>;
    findById(id: string): Promise<Event | null>;
    findAll(): Promise<Event[]>;
    findByOrganizerId(organizerId: string): Promise<Event[]>;
    update(id: string, updates: EventUpdate): Promise<Event | null>;
    delete(id: string): Promise<boolean>;
    findUpcomingEvents(organizerId?: string): Promise<Event[]>;
    findPastEvents(organizerId?: string): Promise<Event[]>;
    findEventsWithExpiredRSVP(): Promise<Event[]>;
    isRSVPDeadlinePassed(eventId: string): Promise<boolean>;
    enablePublicRSVP(eventId: string): Promise<Event | null>;
    disablePublicRSVP(eventId: string): Promise<Event | null>;
}
//# sourceMappingURL=EventRepository.d.ts.map