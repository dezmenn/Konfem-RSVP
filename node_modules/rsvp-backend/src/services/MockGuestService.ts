import { Guest, ImportResult, ImportError, CSVGuestData, ContactData, ImportPreview, RelationshipType } from '../../../shared/src/types';
import { GuestAnalytics } from './GuestService';
import { DemoDataService } from './DemoDataService';
import { WebSocketService, SyncEvent } from './WebSocketService';

export class MockGuestService {
  private demoDataService: DemoDataService;
  private nextId = 16; // Start after the 15 demo guests

  constructor() {
    this.demoDataService = DemoDataService.getInstance();
  }

  async createGuest(guestData: any): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    try {
      // Basic validation
      if (!guestData.name || !guestData.phoneNumber) {
        return { success: false, errors: ['Name and phone number are required'] };
      }

      const newGuest = {
        ...guestData,
        eventId: guestData.eventId || 'demo-event-1',
        id: `guest-${this.nextId++}`,
        rsvpStatus: guestData.rsvpStatus || 'not_invited',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = this.demoDataService.addGuest(newGuest);
      
      // Broadcast sync event
      this.broadcastSyncEvent('guest_created', guestData.eventId || 'demo-event-1', result);
      
      return { success: true, guest: result };
    } catch (error) {
      return { success: false, errors: ['Failed to create guest'] };
    }
  }

  async getGuest(id: string): Promise<Guest | null> {
    return this.demoDataService.getGuestById(id);
  }

  async getGuestsByEvent(eventId: string, filters: any = {}): Promise<Guest[]> {
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
    let allGuests = [...regularGuests, ...publicGuests];

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      allGuests = allGuests.filter(guest =>
        guest.name.toLowerCase().includes(searchTerm) ||
        guest.phoneNumber.includes(searchTerm)
      );
    }

    if (filters.rsvpStatus && filters.rsvpStatus.length > 0) {
      allGuests = allGuests.filter(guest => filters.rsvpStatus.includes(guest.rsvpStatus));
    }

    if (filters.brideOrGroomSide && filters.brideOrGroomSide.length > 0) {
      allGuests = allGuests.filter(guest => filters.brideOrGroomSide.includes(guest.brideOrGroomSide));
    }

    return allGuests;
  }

  async searchGuests(filters: any): Promise<Guest[]> {
    // Use the same logic as getGuestsByEvent to include public registrations
    let filteredGuests = await this.getGuestsByEvent(filters.eventId || 'demo-event-1', filters);

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredGuests = filteredGuests.filter(guest => 
        guest.name.toLowerCase().includes(searchTerm) ||
        guest.phoneNumber.includes(searchTerm)
      );
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

    if (filters.brideOrGroomSide && filters.brideOrGroomSide.length > 0) {
      filteredGuests = filteredGuests.filter(guest => filters.brideOrGroomSide.includes(guest.brideOrGroomSide));
    }

    return filteredGuests;
  }

  async updateGuest(id: string, updates: any, eventId?: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
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

    // Broadcast sync event
    this.broadcastSyncEvent('guest_updated', eventId || 'demo-event-1', updatedGuest);

    return { success: true, guest: updatedGuest };
  }

  async deleteGuest(id: string, eventId?: string): Promise<{ success: boolean; errors?: string[] }> {
    const success = this.demoDataService.deleteGuest(id);
    
    if (!success) {
      return { success: false, errors: ['Guest not found'] };
    }

    // Broadcast sync event
    this.broadcastSyncEvent('guest_deleted', eventId || 'demo-event-1', { id });

    return { success: true };
  }

  async getGuestAnalytics(eventId: string): Promise<GuestAnalytics> {
    // Use the same logic as getGuestsByEvent to include public registrations
    const guests = await this.getGuestsByEvent(eventId);
    
    const rsvpStatusCounts = guests.reduce((acc, guest) => {
      acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dietaryRestrictionsSummary = guests.reduce((acc, guest) => {
      if (guest.dietaryRestrictions.length === 0) {
        acc['None'] = (acc['None'] || 0) + 1;
      } else {
        guest.dietaryRestrictions.forEach((restriction: string) => {
          acc[restriction] = (acc[restriction] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const brideGroomSideCounts = guests.reduce(
      (acc, guest) => {
        acc[guest.brideOrGroomSide]++;
        return acc;
      },
      { bride: 0, groom: 0 }
    );

    const relationshipTypeCounts = guests.reduce((acc, guest) => {
      acc[guest.relationshipType] = (acc[guest.relationshipType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGuests: guests.length,
      rsvpStatusCounts,
      dietaryRestrictionsSummary,
      brideGroomSideCounts,
      relationshipTypeCounts
    };
  }

  async assignGuestToTable(guestId: string, tableId: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
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
      if (assignedGuestId === guestId) continue; // Skip if guest is already assigned (reassignment case)
      
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

  async unassignGuestFromTable(guestId: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    const guest = this.demoDataService.getGuestById(guestId);
    if (!guest) {
      return { success: false, errors: ['Guest not found'] };
    }

    // Check if guest is assigned to a locked table
    if (guest.tableAssignment) {
      const table = this.demoDataService.getTableById(guest.tableAssignment);
      if (table && table.isLocked) {
        return { 
          success: false, 
          errors: [`Cannot unassign guest from locked table "${table.name}"`] 
        };
      }

      // Remove guest from their current table if they have one
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

  async getGuestsByTable(tableId: string): Promise<Guest[]> {
    const allGuests = this.demoDataService.getGuests('demo-event-1');
    return allGuests.filter(guest => guest.tableAssignment === tableId);
  }

  async importFromCSV(csvContent: string, eventId: string): Promise<ImportResult> {
    // Mock CSV import - just add a few sample guests
    const sampleImportGuests = [
      {
        name: 'Jennifer Martinez',
        phoneNumber: '+1555123456',
        dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
        additionalGuestCount: 1,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride' as const,
        specialRequests: 'Please seat near the dance floor'
      },
      {
        name: 'Thomas Anderson',
        phoneNumber: '+1555123457',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.COLLEAGUE,
        brideOrGroomSide: 'groom' as const,
        specialRequests: ''
      }
    ];

    const importedGuests: Guest[] = [];
    
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

  async previewCSVImport(csvContent: string, eventId: string): Promise<ImportPreview> {
    // Mock preview - return sample data
    const validGuests: Guest[] = [
      {
        id: 'preview-1',
        name: 'Jennifer Martinez',
        phoneNumber: '+1555123456',
        dietaryRestrictions: ['Vegetarian', 'Gluten-free'],
        additionalGuestCount: 1,
        relationshipType: RelationshipType.FRIEND,
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
        relationshipType: RelationshipType.COLLEAGUE,
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

  async importFromContacts(contacts: ContactData[], eventId: string): Promise<ImportResult> {
    const importedGuests: Guest[] = [];
    
    for (const contact of contacts) {
      const phoneNumber = contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0] : '';
      
      if (phoneNumber) {
        const result = await this.createGuest({
          name: contact.name,
          phoneNumber,
          dietaryRestrictions: [],
          additionalGuestCount: 0,
          relationshipType: RelationshipType.FRIEND,
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

  private broadcastSyncEvent(type: SyncEvent['type'], eventId: string, data: any): void {
    try {
      const webSocketService = (global as any).webSocketService as WebSocketService;
      if (webSocketService) {
        const syncEvent: SyncEvent = {
          type,
          eventId,
          data,
          timestamp: new Date()
        };
        webSocketService.broadcastSyncEvent(syncEvent);
      }
    } catch (error) {
      console.error('Failed to broadcast sync event:', error);
    }
  }
}