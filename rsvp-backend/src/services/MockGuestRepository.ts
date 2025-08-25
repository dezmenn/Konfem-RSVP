import { Guest } from '../../../shared/src/types';
import { GuestInput, GuestUpdate } from '../models/Guest';
import { DemoDataService } from './DemoDataService';

export interface GuestFilters {
  eventId?: string;
  rsvpStatus?: string;
  relationshipType?: string;
  brideOrGroomSide?: 'bride' | 'groom';
  search?: string;
}

export class MockGuestRepository {
  private demoDataService: DemoDataService;

  constructor() {
    this.demoDataService = DemoDataService.getInstance();
  }

  async create(guestData: GuestInput): Promise<Guest> {
    const newGuest = {
      ...guestData,
      id: `guest-${Date.now()}`,
      rsvpStatus: 'not_invited' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.demoDataService.addGuest(newGuest);
  }

  async findById(id: string): Promise<Guest | null> {
    return this.demoDataService.getGuestById(id);
  }

  async findByEventId(eventId: string): Promise<Guest[]> {
    // Get regular guests
    const regularGuests = this.demoDataService.getGuests(eventId);
    
    // Get public RSVP registrations and convert them to guest format
    const publicRegistrations = this.demoDataService.getPublicRSVPRegistrations(eventId);
    const publicGuests = publicRegistrations.map((reg: any) => ({
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

  async findWithFilters(filters: GuestFilters): Promise<Guest[]> {
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
      guests = guests.filter(guest => 
        guest.name.toLowerCase().includes(searchLower) ||
        guest.phoneNumber.includes(filters.search!)
      );
    }

    return guests;
  }

  async update(id: string, updates: GuestUpdate): Promise<Guest | null> {
    const guest = await this.findById(id);
    if (!guest) return null;

    const updatedGuest = {
      ...guest,
      ...updates,
      updatedAt: new Date()
    };

    return this.demoDataService.updateGuest(id, updatedGuest);
  }

  async delete(id: string): Promise<boolean> {
    return this.demoDataService.deleteGuest(id);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Guest | null> {
    // Search across all events since we don't have a getAllGuests method
    const allGuests = this.demoDataService.getGuests('demo-event-1'); // Use the demo event ID
    return allGuests.find((guest: any) => guest.phoneNumber === phoneNumber) || null;
  }

  async getGuestCountByStatus(eventId: string): Promise<Record<string, number>> {
    const guests = await this.findByEventId(eventId);
    
    return guests.reduce((acc, guest) => {
      acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async getDietaryRestrictionsSummary(eventId: string): Promise<Record<string, number>> {
    const guests = await this.findByEventId(eventId);
    
    const summary: Record<string, number> = {};
    
    guests.forEach(guest => {
      if (guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0) {
        guest.dietaryRestrictions.forEach(restriction => {
          summary[restriction] = (summary[restriction] || 0) + 1;
        });
      }
    });
    
    return summary;
  }

  async getAnalytics(eventId: string): Promise<any> {
    const guests = await this.findByEventId(eventId);
    
    const rsvpStatusCounts = guests.reduce((acc, guest) => {
      acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brideGroomSideCounts = guests.reduce((acc, guest) => {
      acc[guest.brideOrGroomSide] = (acc[guest.brideOrGroomSide] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGuests: guests.length,
      rsvpStatusCounts,
      brideGroomSideCounts,
      // Add other analytics as needed
    };
  }
}