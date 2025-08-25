"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoDataService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
class DemoDataService {
    constructor() {
        this.demoData = null;
    }
    static getInstance() {
        if (!DemoDataService.instance) {
            DemoDataService.instance = new DemoDataService();
        }
        return DemoDataService.instance;
    }
    async loadDemoData() {
        try {
            const demoDataPath = path_1.default.join(process.cwd(), '..', 'demo-data', 'mock-demo-data.json');
            const demoDataContent = fs_1.default.readFileSync(demoDataPath, 'utf8');
            this.demoData = JSON.parse(demoDataContent);
            logger_1.logger.info('Demo data loaded successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to load demo data:', error);
            // Create minimal demo data if file doesn't exist
            this.demoData = {
                event: {
                    id: 'demo-event-1',
                    title: 'Sarah & John\'s Wedding',
                    date: '2025-08-15T18:00:00Z',
                    location: 'Grand Ballroom, Elegant Hotel',
                    rsvpDeadline: '2025-07-15T23:59:59Z'
                },
                guests: [],
                invitationTemplates: [],
                messages: [],
                rsvpTokens: [],
                publicRSVPRegistrations: [],
                tables: [],
                venueElements: [],
                analytics: {}
            };
        }
    }
    getEvent(eventId) {
        if (!this.demoData)
            return null;
        return this.demoData.event.id === eventId ? this.demoData.event : null;
    }
    getGuests(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.guests.filter(guest => guest.eventId === eventId);
    }
    getGuestById(guestId) {
        if (!this.demoData)
            return null;
        return this.demoData.guests.find(guest => guest.id === guestId);
    }
    addGuest(guest) {
        if (!this.demoData)
            return null;
        const newGuest = {
            ...guest,
            id: `guest-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.demoData.guests.push(newGuest);
        return newGuest;
    }
    updateGuest(guestId, updates) {
        if (!this.demoData)
            return null;
        // Try to find and update in regular guests first
        const guestIndex = this.demoData.guests.findIndex(guest => guest.id === guestId);
        if (guestIndex !== -1) {
            this.demoData.guests[guestIndex] = {
                ...this.demoData.guests[guestIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.demoData.guests[guestIndex];
        }
        // If not found in regular guests, try to find and update in public registrations
        const publicIndex = this.demoData.publicRSVPRegistrations.findIndex(reg => reg.id === guestId);
        if (publicIndex !== -1) {
            // Map guest update fields to public registration fields
            const publicUpdates = {
                ...updates,
                // Map common fields
                status: updates.rsvpStatus || this.demoData.publicRSVPRegistrations[publicIndex].status,
                relationship: updates.relationshipType || this.demoData.publicRSVPRegistrations[publicIndex].relationship,
                side: updates.brideOrGroomSide || this.demoData.publicRSVPRegistrations[publicIndex].side,
                additionalGuests: updates.additionalGuestCount || this.demoData.publicRSVPRegistrations[publicIndex].additionalGuests,
                dietaryRestrictions: Array.isArray(updates.dietaryRestrictions) ? updates.dietaryRestrictions.join(', ') : updates.dietaryRestrictions,
                rsvpSubmittedAt: new Date().toISOString()
            };
            this.demoData.publicRSVPRegistrations[publicIndex] = {
                ...this.demoData.publicRSVPRegistrations[publicIndex],
                ...publicUpdates
            };
            // Return in guest format for consistency
            const updatedReg = this.demoData.publicRSVPRegistrations[publicIndex];
            return {
                id: updatedReg.id,
                name: updatedReg.name,
                phoneNumber: updatedReg.phoneNumber,
                email: updatedReg.email || '',
                dietaryRestrictions: updatedReg.dietaryRestrictions ? [updatedReg.dietaryRestrictions] : [],
                additionalGuestCount: updatedReg.additionalGuests || 0,
                relationshipType: updatedReg.relationship || 'Friend',
                brideOrGroomSide: updatedReg.side || 'bride',
                rsvpStatus: updatedReg.status || 'pending',
                specialRequests: updatedReg.specialRequests || '',
                mealPreference: updatedReg.mealPreference || '',
                isPublicRegistration: true,
                registeredAt: updatedReg.registeredAt,
                createdAt: updatedReg.registeredAt,
                updatedAt: updatedReg.rsvpSubmittedAt || updatedReg.registeredAt
            };
        }
        return null;
    }
    deleteGuest(guestId) {
        if (!this.demoData)
            return false;
        // Try to find and delete from regular guests first
        const guestIndex = this.demoData.guests.findIndex(guest => guest.id === guestId);
        if (guestIndex !== -1) {
            this.demoData.guests.splice(guestIndex, 1);
            return true;
        }
        // Try to find and delete from public registrations
        const publicIndex = this.demoData.publicRSVPRegistrations.findIndex(reg => reg.id === guestId);
        if (publicIndex !== -1) {
            this.demoData.publicRSVPRegistrations.splice(publicIndex, 1);
            return true;
        }
        return false;
    }
    getInvitationTemplates(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.invitationTemplates.filter(template => template.eventId === eventId);
    }
    getInvitationTemplate(templateId) {
        if (!this.demoData)
            return null;
        return this.demoData.invitationTemplates.find(template => template.id === templateId);
    }
    addInvitationTemplate(template) {
        if (!this.demoData)
            return null;
        const newTemplate = {
            ...template,
            id: `template-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.demoData.invitationTemplates.push(newTemplate);
        return newTemplate;
    }
    updateInvitationTemplate(templateId, updates) {
        if (!this.demoData)
            return null;
        const templateIndex = this.demoData.invitationTemplates.findIndex(template => template.id === templateId);
        if (templateIndex !== -1) {
            this.demoData.invitationTemplates[templateIndex] = {
                ...this.demoData.invitationTemplates[templateIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.demoData.invitationTemplates[templateIndex];
        }
        return null;
    }
    getTables(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.tables.filter(table => table.eventId === eventId);
    }
    getTableById(tableId) {
        if (!this.demoData)
            return null;
        return this.demoData.tables.find(table => table.id === tableId);
    }
    addTable(table) {
        if (!this.demoData)
            return null;
        const newTable = {
            ...table,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.demoData.tables.push(newTable);
        return newTable;
    }
    updateTable(tableId, updates) {
        if (!this.demoData)
            return null;
        const tableIndex = this.demoData.tables.findIndex(table => table.id === tableId);
        if (tableIndex !== -1) {
            this.demoData.tables[tableIndex] = {
                ...this.demoData.tables[tableIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.demoData.tables[tableIndex];
        }
        return null;
    }
    deleteTable(tableId) {
        if (!this.demoData)
            return false;
        const tableIndex = this.demoData.tables.findIndex(table => table.id === tableId);
        if (tableIndex !== -1) {
            this.demoData.tables.splice(tableIndex, 1);
            return true;
        }
        return false;
    }
    getVenueElements(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.venueElements.filter(element => element.eventId === eventId);
    }
    getVenueElementById(elementId) {
        if (!this.demoData)
            return null;
        return this.demoData.venueElements.find(element => element.id === elementId);
    }
    addVenueElement(element) {
        if (!this.demoData)
            return null;
        const newElement = {
            ...element,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.demoData.venueElements.push(newElement);
        return newElement;
    }
    updateVenueElement(elementId, updates) {
        if (!this.demoData)
            return null;
        const elementIndex = this.demoData.venueElements.findIndex(element => element.id === elementId);
        if (elementIndex !== -1) {
            this.demoData.venueElements[elementIndex] = {
                ...this.demoData.venueElements[elementIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.demoData.venueElements[elementIndex];
        }
        return null;
    }
    deleteVenueElement(elementId) {
        if (!this.demoData)
            return false;
        const elementIndex = this.demoData.venueElements.findIndex(element => element.id === elementId);
        if (elementIndex !== -1) {
            this.demoData.venueElements.splice(elementIndex, 1);
            return true;
        }
        return false;
    }
    deleteInvitationTemplate(templateId) {
        if (!this.demoData)
            return false;
        const templateIndex = this.demoData.invitationTemplates.findIndex(template => template.id === templateId);
        if (templateIndex !== -1) {
            this.demoData.invitationTemplates.splice(templateIndex, 1);
            return true;
        }
        return false;
    }
    setDefaultInvitationTemplate(templateId, eventId) {
        if (!this.demoData)
            return null;
        // Remove default flag from all templates for this event
        this.demoData.invitationTemplates.forEach(template => {
            if (template.eventId === eventId) {
                template.isDefault = false;
            }
        });
        // Set the specified template as default
        const templateIndex = this.demoData.invitationTemplates.findIndex(template => template.id === templateId);
        if (templateIndex !== -1) {
            this.demoData.invitationTemplates[templateIndex].isDefault = true;
            this.demoData.invitationTemplates[templateIndex].updatedAt = new Date().toISOString();
            return this.demoData.invitationTemplates[templateIndex];
        }
        return null;
    }
    getMessages(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.messages.filter(message => message.eventId === eventId);
    }
    getRSVPTokens(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.rsvpTokens.filter(token => token.eventId === eventId);
    }
    getRSVPToken(token) {
        if (!this.demoData)
            return null;
        return this.demoData.rsvpTokens.find(t => t.token === token);
    }
    getPublicRSVPRegistrations(eventId) {
        if (!this.demoData)
            return [];
        return this.demoData.publicRSVPRegistrations.filter(reg => reg.eventId === eventId);
    }
    addPublicRSVPRegistration(registration) {
        if (!this.demoData)
            return null;
        const newRegistration = {
            ...registration,
            id: `public-guest-${Date.now()}`,
            registeredAt: new Date().toISOString(),
            rsvpSubmittedAt: new Date().toISOString()
        };
        this.demoData.publicRSVPRegistrations.push(newRegistration);
        return newRegistration;
    }
    getAnalytics() {
        if (!this.demoData)
            return {};
        return this.demoData.analytics;
    }
    getAllData() {
        return this.demoData;
    }
}
exports.DemoDataService = DemoDataService;
//# sourceMappingURL=DemoDataService.js.map