"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRSVPService = void 0;
const DemoDataService_1 = require("./DemoDataService");
const MockInvitationTemplateService_1 = require("./MockInvitationTemplateService");
class MockRSVPService {
    constructor() {
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
        this.invitationTemplateService = new MockInvitationTemplateService_1.MockInvitationTemplateService();
    }
    // Invitation Template Methods
    async createInvitationTemplate(templateData) {
        return await this.invitationTemplateService.create(templateData);
    }
    async getInvitationTemplates(eventId) {
        return await this.invitationTemplateService.findByEventId(eventId);
    }
    async getInvitationTemplatesByEvent(eventId) {
        return await this.invitationTemplateService.findByEventId(eventId);
    }
    async getDefaultInvitationTemplate(eventId) {
        return await this.invitationTemplateService.findDefaultByEventId(eventId);
    }
    async getInvitationTemplate(templateId) {
        return await this.invitationTemplateService.findById(templateId);
    }
    async updateInvitationTemplate(templateId, updates) {
        return await this.invitationTemplateService.update(templateId, updates);
    }
    async deleteInvitationTemplate(templateId) {
        await this.invitationTemplateService.delete(templateId);
    }
    // RSVP Token Methods
    async generateRSVPToken(guestId, eventId, expiryDays) {
        const tokens = this.demoDataService.getRSVPTokens(eventId);
        const existingToken = tokens.find(t => t.guestId === guestId);
        if (existingToken) {
            return existingToken;
        }
        // Generate new token for demo
        const newToken = {
            id: `token-${Date.now()}`,
            guestId,
            eventId,
            token: `rsvp-token-${guestId}-${Date.now()}`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            isUsed: false,
            createdAt: new Date().toISOString()
        };
        return newToken;
    }
    async getRSVPLink(guestId, eventId) {
        const token = await this.generateRSVPToken(guestId, eventId);
        return `http://localhost:3000/rsvp/${token.token}`;
    }
    async validateRSVPToken(token) {
        const rsvpToken = this.demoDataService.getRSVPToken(token);
        if (!rsvpToken) {
            return {
                isValid: false,
                error: 'Invalid RSVP token'
            };
        }
        if (rsvpToken.isUsed) {
            return {
                isValid: false,
                error: 'RSVP token has already been used'
            };
        }
        if (new Date(rsvpToken.expiresAt) < new Date()) {
            return {
                isValid: false,
                error: 'RSVP token has expired'
            };
        }
        // Get guest and event data
        const guest = this.demoDataService.getGuestById(rsvpToken.guestId);
        const event = this.demoDataService.getEvent(rsvpToken.eventId);
        return {
            isValid: true,
            rsvpToken,
            guest,
            event
        };
    }
    async submitRSVPResponse(token, responseData) {
        const validation = await this.validateRSVPToken(token);
        // Update guest RSVP status
        const updatedGuest = this.demoDataService.updateGuest(validation.guest.id, {
            rsvpStatus: responseData.attendanceStatus === 'accepted' ? 'accepted' : 'declined',
            dietaryRestrictions: responseData.dietaryRestrictions || validation.guest.dietaryRestrictions,
            specialRequests: responseData.specialRequests || validation.guest.specialRequests,
            additionalGuestCount: responseData.additionalGuestCount || validation.guest.additionalGuestCount
        });
        // Mark token as used (in demo, we'll simulate this)
        const response = {
            id: `response-${Date.now()}`,
            guestId: validation.guest.id,
            eventId: validation.token.eventId,
            rsvpTokenId: validation.token.id,
            attendanceStatus: responseData.attendanceStatus,
            dietaryRestrictions: responseData.dietaryRestrictions || [],
            specialRequests: responseData.specialRequests || '',
            additionalGuestDetails: responseData.additionalGuestDetails || [],
            submittedAt: new Date().toISOString()
        };
        return response;
    }
    // Public RSVP Methods
    async createPublicRSVPRegistration(eventId, registrationData) {
        const registration = this.demoDataService.addPublicRSVPRegistration({
            ...registrationData,
            eventId
        });
        return registration;
    }
    async getPublicRSVPRegistrations(eventId) {
        return this.demoDataService.getPublicRSVPRegistrations(eventId);
    }
    // Statistics Methods
    async getRSVPStatistics(eventId) {
        const guests = this.demoDataService.getGuests(eventId);
        const publicRegistrations = this.demoDataService.getPublicRSVPRegistrations(eventId);
        const totalInvited = guests.length;
        const totalPublicRegistrations = publicRegistrations.length;
        const totalGuests = totalInvited + totalPublicRegistrations;
        const rsvpCounts = guests.reduce((acc, guest) => {
            acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
            return acc;
        }, {});
        const publicRsvpCounts = publicRegistrations.reduce((acc, reg) => {
            acc[reg.rsvpStatus] = (acc[reg.rsvpStatus] || 0) + 1;
            return acc;
        }, {});
        return {
            totalInvited,
            totalPublicRegistrations,
            totalGuests,
            invitedGuestRSVP: rsvpCounts,
            publicGuestRSVP: publicRsvpCounts,
            overallRSVP: {
                accepted: (rsvpCounts.accepted || 0) + (publicRsvpCounts.accepted || 0),
                declined: (rsvpCounts.declined || 0) + (publicRsvpCounts.declined || 0),
                pending: (rsvpCounts.pending || 0) + (publicRsvpCounts.pending || 0),
                no_response: (rsvpCounts.no_response || 0)
            }
        };
    }
    // Preview Methods
    async previewInvitation(templateId, guestId) {
        const template = await this.getInvitationTemplate(templateId);
        const guest = this.demoDataService.getGuestById(guestId);
        const event = this.demoDataService.getEvent('demo-event-1');
        if (!template || !guest || !event) {
            throw new Error('Template, guest, or event not found');
        }
        // Generate personalized invitation content
        const personalizedContent = {
            ...template.template,
            bodyText: template.template.bodyText
                .replace('{brideName}', 'Sarah')
                .replace('{groomName}', 'John')
                .replace('{guestName}', guest.name),
            customMessage: template.template.customMessage
                .replace('{guestName}', guest.name)
        };
        return {
            template: personalizedContent,
            guest,
            event,
            rsvpLink: await this.getRSVPLink(guestId, event.id)
        };
    }
    // Missing methods that routes are calling
    async updateRSVPResponse(id, updates) {
        // For demo, just return updated response
        return {
            id,
            ...updates,
            updatedAt: new Date().toISOString()
        };
    }
    async getRSVPResponse(guestId) {
        // For demo, return null (no existing response)
        return null;
    }
    async getEventRSVPResponses(eventId) {
        // For demo, return empty array
        return [];
    }
    async submitPublicRSVP(eventId, registrationData) {
        return this.createPublicRSVPRegistration(eventId, registrationData);
    }
    async generateInvitationPreview(templateId, guestId) {
        return this.previewInvitation(templateId, guestId);
    }
    async getEventRSVPStatistics(eventId) {
        return this.getRSVPStatistics(eventId);
    }
    // Additional methods for frontend integration
    async getEventRSVPTokens(eventId) {
        return this.demoDataService.getRSVPTokens(eventId);
    }
    async createRSVPResponse(responseData) {
        const response = {
            id: `response-${Date.now()}`,
            ...responseData,
            respondedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        // Update guest RSVP status in demo data
        if (responseData.guestId) {
            this.demoDataService.updateGuest(responseData.guestId, {
                rsvpStatus: responseData.status,
                dietaryRestrictions: responseData.dietaryRestrictions,
                additionalGuests: responseData.additionalGuests || 0
            });
        }
        return response;
    }
    async getRSVPResponseByGuestAndEvent(guestId, eventId) {
        // For demo, check if guest has already responded
        const guest = this.demoDataService.getGuestById(guestId);
        if (!guest || guest.rsvpStatus === 'pending' || guest.rsvpStatus === 'no_response') {
            return null;
        }
        // Return mock response based on guest status
        return {
            id: `response-${guestId}-${eventId}`,
            guestId,
            eventId,
            status: guest.rsvpStatus,
            mealPreference: guest.mealPreference || '',
            dietaryRestrictions: guest.dietaryRestrictions || '',
            additionalGuests: guest.additionalGuests || 0,
            specialRequests: guest.specialRequests || '',
            respondedAt: new Date().toISOString()
        };
    }
    // Utility Methods
    async cleanupExpiredTokens() {
        // For demo, return a mock count
        return 0;
    }
}
exports.MockRSVPService = MockRSVPService;
//# sourceMappingURL=MockRSVPService.js.map