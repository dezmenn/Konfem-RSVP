"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGuestRepository = void 0;
const DemoDataService_1 = require("./DemoDataService");
class MockGuestRepository {
    constructor() {
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
    }
    async create(guestData) {
        const newGuest = {
            ...guestData,
            id: `guest-${Date.now()}`,
            rsvpStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return this.demoDataService.addGuest(newGuest);
    }
    async findById(id) {
        return this.demoDataService.getGuestById(id);
    }
    async findByEventId(eventId) {
        // Get regular guests
        const regularGuests = this.demoDataService.getGuests(eventId);
        // Get public RSVP registrations and convert them to guest format
        const publicRegistrations = this.demoDataService.getPublicRSVPRegistrations(eventId);
        const publicGuests = publicRegistrations.map((reg) => ({
            id: reg.id,
            name: reg.name,
            phoneNumber: reg.phoneNumber,
            email: reg.email || '',
            eventId: reg.eventId,
            dietaryRestrictions: reg.dietaryRestrictions || [],
            additionalGuestCount: reg.additionalGuestCount || 0,
            relationshipType: reg.relationshipType || 'Other',
            brideOrGroomSide: reg.brideOrGroomSide || 'bride',
            rsvpStatus: reg.attendanceStatus || 'pending',
            specialRequests: reg.specialRequests || '',
            tableAssignment: reg.tableAssignment || null,
            createdAt: new Date(reg.registeredAt || Date.now()),
            updatedAt: new Date(reg.rsvpSubmittedAt || Date.now())
        }));
        // Combine regular guests and public registrations
        return [...regularGuests, ...publicGuests];
    }
    async findWithFilters(filters) {
        let guests = this.demoDataService.getGuests(filters.eventId || '');
        if (filters.rsvpStatus) {
            guests = guests.filter(guest => guest.rsvpStatus === filters.rsvpStatus);
        }
        if (filters.relationshipType) {
            guests = guests.filter(guest => guest.relationshipType === filters.relationshipType);
        }
        if (filters.brideOrGroomSide) {
            guests = guests.filter(guest => guest.brideOrGroomSide === filters.brideOrGroomSide);
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            guests = guests.filter(guest => guest.name.toLowerCase().includes(searchLower) ||
                guest.phoneNumber.includes(filters.search));
        }
        return guests;
    }
    async update(id, updates) {
        const guest = await this.findById(id);
        if (!guest)
            return null;
        const updatedGuest = {
            ...guest,
            ...updates,
            updatedAt: new Date()
        };
        return this.demoDataService.updateGuest(id, updatedGuest);
    }
    async delete(id) {
        return this.demoDataService.deleteGuest(id);
    }
    async findByPhoneNumber(phoneNumber) {
        // Search across all events since we don't have a getAllGuests method
        const allGuests = this.demoDataService.getGuests('demo-event-1'); // Use the demo event ID
        return allGuests.find((guest) => guest.phoneNumber === phoneNumber) || null;
    }
    async getGuestCountByStatus(eventId) {
        const guests = await this.findByEventId(eventId);
        return guests.reduce((acc, guest) => {
            acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
            return acc;
        }, {});
    }
    async getDietaryRestrictionsSummary(eventId) {
        const guests = await this.findByEventId(eventId);
        const summary = {};
        guests.forEach(guest => {
            if (guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0) {
                guest.dietaryRestrictions.forEach(restriction => {
                    summary[restriction] = (summary[restriction] || 0) + 1;
                });
            }
        });
        return summary;
    }
    async getAnalytics(eventId) {
        const guests = await this.findByEventId(eventId);
        const rsvpStatusCounts = guests.reduce((acc, guest) => {
            acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
            return acc;
        }, {});
        const brideGroomSideCounts = guests.reduce((acc, guest) => {
            acc[guest.brideOrGroomSide] = (acc[guest.brideOrGroomSide] || 0) + 1;
            return acc;
        }, {});
        return {
            totalGuests: guests.length,
            rsvpStatusCounts,
            brideGroomSideCounts,
            // Add other analytics as needed
        };
    }
}
exports.MockGuestRepository = MockGuestRepository;
//# sourceMappingURL=MockGuestRepository.js.map