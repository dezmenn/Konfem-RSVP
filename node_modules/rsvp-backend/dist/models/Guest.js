"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestModel = void 0;
const types_1 = require("../../../shared/src/types");
class GuestModel {
    static validate(input) {
        const errors = [];
        if (!input.name || input.name.trim().length === 0) {
            errors.push('Name is required');
        }
        if (!input.phoneNumber || input.phoneNumber.trim().length === 0) {
            errors.push('Phone number is required');
        }
        else if (!/^\+?[\d\s\-\(\)]+$/.test(input.phoneNumber)) {
            errors.push('Phone number format is invalid');
        }
        if (!input.eventId || input.eventId.trim().length === 0) {
            errors.push('Event ID is required');
        }
        if (!Object.values(types_1.RelationshipType).includes(input.relationshipType)) {
            errors.push('Invalid relationship type');
        }
        if (!['bride', 'groom'].includes(input.brideOrGroomSide)) {
            errors.push('Bride or groom side must be specified');
        }
        if (input.additionalGuestCount !== undefined && input.additionalGuestCount < 0) {
            errors.push('Additional guest count cannot be negative');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateUpdate(update) {
        const errors = [];
        if (update.name !== undefined && update.name.trim().length === 0) {
            errors.push('Name cannot be empty');
        }
        if (update.phoneNumber !== undefined) {
            if (update.phoneNumber.trim().length === 0) {
                errors.push('Phone number cannot be empty');
            }
            else if (!/^\+?[\d\s\-\(\)]+$/.test(update.phoneNumber)) {
                errors.push('Phone number format is invalid');
            }
        }
        if (update.relationshipType !== undefined && !Object.values(types_1.RelationshipType).includes(update.relationshipType)) {
            errors.push('Invalid relationship type');
        }
        if (update.brideOrGroomSide !== undefined && !['bride', 'groom'].includes(update.brideOrGroomSide)) {
            errors.push('Bride or groom side must be bride or groom');
        }
        if (update.rsvpStatus !== undefined && !['pending', 'accepted', 'declined', 'no_response'].includes(update.rsvpStatus)) {
            errors.push('Invalid RSVP status');
        }
        if (update.additionalGuestCount !== undefined && update.additionalGuestCount < 0) {
            errors.push('Additional guest count cannot be negative');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static sanitize(input) {
        return {
            ...input,
            name: input.name.trim(),
            phoneNumber: input.phoneNumber.trim(),
            dietaryRestrictions: input.dietaryRestrictions || [],
            additionalGuestCount: input.additionalGuestCount || 0,
            specialRequests: input.specialRequests?.trim() || ''
        };
    }
}
exports.GuestModel = GuestModel;
//# sourceMappingURL=Guest.js.map