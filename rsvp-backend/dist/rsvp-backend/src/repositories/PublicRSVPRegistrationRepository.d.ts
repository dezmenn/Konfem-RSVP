import { BaseRepository } from './BaseRepository';
import { PublicRSVPRegistration } from '../../../shared/src/types';
import { PublicRSVPRegistrationInput, PublicRSVPRegistrationUpdate } from '../models/PublicRSVPRegistration';
export declare class PublicRSVPRegistrationRepository extends BaseRepository {
    create(registrationData: PublicRSVPRegistrationInput): Promise<PublicRSVPRegistration>;
    findById(id: string): Promise<PublicRSVPRegistration | null>;
    findByEventId(eventId: string): Promise<PublicRSVPRegistration[]>;
    findByPhoneNumber(eventId: string, phoneNumber: string): Promise<PublicRSVPRegistration | null>;
    update(id: string, updates: PublicRSVPRegistrationUpdate): Promise<PublicRSVPRegistration | null>;
    delete(id: string): Promise<boolean>;
    getEventStatistics(eventId: string): Promise<{
        totalRegistrations: number;
        acceptedCount: number;
        declinedCount: number;
        totalAttendees: number;
        brideGuestCount: number;
        groomGuestCount: number;
        relationshipTypeCounts: Record<string, number>;
        mealPreferenceCounts: Record<string, number>;
    }>;
    private mapRowToPublicRSVPRegistration;
    private camelToSnakeCase;
}
//# sourceMappingURL=PublicRSVPRegistrationRepository.d.ts.map