"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPTokenModel = void 0;
const crypto_1 = require("crypto");
class RSVPTokenModel {
    static validate(input) {
        const errors = [];
        if (!input.guestId || input.guestId.trim().length === 0) {
            errors.push('Guest ID is required');
        }
        if (!input.eventId || input.eventId.trim().length === 0) {
            errors.push('Event ID is required');
        }
        if (input.expiresAt && isNaN(input.expiresAt.getTime())) {
            errors.push('Expiry date must be a valid date');
        }
        if (input.expiresAt && input.expiresAt <= new Date()) {
            errors.push('Expiry date must be in the future');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateUpdate(update) {
        const errors = [];
        if (update.expiresAt && isNaN(update.expiresAt.getTime())) {
            errors.push('Expiry date must be a valid date');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static generateToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    static generateExpiryDate(days = this.DEFAULT_EXPIRY_DAYS) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        return expiryDate;
    }
    static sanitize(input) {
        return {
            ...input,
            token: this.generateToken(),
            expiresAt: input.expiresAt || this.generateExpiryDate()
        };
    }
    static isTokenValid(token) {
        return !token.isUsed && token.expiresAt > new Date();
    }
}
exports.RSVPTokenModel = RSVPTokenModel;
RSVPTokenModel.DEFAULT_EXPIRY_DAYS = 30;
//# sourceMappingURL=RSVPToken.js.map