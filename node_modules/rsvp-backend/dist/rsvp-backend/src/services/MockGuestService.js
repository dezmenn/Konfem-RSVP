"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGuestService = void 0;
const types_1 = require("../../../shared/src/types");
const DemoDataService_1 = require("./DemoDataService");
class MockGuestService {
    constructor() {
        this.nextId = 16; // Start after the 15 demo guests
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
    }
    async createGuest(guestData) {
        try {
            // Basic validation
            if (!guestData.name || !guestData.phoneNumber) {
                return { success: false, errors: ['Name and phone number are required'] };
            }
            const newGuest = {
                ...guestData,
                eventId: guestData.eventId || 'demo-event-1',
                id: `guest-${this.nextId++}`,
                rsvpStatus: guestData.rsvpStatus || 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const result = this.demoDataService.addGuest(newGuest);
            return { success: true, guest: result };
        }
        catch (error) {
            return { success: false, errors: ['Failed to create guest'] };
        }
    }
    async getGuest(id) {
        return this.demoDataService.getGuestById(id);
    }
    async getGuestsByEvent(eventId) {
        // Get regular guests
        const regularGuests = this.demoDataService.getGuests(eventId);
        // Get public RSVP registrations and convert them to guest format
        const publicRegistrations = this.demoDataService.getPublicRSVPRegistrations(eventId);
        const publicGuests = publicRegistrations.map(reg => ({
            id: reg.id,
            name: reg.name,
            phoneNumber: reg.phoneNumber,
            email: reg.email || '',
            dietaryRestrictions: reg.dietaryRestrictions ? [reg.dietaryRestrictions] : [],
            additionalGuestCount: reg.additionalGuests || 0,
            relationshipType: reg.relationship || 'Friend',
            brideOrGroomSide: reg.side || 'bride',
            rsvpStatus: reg.status || 'pending',
            specialRequests: reg.specialRequests || '',
            mealPreference: reg.mealPreference || '',
            isPublicRegistration: true, // Flag to identify public registrations
            registeredAt: reg.registeredAt,
            createdAt: reg.registeredAt,
            updatedAt: reg.rsvpSubmittedAt || reg.registeredAt
        }));
        // Combine regular guests and public registrations
        return [...regularGuests, ...publicGuests];
    }
    async searchGuests(filters) {
        // Use the same logic as getGuestsByEvent to include public registrations
        let filteredGuests = await this.getGuestsByEvent(filters.eventId || 'demo-event-1');
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredGuests = filteredGuests.filter(guest => guest.name.toLowerCase().includes(searchTerm) ||
                guest.phoneNumber.includes(searchTerm));
        }
        // Handle multiple RSVP status values
        if (filters.rsvpStatus) {
            const rsvpStatuses = Array.isArray(filters.rsvpStatus) ? filters.rsvpStatus : [filters.rsvpStatus];
            if (rsvpStatuses.length > 0) {
                filteredGuests = filteredGuests.filter(guest => rsvpStatuses.includes(guest.rsvpStatus));
            }
        }
        // Handle multiple relationship type values
        if (filters.relationshipType) {
            const relationshipTypes = Array.isArray(filters.relationshipType) ? filters.relationshipType : [filters.relationshipType];
            if (relationshipTypes.length > 0) {
                filteredGuests = filteredGuests.filter(guest => relationshipTypes.includes(guest.relationshipType));
            }
        }
        if (filters.brideOrGroomSide) {
            filteredGuests = filteredGuests.filter(guest => guest.brideOrGroomSide === filters.brideOrGroomSide);
        }
        return filteredGuests;
    }
    async updateGuest(id, updates) {
        // Basic validation
        if (updates.name !== undefined && !updates.name) {
            return { success: false, errors: ['Name is required'] };
        }
        if (updates.phoneNumber !== undefined && !updates.phoneNumber) {
            return { success: false, errors: ['Phone number is required'] };
        }
        const updatedGuest = this.demoDataService.updateGuest(id, updates);
        if (!updatedGuest) {
            return { success: false, errors: ['Guest not found'] };
        }
        return { success: true, guest: updatedGuest };
    }
    async deleteGuest(id) {
        const success = this.demoDataService.deleteGuest(id);
        if (!success) {
            return { success: false, errors: ['Guest not found'] };
        }
        return { success: true };
    }
    async getGuestAnalytics(eventId) {
        // Use the same logic as getGuestsByEvent to include public registrations
        const guests = await this.getGuestsByEvent(eventId);
        const rsvpStatusCounts = guests.reduce((acc, guest) => {
            acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
            return acc;
        }, {});
        const dietaryRestrictionsSummary = guests.reduce((acc, guest) => {
            if (guest.dietaryRestrictions.length === 0) {
                acc['None'] = (acc['None'] || 0) + 1;
            }
            else {
                guest.dietaryRestrictions.forEach((restriction) => {
                    acc[restriction] = (acc[restriction] || 0) + 1;
                });
            }
            return acc;
        }, {});
        const brideGroomSideCounts = guests.reduce((acc, guest) => {
            acc[guest.brideOrGroomSide]++;
            return acc;
        }, { bride: 0, groom: 0 });
        const relationshipTypeCounts = guests.reduce((acc, guest) => {
            acc[guest.relationshipType] = (acc[guest.relationshipType] || 0) + 1;
            return acc;
        }, {});
        return {
            totalGuests: guests.length,
            rsvpStatusCounts,
            dietaryRestrictionsSummary,
            brideGroomSideCounts,
            relationshipTypeCounts
        };
    }
    async assignGuestToTable(guestId, tableId) {
        const guest = this.demoDataService.getGuestById(guestId);
        if (!guest) {
            return { success: false, errors: ['Guest not found'] };
        }
        const table = this.demoDataService.getTableById(tableId);
        if (!table) {
            return { success: false, errors: ['Table not found'] };
        }
        // Check if table is locked (prevent assignment to locked tables unless guest is already assigned there)
        if (table.isLocked && guest.tableAssignment !== tableId) {
            return { success: false, errors: [`Table "${table.name}" is locked and cannot accept new guests`] };
        }
        // Calculate current capacity usage including additional guests
        const currentAssignedGuests = table.assignedGuests || [];
        let currentSeatsUsed = 0;
        for (const assignedGuestId of currentAssignedGuests) {
            if (assignedGuestId === guestId)
                continue; // Skip if guest is already assigned (reassignment case)
            const assignedGuest = this.demoDataService.getGuestById(assignedGuestId);
            if (assignedGuest) {
                currentSeatsUsed += 1 + (assignedGuest.additionalGuestCount || 0);
            }
        }
        // Calculate seats needed for this guest
        const guestSeatsNeeded = 1 + (guest.additionalGuestCount || 0);
        // Check capacity constraint
        const availableSeats = table.capacity - currentSeatsUsed;
        if (availableSeats < guestSeatsNeeded && guest.tableAssignment !== tableId) {
            return {
                success: false,
                errors: [`Table "${table.name}" doesn't have enough capacity. Needs ${guestSeatsNeeded} seats, but only ${availableSeats} available.`]
            };
        }
        // Remove guest from old table if they were assigned to one
        if (guest.tableAssignment) {
            const oldTable = this.demoDataService.getTableById(guest.tableAssignment);
            if (oldTable && oldTable.assignedGuests) {
                const oldTableIndex = oldTable.assignedGuests.indexOf(guestId);
                if (oldTableIndex > -1) {
                    oldTable.assignedGuests.splice(oldTableIndex, 1);
                    this.demoDataService.updateTable(oldTable.id, { assignedGuests: oldTable.assignedGuests });
                }
            }
        }
        // Add guest to new table's assignedGuests array
        if (!table.assignedGuests) {
            table.assignedGuests = [];
        }
        if (!table.assignedGuests.includes(guestId)) {
            table.assignedGuests.push(guestId);
            this.demoDataService.updateTable(tableId, { assignedGuests: table.assignedGuests });
        }
        // Update guest's tableAssignment
        const updatedGuest = this.demoDataService.updateGuest(guestId, { tableAssignment: tableId });
        return { success: true, guest: updatedGuest };
    }
    async unassignGuestFromTable(guestId) {
        const guest = this.demoDataService.getGuestById(guestId);
        if (!guest) {
            return { success: false, errors: ['Guest not found'] };
        }
        // Remove guest from their current table if they have one
        if (guest.tableAssignment) {
            const table = this.demoDataService.getTableById(guest.tableAssignment);
            if (table && table.assignedGuests) {
                const guestIndex = table.assignedGuests.indexOf(guestId);
                if (guestIndex > -1) {
                    table.assignedGuests.splice(guestIndex, 1);
                    this.demoDataService.updateTable(table.id, { assignedGuests: table.assignedGuests });
                }
            }
        }
        // Update guest's tableAssignment to null
        const updatedGuest = this.demoDataService.updateGuest(guestId, { tableAssignment: null });
        return { success: true, guest: updatedGuest };
    }
    async getGuestsByTable(tableId) {
        const allGuests = this.demoDataService.getGuests('demo-event-1');
        return allGuests.filter(guest => guest.tableAssignment === tableId);
    }
    async importFromCSV(csvContent, eventId) {
        // Mock CSV import - just add a few sample guests
        const sampleImportGuests = [
            {
                name: 'Jennifer Martinez',
                phoneNumber: '+1555123456',
                dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
                additionalGuestCount: 1,
                relationshipType: types_1.RelationshipType.FRIEND,
                brideOrGroomSide: 'bride',
                specialRequests: 'Please seat near the dance floor'
            },
            {
                name: 'Thomas Anderson',
                phoneNumber: '+1555123457',
                dietaryRestrictions: [],
                additionalGuestCount: 0,
                relationshipType: types_1.RelationshipType.COLLEAGUE,
                brideOrGroomSide: 'groom',
                specialRequests: ''
            }
        ];
        const importedGuests = [];
        for (const guestData of sampleImportGuests) {
            const result = await this.createGuest(guestData);
            if (result.success && result.guest) {
                importedGuests.push(result.guest);
            }
        }
        return {
            success: true,
            totalProcessed: sampleImportGuests.length,
            successfulImports: importedGuests.length,
            failedImports: 0,
            errors: [],
            importedGuests
        };
    }
    async previewCSVImport(csvContent, eventId) {
        // Mock preview - return sample data
        const validGuests = [
            {
                id: 'preview-1',
                name: 'Jennifer Martinez',
                phoneNumber: '+1555123456',
                dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
                additionalGuestCount: 1,
                relationshipType: types_1.RelationshipType.FRIEND,
                brideOrGroomSide: 'bride',
                rsvpStatus: 'pending',
                specialRequests: 'Please seat near the dance floor',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'preview-2',
                name: 'Thomas Anderson',
                phoneNumber: '+1555123457',
                dietaryRestrictions: [],
                additionalGuestCount: 0,
                relationshipType: types_1.RelationshipType.COLLEAGUE,
                brideOrGroomSide: 'groom',
                rsvpStatus: 'pending',
                specialRequests: '',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        return {
            validGuests,
            invalidRows: [],
            totalRows: validGuests.length
        };
    }
    async importFromContacts(contacts, eventId) {
        const importedGuests = [];
        for (const contact of contacts) {
            const phoneNumber = contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0] : '';
            if (phoneNumber) {
                const result = await this.createGuest({
                    name: contact.name,
                    phoneNumber,
                    dietaryRestrictions: [],
                    additionalGuestCount: 0,
                    relationshipType: types_1.RelationshipType.FRIEND,
                    brideOrGroomSide: 'bride',
                    specialRequests: ''
                });
                if (result.success && result.guest) {
                    importedGuests.push(result.guest);
                }
            }
        }
        return {
            success: true,
            totalProcessed: contacts.length,
            successfulImports: importedGuests.length,
            failedImports: contacts.length - importedGuests.length,
            errors: [],
            importedGuests
        };
    }
}
exports.MockGuestService = MockGuestService;
//# sourceMappingURL=MockGuestService.js.map