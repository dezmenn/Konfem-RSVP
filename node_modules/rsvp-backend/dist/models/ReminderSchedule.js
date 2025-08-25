"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduleModel = void 0;
class ReminderScheduleModel {
    static validate(input) {
        const errors = [];
        if (!input.eventId || input.eventId.trim().length === 0) {
            errors.push('Event ID is required');
        }
        if (input.triggerDays === undefined || input.triggerDays === null) {
            errors.push('Trigger days is required');
        }
        if (input.triggerDays < 0) {
            errors.push('Trigger days must be non-negative');
        }
        if (input.triggerDays > 365) {
            errors.push('Trigger days cannot exceed 365 days');
        }
        if (!input.messageTemplate || input.messageTemplate.trim().length === 0) {
            errors.push('Message template is required');
        }
        if (input.messageTemplate && input.messageTemplate.length > 4096) {
            errors.push('Message template cannot exceed 4096 characters');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateUpdate(update) {
        const errors = [];
        if (update.triggerDays !== undefined) {
            if (update.triggerDays < 0) {
                errors.push('Trigger days must be non-negative');
            }
            if (update.triggerDays > 365) {
                errors.push('Trigger days cannot exceed 365 days');
            }
        }
        if (update.messageTemplate !== undefined) {
            if (update.messageTemplate.trim().length === 0) {
                errors.push('Message template cannot be empty');
            }
            if (update.messageTemplate.length > 4096) {
                errors.push('Message template cannot exceed 4096 characters');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static sanitize(input) {
        return {
            ...input,
            messageTemplate: input.messageTemplate.trim(),
            isActive: input.isActive !== undefined ? input.isActive : true
        };
    }
    static getDefaultTemplate() {
        return `Hi {{guestName}},

This is a friendly reminder about {{eventTitle}} on {{eventDate}} at {{eventLocation}}.

We haven't received your RSVP yet and the deadline is {{rsvpDeadline}}. Please let us know if you can make it by clicking the link below:

{{rsvpLink}}

Looking forward to celebrating with you!

Best regards,
{{organizerName}}`;
    }
}
exports.ReminderScheduleModel = ReminderScheduleModel;
//# sourceMappingURL=ReminderSchedule.js.map