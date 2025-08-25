"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVPService = void 0;
const InvitationTemplateRepository_1 = require("../repositories/InvitationTemplateRepository");
const RSVPTokenRepository_1 = require("../repositories/RSVPTokenRepository");
const RSVPResponseRepository_1 = require("../repositories/RSVPResponseRepository");
const PublicRSVPRegistrationRepository_1 = require("../repositories/PublicRSVPRegistrationRepository");
const GuestRepository_1 = require("../repositories/GuestRepository");
const EventRepository_1 = require("../repositories/EventRepository");
const InvitationTemplate_1 = require("../models/InvitationTemplate");
const RSVPToken_1 = require("../models/RSVPToken");
const RSVPResponse_1 = require("../models/RSVPResponse");
const PublicRSVPRegistration_1 = require("../models/PublicRSVPRegistration");
const logger_1 = require("../utils/logger");
class RSVPService {
    constructor() {
        this.invitationTemplateRepository = new InvitationTemplateRepository_1.InvitationTemplateRepository();
        this.rsvpTokenRepository = new RSVPTokenRepository_1.RSVPTokenRepository();
        this.rsvpResponseRepository = new RSVPResponseRepository_1.RSVPResponseRepository();
        this.publicRSVPRegistrationRepository = new PublicRSVPRegistrationRepository_1.PublicRSVPRegistrationRepository();
        this.guestRepository = new GuestRepository_1.GuestRepository();
        this.eventRepository = new EventRepository_1.EventRepository();
    }
    // Invitation Template Management
    async createInvitationTemplate(templateData) {
        const validation = InvitationTemplate_1.InvitationTemplateModel.validate(templateData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const sanitizedData = InvitationTemplate_1.InvitationTemplateModel.sanitize(templateData);
        // If this is set as default, ensure no other template is default for this event
        if (sanitizedData.isDefault) {
            const existingTemplates = await this.invitationTemplateRepository.findByEventId(sanitizedData.eventId);
            for (const template of existingTemplates) {
                if (template.isDefault) {
                    await this.invitationTemplateRepository.update(template.id, { isDefault: false });
                }
            }
        }
        const template = await this.invitationTemplateRepository.create(sanitizedData);
        logger_1.logger.info(`Created invitation template: ${template.id} for event: ${template.eventId}`);
        return template;
    }
    async updateInvitationTemplate(id, updates) {
        const validation = InvitationTemplate_1.InvitationTemplateModel.validateUpdate(updates);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const existingTemplate = await this.invitationTemplateRepository.findById(id);
        if (!existingTemplate) {
            throw new Error('Invitation template not found');
        }
        // If setting as default, ensure no other template is default for this event
        if (updates.isDefault) {
            await this.invitationTemplateRepository.setAsDefault(id, existingTemplate.eventId);
            return await this.invitationTemplateRepository.findById(id);
        }
        const updatedTemplate = await this.invitationTemplateRepository.update(id, updates);
        if (!updatedTemplate) {
            throw new Error('Failed to update invitation template');
        }
        logger_1.logger.info(`Updated invitation template: ${id}`);
        return updatedTemplate;
    }
    async getInvitationTemplate(id) {
        const template = await this.invitationTemplateRepository.findById(id);
        if (!template) {
            throw new Error('Invitation template not found');
        }
        return template;
    }
    async getInvitationTemplatesByEvent(eventId) {
        return await this.invitationTemplateRepository.findByEventId(eventId);
    }
    async getDefaultInvitationTemplate(eventId) {
        let template = await this.invitationTemplateRepository.findDefaultByEventId(eventId);
        if (!template) {
            // Create default templates if none exist
            const defaultTemplates = InvitationTemplate_1.InvitationTemplateModel.createDefaultTemplates(eventId);
            for (const templateData of defaultTemplates) {
                await this.createInvitationTemplate(templateData);
            }
            // Return the first (default) template
            template = await this.invitationTemplateRepository.findDefaultByEventId(eventId);
        }
        return template;
    }
    async deleteInvitationTemplate(id) {
        const template = await this.invitationTemplateRepository.findById(id);
        if (!template) {
            throw new Error('Invitation template not found');
        }
        if (template.isDefault) {
            throw new Error('Cannot delete default invitation template');
        }
        const deleted = await this.invitationTemplateRepository.delete(id);
        if (!deleted) {
            throw new Error('Failed to delete invitation template');
        }
        logger_1.logger.info(`Deleted invitation template: ${id}`);
    }
    // RSVP Token Management
    async generateRSVPToken(guestId, eventId, expiryDays) {
        // Check if guest exists
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        // Check if event exists
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        // Invalidate any existing active tokens for this guest
        const existingTokens = await this.rsvpTokenRepository.findByGuestId(guestId);
        for (const token of existingTokens) {
            if (RSVPToken_1.RSVPTokenModel.isTokenValid(token)) {
                await this.rsvpTokenRepository.markAsUsed(token.id);
            }
        }
        const tokenInput = {
            guestId,
            eventId,
            expiresAt: expiryDays ? RSVPToken_1.RSVPTokenModel.generateExpiryDate(expiryDays) : undefined
        };
        const validation = RSVPToken_1.RSVPTokenModel.validate(tokenInput);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const sanitizedData = RSVPToken_1.RSVPTokenModel.sanitize(tokenInput);
        const token = await this.rsvpTokenRepository.create(sanitizedData);
        logger_1.logger.info(`Generated RSVP token for guest: ${guestId}, event: ${eventId}`);
        return token;
    }
    async validateRSVPToken(token) {
        const rsvpToken = await this.rsvpTokenRepository.findByToken(token);
        if (!rsvpToken) {
            return { isValid: false, error: 'Invalid RSVP token' };
        }
        if (!RSVPToken_1.RSVPTokenModel.isTokenValid(rsvpToken)) {
            return { isValid: false, error: 'RSVP token has expired or been used' };
        }
        // Check if event RSVP deadline has passed
        const event = await this.eventRepository.findById(rsvpToken.eventId);
        if (!event) {
            return { isValid: false, error: 'Event not found' };
        }
        if (event.rsvpDeadline <= new Date()) {
            return { isValid: false, error: 'RSVP deadline has passed' };
        }
        return { isValid: true, rsvpToken };
    }
    async getRSVPLink(guestId, eventId) {
        // Get or create RSVP token
        let token = await this.rsvpTokenRepository.findActiveByGuestId(guestId);
        if (!token) {
            token = await this.generateRSVPToken(guestId, eventId);
        }
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        return `${baseUrl}/rsvp/${token.token}`;
    }
    // RSVP Response Management
    async submitRSVPResponse(token, responseData) {
        const tokenValidation = await this.validateRSVPToken(token);
        if (!tokenValidation.isValid || !tokenValidation.rsvpToken) {
            throw new Error(tokenValidation.error || 'Invalid token');
        }
        const rsvpToken = tokenValidation.rsvpToken;
        // Check if response already exists
        const existingResponse = await this.rsvpResponseRepository.findByTokenId(rsvpToken.id);
        if (existingResponse) {
            throw new Error('RSVP response already submitted for this token');
        }
        const fullResponseData = {
            ...responseData,
            guestId: rsvpToken.guestId,
            eventId: rsvpToken.eventId,
            rsvpTokenId: rsvpToken.id
        };
        const validation = RSVPResponse_1.RSVPResponseModel.validate(fullResponseData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const sanitizedData = RSVPResponse_1.RSVPResponseModel.sanitize(fullResponseData);
        const response = await this.rsvpResponseRepository.create(sanitizedData);
        // Mark token as used
        await this.rsvpTokenRepository.markAsUsed(rsvpToken.id);
        // Update guest RSVP status
        await this.guestRepository.update(rsvpToken.guestId, {
            rsvpStatus: responseData.attendanceStatus === 'accepted' ? 'accepted' : 'declined'
        });
        logger_1.logger.info(`RSVP response submitted for guest: ${rsvpToken.guestId}, status: ${responseData.attendanceStatus}`);
        return response;
    }
    async updateRSVPResponse(responseId, updates) {
        const validation = RSVPResponse_1.RSVPResponseModel.validateUpdate(updates);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const existingResponse = await this.rsvpResponseRepository.findById(responseId);
        if (!existingResponse) {
            throw new Error('RSVP response not found');
        }
        // Check if event RSVP deadline has passed
        const event = await this.eventRepository.findById(existingResponse.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        if (event.rsvpDeadline <= new Date()) {
            throw new Error('Cannot update RSVP after deadline has passed');
        }
        const updatedResponse = await this.rsvpResponseRepository.update(responseId, updates);
        if (!updatedResponse) {
            throw new Error('Failed to update RSVP response');
        }
        // Update guest RSVP status if attendance status changed
        if (updates.attendanceStatus) {
            await this.guestRepository.update(existingResponse.guestId, {
                rsvpStatus: updates.attendanceStatus === 'accepted' ? 'accepted' : 'declined'
            });
        }
        logger_1.logger.info(`Updated RSVP response: ${responseId}`);
        return updatedResponse;
    }
    async getRSVPResponse(guestId) {
        return await this.rsvpResponseRepository.findByGuestId(guestId);
    }
    async getEventRSVPResponses(eventId) {
        return await this.rsvpResponseRepository.findByEventId(eventId);
    }
    // Public RSVP Management
    async submitPublicRSVP(eventId, registrationData) {
        // Check if event exists and allows public RSVPs
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        if (!event.publicRSVPEnabled) {
            throw new Error('Public RSVP is not enabled for this event');
        }
        if (event.rsvpDeadline <= new Date()) {
            throw new Error('RSVP deadline has passed');
        }
        const fullRegistrationData = {
            ...registrationData,
            eventId
        };
        const validation = PublicRSVPRegistration_1.PublicRSVPRegistrationModel.validate(fullRegistrationData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Check if phone number already registered for this event
        const existingRegistration = await this.publicRSVPRegistrationRepository.findByPhoneNumber(eventId, registrationData.phoneNumber);
        if (existingRegistration) {
            throw new Error('Phone number already registered for this event');
        }
        const sanitizedData = PublicRSVPRegistration_1.PublicRSVPRegistrationModel.sanitize(fullRegistrationData);
        const registration = await this.publicRSVPRegistrationRepository.create(sanitizedData);
        logger_1.logger.info(`Public RSVP submitted for event: ${eventId}, name: ${registrationData.name}`);
        return registration;
    }
    async getPublicRSVPRegistrations(eventId) {
        return await this.publicRSVPRegistrationRepository.findByEventId(eventId);
    }
    // Invitation Preview and Generation
    async generateInvitationPreview(templateId, guestId) {
        const template = await this.invitationTemplateRepository.findById(templateId);
        if (!template) {
            throw new Error('Invitation template not found');
        }
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        const event = await this.eventRepository.findById(template.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        const rsvpLink = await this.getRSVPLink(guestId, template.eventId);
        // Personalize text elements
        const personalizedTextElements = template.textElements.map(element => ({
            ...element,
            content: this.personalizeInvitationContent(element.content, guest, event, rsvpLink)
        }));
        return {
            subject: `Invitation to ${event.title}`,
            content: '', // Not used in new structure
            backgroundColor: template.backgroundColor,
            textColor: '#000000', // Default for compatibility
            fontFamily: 'Arial, sans-serif', // Default for compatibility
            fontSize: 16, // Default for compatibility
            headerImage: template.backgroundImage,
            footerText: '',
            rsvpLink,
            // Add new fields for the updated structure
            template: {
                ...template,
                textElements: personalizedTextElements
            }
        }; // Type assertion since InvitationPreview needs to be updated
    }
    personalizeInvitationContent(content, guest, event, rsvpLink) {
        return content
            .replace(/\{\{guestName\}\}/g, guest.name)
            .replace(/\{\{eventTitle\}\}/g, event.title)
            .replace(/\{\{eventDate\}\}/g, event.date.toLocaleDateString())
            .replace(/\{\{eventTime\}\}/g, event.date.toLocaleTimeString())
            .replace(/\{\{eventLocation\}\}/g, event.location)
            .replace(/\{\{rsvpDeadline\}\}/g, event.rsvpDeadline.toLocaleDateString())
            .replace(/\{\{rsvpLink\}\}/g, rsvpLink)
            .replace(/\{\{organizerName\}\}/g, 'Event Organizer'); // TODO: Add organizer name to event model
    }
    // Statistics and Analytics
    async getEventRSVPStatistics(eventId) {
        // Get invited guests count
        const allGuests = await this.guestRepository.findByEventId(eventId);
        const invitedGuests = allGuests.length;
        // Get RSVP response statistics
        const rsvpStats = await this.rsvpResponseRepository.getEventStatistics(eventId);
        // Get public registration statistics
        const publicStats = await this.publicRSVPRegistrationRepository.getEventStatistics(eventId);
        const pendingCount = invitedGuests - rsvpStats.totalResponses;
        const responseRate = invitedGuests > 0 ? (rsvpStats.totalResponses / invitedGuests) * 100 : 0;
        // Combine meal preferences from both sources
        const combinedMealPreferences = { ...rsvpStats.mealPreferenceCounts };
        Object.entries(publicStats.mealPreferenceCounts).forEach(([pref, count]) => {
            combinedMealPreferences[pref] = (combinedMealPreferences[pref] || 0) + count;
        });
        return {
            invitedGuests,
            totalResponses: rsvpStats.totalResponses,
            acceptedCount: rsvpStats.acceptedCount,
            declinedCount: rsvpStats.declinedCount,
            pendingCount,
            totalAttendees: rsvpStats.totalAttendees + publicStats.totalAttendees,
            publicRegistrations: publicStats.totalRegistrations,
            publicAttendees: publicStats.totalAttendees,
            responseRate: Math.round(responseRate * 100) / 100,
            mealPreferenceCounts: combinedMealPreferences
        };
    }
    // Utility Methods
    async cleanupExpiredTokens() {
        return await this.rsvpTokenRepository.deleteExpired();
    }
}
exports.RSVPService = RSVPService;
//# sourceMappingURL=RSVPService.js.map