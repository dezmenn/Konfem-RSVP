import { Guest, RelationshipType } from '../../../../shared/src/types';
import { GuestInput } from '../../models/Guest';

export const mockGuestData: Guest[] = [
  {
    id: '1',
    name: 'John Smith',
    phoneNumber: '+1234567890',
    dietaryRestrictions: ['vegetarian'],
    additionalGuestCount: 1,
    relationshipType: RelationshipType.FRIEND,
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
    relationshipType: RelationshipType.COUSIN,
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
    relationshipType: RelationshipType.UNCLE,
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
    relationshipType: RelationshipType.COLLEAGUE,
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
    relationshipType: RelationshipType.GRANDPARENT,
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
    relationshipType: RelationshipType.SIBLING,
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
    relationshipType: RelationshipType.AUNT,
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
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'groom',
    rsvpStatus: 'accepted',
    specialRequests: '',
    tableAssignment: 'table-3',
    createdAt: new Date('2024-01-01T17:00:00Z'),
    updatedAt: new Date('2024-01-05T10:00:00Z')
  }
];

export const mockGuestInputs: GuestInput[] = [
  {
    eventId: 'event-1',
    name: 'John Smith',
    phoneNumber: '+1234567890',
    dietaryRestrictions: ['vegetarian'],
    additionalGuestCount: 1,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    specialRequests: 'Wheelchair accessible seating'
  },
  {
    eventId: 'event-1',
    name: 'Sarah Johnson',
    phoneNumber: '+1234567891',
    dietaryRestrictions: ['gluten-free', 'dairy-free'],
    additionalGuestCount: 0,
    relationshipType: RelationshipType.COUSIN,
    brideOrGroomSide: 'bride',
    specialRequests: ''
  },
  {
    eventId: 'event-2',
    name: 'Michael Brown',
    phoneNumber: '+1234567892',
    dietaryRestrictions: [],
    additionalGuestCount: 2,
    relationshipType: RelationshipType.UNCLE,
    brideOrGroomSide: 'groom',
    specialRequests: 'Prefers aisle seat'
  }
];

export const invalidGuestInputs = [
  {
    // Missing required fields
    eventId: '',
    name: '',
    phoneNumber: '',
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride' as const
  },
  {
    // Invalid phone number format
    eventId: 'event-1',
    name: 'Test User',
    phoneNumber: 'invalid-phone',
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride' as const
  },
  {
    // Invalid relationship type
    eventId: 'event-1',
    name: 'Test User',
    phoneNumber: '+1234567890',
    relationshipType: 'InvalidType' as any,
    brideOrGroomSide: 'bride' as const
  },
  {
    // Invalid bride/groom side
    eventId: 'event-1',
    name: 'Test User',
    phoneNumber: '+1234567890',
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'invalid' as any
  },
  {
    // Negative additional guest count
    eventId: 'event-1',
    name: 'Test User',
    phoneNumber: '+1234567890',
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride' as const,
    additionalGuestCount: -1
  }
];

export const mockGuestFilters = [
  {
    eventId: 'event-1'
  },
  {
    eventId: 'event-1',
    rsvpStatus: 'accepted'
  },
  {
    eventId: 'event-1',
    relationshipType: RelationshipType.FRIEND
  },
  {
    eventId: 'event-1',
    brideOrGroomSide: 'bride' as const
  },
  {
    eventId: 'event-1',
    search: 'John'
  },
  {
    eventId: 'event-1',
    rsvpStatus: 'pending',
    brideOrGroomSide: 'groom' as const,
    search: 'Smith'
  }
];

export const mockGuestAnalytics = {
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
    [RelationshipType.FRIEND]: 2,
    [RelationshipType.COUSIN]: 1,
    [RelationshipType.UNCLE]: 1,
    [RelationshipType.COLLEAGUE]: 1,
    [RelationshipType.GRANDPARENT]: 1,
    [RelationshipType.SIBLING]: 1,
    [RelationshipType.AUNT]: 1
  }
};

// Helper function to create a guest with custom properties
export function createMockGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    ...mockGuestData[0],
    ...overrides
  };
}

// Helper function to create guest input with custom properties
export function createMockGuestInput(overrides: Partial<GuestInput> = {}): GuestInput {
  return {
    ...mockGuestInputs[0],
    ...overrides
  };
}

// Helper function to get guests by event
export function getGuestsByEvent(eventId: string): Guest[] {
  return mockGuestData.filter(guest => 
    mockGuestInputs.some(input => input.eventId === eventId && input.name === guest.name)
  );
}

// Helper function to get guests by RSVP status
export function getGuestsByRSVPStatus(status: string): Guest[] {
  return mockGuestData.filter(guest => guest.rsvpStatus === status);
}

// Helper function to get guests by bride/groom side
export function getGuestsByBrideGroomSide(side: 'bride' | 'groom'): Guest[] {
  return mockGuestData.filter(guest => guest.brideOrGroomSide === side);
}

// Helper function to get guests by relationship type
export function getGuestsByRelationshipType(relationshipType: RelationshipType): Guest[] {
  return mockGuestData.filter(guest => guest.relationshipType === relationshipType);
}