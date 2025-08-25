import { BaseRepository } from './BaseRepository';
import { RSVPResponse } from '../../../shared/src/types';
import { RSVPResponseInput, RSVPResponseUpdate } from '../models/RSVPResponse';
export declare class RSVPResponseRepository extends BaseRepository {
    create(responseData: RSVPResponseInput): Promise<RSVPResponse>;
    findById(id: string): Promise<RSVPResponse | null>;
    findByGuestId(guestId: string): Promise<RSVPResponse | null>;
    findByEventId(eventId: string): Promise<RSVPResponse[]>;
    findByTokenId(rsvpTokenId: string): Promise<RSVPResponse | null>;
    update(id: string, updates: RSVPResponseUpdate): Promise<RSVPResponse | null>;
    delete(id: string): Promise<boolean>;
    findRecent(limit?: number): Promise<RSVPResponse[]>;
    getEventStatistics(eventId: string): Promise<{
        totalResponses: number;
        acceptedCount: number;
        declinedCount: number;
        totalAttendees: number;
        mealPreferenceCounts: Record<string, number>;
    }>;
    private mapRowToRSVPResponse;
    private camelToSnakeCase;
}
//# sourceMappingURL=RSVPResponseRepository.d.ts.map