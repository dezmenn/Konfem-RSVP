"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockGuestAnalytics = exports.mockGuestFilters = exports.invalidGuestInputs = exports.mockGuestInputs = exports.mockGuestData = void 0;
exports.createMockGuest = createMockGuest;
exports.createMockGuestInput = createMockGuestInput;
exports.getGuestsByEvent = getGuestsByEvent;
exports.getGuestsByRSVPStatus = getGuestsByRSVPStatus;
exports.getGuestsByBrideGroomSide = getGuestsByBrideGroomSide;
exports.getGuestsByRelationshipType = getGuestsByRelationshipType;
const types_1 = require("../../../../shared/src/types");
exports.mockGuestData = [
    {
        id: '1',
        name: 'John Smith',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['vegetarian'],
        additionalGuestCount: 1,
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'pending',
        specialRequests: 'Wheelchair accessible seating',
        tableAssignment: undefined,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
    },
    {
        id: '2',
        name: 'Sarah Johnson',
        phoneNumber: '+1234567891',
        dietaryRestrictions: ['gluten-free', 'dairy-free'],
        additionalGuestCount: 0,
        relationshipType: types_1.RelationshipType.COUSIN,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: '',
        tableAssignment: 'table-1',
        createdAt: new Date('2024-01-01T11:00:00Z'),
        updatedAt: new Date('2024-01-02T09:00:00Z')
    },
    {
        id: '3',
        name: 'Michael Brown',
        phoneNumber: '+1234567892',
        dietaryRestrictions: [],
        additionalGuestCount: 2,
        relationshipType: types_1.RelationshipType.UNCLE,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'declined',
        specialRequests: 'Prefers aisle seat',
        tableAssignment: undefined,
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
    },
    {
        id: '4',
        name: 'Emily Davis',
        phoneNumber: '+1234567893',
        dietaryRestrictions: ['vegan'],
        additionalGuestCount: 1,
        relationshipType: types_1.RelationshipType.COLLEAGUE,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: 'Child-friendly seating',
        tableAssignment: 'table-2',
        createdAt: new Date('2024-01-01T13:00:00Z'),
        updatedAt: new Date('2024-01-03T14:00:00Z')
    },
    {
        id: '5',
        name: 'David Wilson',
        phoneNumber: '+1234567894',
        dietaryRestrictions: ['kosher'],
        additionalGuestCount: 0,
        relationshipType: types_1.RelationshipType.GRANDPARENT,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'no_response',
        specialRequests: 'Close to restroom',
        tableAssignment: undefined,
        createdAt: new Date('2024-01-01T14:00:00Z'),
        updatedAt: new Date('2024-01-01T14:00:00Z')
    },
    {
        id: '6',
        name: 'Lisa Anderson',
        phoneNumber: '+1234567895',
        dietaryRestrictions: ['pescatarian'],
        additionalGuestCount: 1,
        relationshipType: types_1.RelationshipType.SIBLING,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: 'Near the dance floor',
        tableAssignment: 'table-1',
        createdAt: new Date('2024-01-01T15:00:00Z'),
        updatedAt: new Date('2024-01-04T16:00:00Z')
    },
    {
        id: '7',
        name: 'Robert Taylor',
        phoneNumber: '+1234567896',
        dietaryRestrictions: [],
        additionalGuestCount: 3,
        relationshipType: types_1.RelationshipType.AUNT,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'pending',
        specialRequests: 'Large table for family',
        tableAssignment: undefined,
        createdAt: new Date('2024-01-01T16:00:00Z'),
        updatedAt: new Date('2024-01-01T16:00:00Z')
    },
    {
        id: '8',
        name: 'Jennifer Martinez',
        phoneNumber: '+1234567897',
        dietaryRestrictions: ['halal'],
        additionalGuestCount: 0,
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'accepted',
        specialRequests: '',
        tableAssignment: 'table-3',
        createdAt: new Date('2024-01-01T17:00:00Z'),
        updatedAt: new Date('2024-01-05T10:00:00Z')
    }
];
exports.mockGuestInputs = [
    {
        eventId: 'event-1',
        name: 'John Smith',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['vegetarian'],
        additionalGuestCount: 1,
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: 'Wheelchair accessible seating'
    },
    {
        eventId: 'event-1',
        name: 'Sarah Johnson',
        phoneNumber: '+1234567891',
        dietaryRestrictions: ['gluten-free', 'dairy-free'],
        additionalGuestCount: 0,
        relationshipType: types_1.RelationshipType.COUSIN,
        brideOrGroomSide: 'bride',
        specialRequests: ''
    },
    {
        eventId: 'event-2',
        name: 'Michael Brown',
        phoneNumber: '+1234567892',
        dietaryRestrictions: [],
        additionalGuestCount: 2,
        relationshipType: types_1.RelationshipType.UNCLE,
        brideOrGroomSide: 'groom',
        specialRequests: 'Prefers aisle seat'
    }
];
exports.invalidGuestInputs = [
    {
        // Missing required fields
        eventId: '',
        name: '',
        phoneNumber: '',
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'bride'
    },
    {
        // Invalid phone number format
        eventId: 'event-1',
        name: 'Test User',
        phoneNumber: 'invalid-phone',
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'bride'
    },
    {
        // Invalid relationship type
        eventId: 'event-1',
        name: 'Test User',
        phoneNumber: '+1234567890',
        relationshipType: 'InvalidType',
        brideOrGroomSide: 'bride'
    },
    {
        // Invalid bride/groom side
        eventId: 'event-1',
        name: 'Test User',
        phoneNumber: '+1234567890',
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'invalid'
    },
    {
        // Negative additional guest count
        eventId: 'event-1',
        name: 'Test User',
        phoneNumber: '+1234567890',
        relationshipType: types_1.RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        additionalGuestCount: -1
    }
];
exports.mockGuestFilters = [
    {
        eventId: 'event-1'
    },
    {
        eventId: 'event-1',
        rsvpStatus: 'accepted'
    },
    {
        eventId: 'event-1',
        relationshipType: types_1.RelationshipType.FRIEND
    },
    {
        eventId: 'event-1',
        brideOrGroomSide: 'bride'
    },
    {
        eventId: 'event-1',
        search: 'John'
    },
    {
        eventId: 'event-1',
        rsvpStatus: 'pending',
        brideOrGroomSide: 'groom',
        search: 'Smith'
    }
];
exports.mockGuestAnalytics = {
    totalGuests: 8,
    rsvpStatusCounts: {
        pending: 2,
        accepted: 4,
        declined: 1,
        no_response: 1
    },
    dietaryRestrictionsSummary: {
        vegetarian: 1,
        'gluten-free': 1,
        'dairy-free': 1,
        vegan: 1,
        kosher: 1,
        pescatarian: 1,
        halal: 1
    },
    brideGroomSideCounts: {
        bride: 4,
        groom: 4
    },
    relationshipTypeCounts: {
        [types_1.RelationshipType.FRIEND]: 2,
        [types_1.RelationshipType.COUSIN]: 1,
        [types_1.RelationshipType.UNCLE]: 1,
        [types_1.RelationshipType.COLLEAGUE]: 1,
        [types_1.RelationshipType.GRANDPARENT]: 1,
        [types_1.RelationshipType.SIBLING]: 1,
        [types_1.RelationshipType.AUNT]: 1
    }
};
// Helper function to create a guest with custom properties
function createMockGuest(overrides = {}) {
    return {
        ...exports.mockGuestData[0],
        ...overrides
    };
}
// Helper function to create guest input with custom properties
function createMockGuestInput(overrides = {}) {
    return {
        ...exports.mockGuestInputs[0],
        ...overrides
    };
}
// Helper function to get guests by event
function getGuestsByEvent(eventId) {
    return exports.mockGuestData.filter(guest => exports.mockGuestInputs.some(input => input.eventId === eventId && input.name === guest.name));
}
// Helper function to get guests by RSVP status
function getGuestsByRSVPStatus(status) {
    return exports.mockGuestData.filter(guest => guest.rsvpStatus === status);
}
// Helper function to get guests by bride/groom side
function getGuestsByBrideGroomSide(side) {
    return exports.mockGuestData.filter(guest => guest.brideOrGroomSide === side);
}
// Helper function to get guests by relationship type
function getGuestsByRelationshipType(relationshipType) {
    return exports.mockGuestData.filter(guest => guest.relationshipType === relationshipType);
}
//# sourceMappingURL=guestFixtures.js.map