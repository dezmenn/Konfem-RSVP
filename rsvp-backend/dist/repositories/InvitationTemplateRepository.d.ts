import { BaseRepository } from './BaseRepository';
import { InvitationTemplate } from '../../../shared/src/types';
import { InvitationTemplateInput, InvitationTemplateUpdate } from '../models/InvitationTemplate';
export declare class InvitationTemplateRepository extends BaseRepository {
    create(templateData: InvitationTemplateInput): Promise<InvitationTemplate>;
    findById(id: string): Promise<InvitationTemplate | null>;
    findByEventId(eventId: string): Promise<InvitationTemplate[]>;
    findDefaultByEventId(eventId: string): Promise<InvitationTemplate | null>;
    update(id: string, updates: InvitationTemplateUpdate): Promise<InvitationTemplate | null>;
    delete(id: string): Promise<boolean>;
    setAsDefault(id: string, eventId: string): Promise<InvitationTemplate | null>;
    private mapRowToInvitationTemplate;
    private camelToSnakeCase;
}
//# sourceMappingURL=InvitationTemplateRepository.d.ts.map