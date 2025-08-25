"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPResponseModel = void 0;
class RSVPResponseModel {
    static validate(input) {
        const errors = [];
        if (!input.guestId || input.guestId.trim().length === 0) {
            errors.push('Guest ID is required');
        }
        if (!input.eventId || input.eventId.trim().length === 0) {
            errors.push('Event ID is required');
        }
        if (!input.rsvpTokenId || input.rsvpTokenId.trim().length === 0) {
            errors.push('RSVP Token ID is required');
        }
        if (!this.VALID_ATTENDANCE_STATUSES.includes(input.attendanceStatus)) {
            errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
        }
        if (input.specialRequests && input.specialRequests.length > 1000) {
            errors.push('Special requests cannot exceed 1000 characters');
        }
        if (input.additionalGuestDetails && input.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
            errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
        }
        if (input.additionalGuestDetails) {
            input.additionalGuestDetails.forEach((guest, index) => {
                if (!guest.name || guest.name.trim().length === 0) {
                    errors.push(`Additional guest ${index + 1} name is required`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateUpdate(update) {
        const errors = [];
        if (update.attendanceStatus && !this.VALID_ATTENDANCE_STATUSES.includes(update.attendanceStatus)) {
            errors.push(`Attendance status must be one of: ${this.VALID_ATTENDANCE_STATUSES.join(', ')}`);
        }
        if (update.specialRequests && update.specialRequests.length > 1000) {
            errors.push('Special requests cannot exceed 1000 characters');
        }
        if (update.additionalGuestDetails && update.additionalGuestDetails.length > this.MAX_ADDITIONAL_GUESTS) {
            errors.push(`Cannot have more than ${this.MAX_ADDITIONAL_GUESTS} additional guests`);
        }
        if (update.additionalGuestDetails) {
            update.additionalGuestDetails.forEach((guest, index) => {
                if (!guest.name || guest.name.trim().length === 0) {
                    errors.push(`Additional guest ${index + 1} name is required`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static sanitize(input) {
        return {
            ...input,
            mealPreferences: input.mealPreferences || [],
            specialRequests: input.specialRequests?.trim() || '',
            additionalGuestDetails: input.additionalGuestDetails?.map(guest => ({
                ...guest,
                name: guest.name.trim(),
                mealPreferences: guest.mealPreferences || [],
                dietaryRestrictions: guest.dietaryRestrictions || []
            })) || []
        };
    }
}
exports.RSVPResponseModel = RSVPResponseModel;
RSVPResponseModel.VALID_ATTENDANCE_STATUSES = ['accepted', 'declined'];
RSVPResponseModel.MAX_ADDITIONAL_GUESTS = 10;
//# sourceMappingURL=RSVPResponse.js.map