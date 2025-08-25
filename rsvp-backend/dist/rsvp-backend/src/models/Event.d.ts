export interface EventInput {
    title: string;
    description?: string;
    date: Date;
    location: string;
    rsvpDeadline: Date;
    organizerId: string;
    publicRSVPEnabled?: boolean;
}
export interface EventUpdate {
    title?: string;
    description?: string;
    date?: Date;
    location?: string;
    rsvpDeadline?: Date;
    publicRSVPEnabled?: boolean;
    publicRSVPLink?: string | null;
}
export declare class EventModel {
    static validate(input: EventInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: EventUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: EventInput): EventInput;
    static generatePublicRSVPLink(eventId: string): string;
}
//# sourceMappingURL=Event.d.ts.map