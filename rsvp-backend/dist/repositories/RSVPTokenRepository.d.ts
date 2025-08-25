import { BaseRepository } from './BaseRepository';
import { RSVPToken } from '../../../shared/src/types';
import { RSVPTokenInput, RSVPTokenUpdate } from '../models/RSVPToken';
export declare class RSVPTokenRepository extends BaseRepository {
    create(tokenData: RSVPTokenInput & {
        token: string;
    }): Promise<RSVPToken>;
    findById(id: string): Promise<RSVPToken | null>;
    findByToken(token: string): Promise<RSVPToken | null>;
    findByGuestId(guestId: string): Promise<RSVPToken[]>;
    findActiveByGuestId(guestId: string): Promise<RSVPToken | null>;
    findByEventId(eventId: string): Promise<RSVPToken[]>;
    update(id: string, updates: RSVPTokenUpdate): Promise<RSVPToken | null>;
    markAsUsed(id: string): Promise<RSVPToken | null>;
    delete(id: string): Promise<boolean>;
    deleteExpired(): Promise<number>;
    private mapRowToRSVPToken;
    private camelToSnakeCase;
}
//# sourceMappingURL=RSVPTokenRepository.d.ts.map