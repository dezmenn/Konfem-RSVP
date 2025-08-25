"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEventService = void 0;
const DemoDataService_1 = require("./DemoDataService");
const logger_1 = require("../utils/logger");
class MockEventService {
    constructor() {
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
    }
    async findById(eventId) {
        try {
            const eventData = this.demoDataService.getEvent(eventId);
            if (!eventData) {
                return null;
            }
            // For demo purposes, always use current date + 3 days for event date
            // and current date + 2 days for RSVP deadline to ensure it's in the future
            const now = new Date();
            const eventDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
            const rsvpDeadline = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now
            // Convert demo data to Event interface with dynamic dates
            const event = {
                id: eventData.id,
                title: eventData.title,
                description: eventData.description || '',
                date: eventDate,
                location: eventData.location,
                rsvpDeadline: rsvpDeadline,
                organizerId: eventData.organizerId || 'demo-organizer-1',
                publicRSVPEnabled: eventData.publicRSVPEnabled || false,
                publicRSVPLink: eventData.publicRSVPLink || '',
                createdAt: new Date(eventData.createdAt || '2024-01-01T00:00:00Z'),
                updatedAt: new Date(eventData.updatedAt || '2024-01-01T00:00:00Z')
            };
            return event;
        }
        catch (error) {
            logger_1.logger.error('Error finding event by ID:', error);
            return null;
        }
    }
    async findByOrganizerId(organizerId) {
        try {
            const eventData = this.demoDataService.getEvent('demo-event-1');
            if (!eventData || eventData.organizerId !== organizerId) {
                return [];
            }
            const event = await this.findById('demo-event-1');
            return event ? [event] : [];
        }
        catch (error) {
            logger_1.logger.error('Error finding events by organizer ID:', error);
            return [];
        }
    }
    async findUpcomingEvents(organizerId) {
        try {
            const event = await this.findById('demo-event-1');
            if (!event) {
                return [];
            }
            // Check if event is upcoming
            if (event.date > new Date()) {
                if (!organizerId || event.organizerId === organizerId) {
                    return [event];
                }
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error finding upcoming events:', error);
            return [];
        }
    }
    async findPastEvents(organizerId) {
        try {
            const event = await this.findById('demo-event-1');
            if (!event) {
                return [];
            }
            // Check if event is past
            if (event.date <= new Date()) {
                if (!organizerId || event.organizerId === organizerId) {
                    return [event];
                }
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error finding past events:', error);
            return [];
        }
    }
    async findAll() {
        try {
            const event = await this.findById('demo-event-1');
            return event ? [event] : [];
        }
        catch (error) {
            logger_1.logger.error('Error finding all events:', error);
            return [];
        }
    }
    async isRSVPDeadlinePassed(eventId) {
        try {
            const event = await this.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            return event.rsvpDeadline <= new Date();
        }
        catch (error) {
            logger_1.logger.error('Error checking RSVP deadline:', error);
            throw error;
        }
    }
    // Mock methods for compatibility
    async create(eventData) {
        throw new Error('Create operation not supported in demo mode');
    }
    async update(id, updates) {
        throw new Error('Update operation not supported in demo mode');
    }
    async delete(id) {
        throw new Error('Delete operation not supported in demo mode');
    }
    async enablePublicRSVP(eventId) {
        throw new Error('Enable public RSVP operation not supported in demo mode');
    }
    async disablePublicRSVP(eventId) {
        throw new Error('Disable public RSVP operation not supported in demo mode');
    }
}
exports.MockEventService = MockEventService;
//# sourceMappingURL=MockEventService.js.map