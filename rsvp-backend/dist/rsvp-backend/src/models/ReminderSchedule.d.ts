export interface ReminderScheduleInput {
    eventId: string;
    triggerDays: number;
    messageTemplate: string;
    isActive?: boolean;
}
export interface ReminderScheduleUpdate {
    triggerDays?: number;
    messageTemplate?: string;
    isActive?: boolean;
}
export declare class ReminderScheduleModel {
    static validate(input: ReminderScheduleInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: ReminderScheduleUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: ReminderScheduleInput): ReminderScheduleInput;
    static getDefaultTemplate(): string;
}
//# sourceMappingURL=ReminderSchedule.d.ts.map