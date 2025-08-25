import { GuestRepository, GuestFilters } from '../repositories/GuestRepository';
import { GuestModel, GuestInput, GuestUpdate } from '../models/Guest';
import { Guest, ImportResult, ImportError, CSVGuestData, ContactData, ImportPreview, RelationshipType } from '../../../shared/src/types';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { WebSocketService, SyncEvent } from './WebSocketService';

export interface GuestAnalytics {
  totalGuests: number;
  rsvpStatusCounts: Record<string, number>;
  dietaryRestrictionsSummary: Record<string, number>;
  brideGroomSideCounts: { bride: number; groom: number };
  relationshipTypeCounts: Record<string, number>;
}

export class GuestService {
  private guestRepository: GuestRepository;

  constructor(guestRepository: GuestRepository) {
    this.guestRepository = guestRepository;
  }

  async createGuest(guestData: GuestInput): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    // Validate input
    const validation = GuestModel.validate(guestData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      // Sanitize input
      const sanitizedData = GuestModel.sanitize(guestData);
      
      // Create guest
      const guest = await this.guestRepository.create(sanitizedData);
      
      // Broadcast sync event
      this.broadcastSyncEvent('guest_created', guestData.eventId, guest);
      
      return { success: true, guest };
    } catch (error) {
      console.error('Error creating guest:', error);
      return { success: false, errors: ['Failed to create guest'] };
    }
  }

  async getGuest(id: string): Promise<Guest | null> {
    try {
      return await this.guestRepository.findById(id);
    } catch (error) {
      console.error('Error fetching guest:', error);
      return null;
    }
  }

  async getGuestsByEvent(eventId: string): Promise<Guest[]> {
    try {
      return await this.guestRepository.findByEventId(eventId);
    } catch (error) {
      console.error('Error fetching guests by event:', error);
      return [];
    }
  }

  async searchGuests(filters: GuestFilters): Promise<Guest[]> {
    try {
      return await this.guestRepository.findWithFilters(filters);
    } catch (error) {
      console.error('Error searching guests:', error);
      return [];
    }
  }

  async updateGuest(id: string, updates: GuestUpdate, eventId?: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    // Validate updates
    const validation = GuestModel.validateUpdate(updates);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      // Check if guest exists
      const existingGuest = await this.guestRepository.findById(id);
      if (!existingGuest) {
        return { success: false, errors: ['Guest not found'] };
      }

      // Update guest
      const updatedGuest = await this.guestRepository.update(id, updates);
      
      if (!updatedGuest) {
        return { success: false, errors: ['Failed to update guest'] };
      }

      // Broadcast sync event - use provided eventId or default
      this.broadcastSyncEvent('guest_updated', eventId || 'demo-event-1', updatedGuest);

      return { success: true, guest: updatedGuest };
    } catch (error) {
      console.error('Error updating guest:', error);
      return { success: false, errors: ['Failed to update guest'] };
    }
  }

  async deleteGuest(id: string, eventId?: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Check if guest exists
      const existingGuest = await this.guestRepository.findById(id);
      if (!existingGuest) {
        return { success: false, errors: ['Guest not found'] };
      }

      // Delete guest
      const deleted = await this.guestRepository.delete(id);
      
      if (!deleted) {
        return { success: false, errors: ['Failed to delete guest'] };
      }

      // Broadcast sync event - use provided eventId or default
      this.broadcastSyncEvent('guest_deleted', eventId || 'demo-event-1', { id: existingGuest.id });

      return { success: true };
    } catch (error) {
      console.error('Error deleting guest:', error);
      return { success: false, errors: ['Failed to delete guest'] };
    }
  }

  async getGuestAnalytics(eventId: string): Promise<GuestAnalytics> {
    try {
      const guests = await this.guestRepository.findByEventId(eventId);
      const rsvpStatusCounts = await this.guestRepository.getGuestCountByStatus(eventId);
      const dietaryRestrictionsSummary = await this.guestRepository.getDietaryRestrictionsSummary(eventId);

      // Calculate bride/groom side counts
      const brideGroomSideCounts = guests.reduce(
        (acc, guest) => {
          acc[guest.brideOrGroomSide]++;
          return acc;
        },
        { bride: 0, groom: 0 }
      );

      // Calculate relationship type counts
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
    } catch (error) {
      console.error('Error getting guest analytics:', error);
      return {
        totalGuests: 0,
        rsvpStatusCounts: {},
        dietaryRestrictionsSummary: {},
        brideGroomSideCounts: { bride: 0, groom: 0 },
        relationshipTypeCounts: {}
      };
    }
  }

  async assignGuestToTable(guestId: string, tableId: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    try {
      const guest = await this.guestRepository.assignToTable(guestId, tableId);
      
      if (!guest) {
        return { success: false, errors: ['Guest not found or failed to assign'] };
      }

      return { success: true, guest };
    } catch (error) {
      console.error('Error assigning guest to table:', error);
      return { success: false, errors: ['Failed to assign guest to table'] };
    }
  }

  async unassignGuestFromTable(guestId: string): Promise<{ success: boolean; guest?: Guest; errors?: string[] }> {
    try {
      // First, check if the guest is assigned to a locked table
      const currentGuest = await this.guestRepository.findById(guestId);
      if (!currentGuest) {
        return { success: false, errors: ['Guest not found'] };
      }

      // If guest is assigned to a table, check if it's locked
      if (currentGuest.tableAssignment) {
        // We need to get the table to check if it's locked
        // Since we don't have direct access to TableRepository here, we'll need to import it
        // For now, let's assume the repository method will handle this check
        // TODO: Add table lock check here when TableRepository is available
      }

      const guest = await this.guestRepository.unassignFromTable(guestId);
      
      if (!guest) {
        return { success: false, errors: ['Guest not found or failed to unassign'] };
      }

      return { success: true, guest };
    } catch (error) {
      console.error('Error unassigning guest from table:', error);
      return { success: false, errors: ['Failed to unassign guest from table'] };
    }
  }

  async getGuestsByTable(tableId: string): Promise<Guest[]> {
    try {
      return await this.guestRepository.findByTableId(tableId);
    } catch (error) {
      console.error('Error fetching guests by table:', error);
      return [];
    }
  }

  async importFromCSV(csvContent: string, eventId: string): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const importedGuests: Guest[] = [];
    let totalProcessed = 0;
    let successfulImports = 0;

    return new Promise((resolve) => {
      const csvData: CSVGuestData[] = [];
      
      const stream = Readable.from(csvContent);
      
      stream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_')
        }))
        .on('data', (data) => {
          csvData.push(data);
        })
        .on('end', async () => {
          totalProcessed = csvData.length;

          for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2; // +2 because CSV rows start at 1 and we skip header

            try {
              const guestInput = this.parseCSVRowToGuestInput(row, eventId, rowNumber);
              
              if (guestInput.errors.length > 0) {
                errors.push(...guestInput.errors);
                continue;
              }

              const result = await this.createGuest(guestInput.data);
              
              if (result.success && result.guest) {
                importedGuests.push(result.guest);
                successfulImports++;
              } else {
                errors.push({
                  row: rowNumber,
                  message: result.errors?.join(', ') || 'Unknown error',
                  data: row
                });
              }
            } catch (error) {
              errors.push({
                row: rowNumber,
                message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: row
              });
            }
          }

          resolve({
            success: errors.length === 0,
            totalProcessed,
            successfulImports,
            failedImports: totalProcessed - successfulImports,
            errors,
            importedGuests
          });
        })
        .on('error', (error) => {
          resolve({
            success: false,
            totalProcessed: 0,
            successfulImports: 0,
            failedImports: 0,
            errors: [{ row: 0, message: `CSV parsing error: ${error.message}` }],
            importedGuests: []
          });
        });
    });
  }

  async previewCSVImport(csvContent: string, eventId: string): Promise<ImportPreview> {
    const validGuests: Guest[] = [];
    const invalidRows: ImportError[] = [];
    let totalRows = 0;

    return new Promise((resolve) => {
      const csvData: CSVGuestData[] = [];
      
      const stream = Readable.from(csvContent);
      
      stream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_')
        }))
        .on('data', (data) => {
          csvData.push(data);
        })
        .on('end', async () => {
          totalRows = csvData.length;

          for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2;

            try {
              const guestInput = this.parseCSVRowToGuestInput(row, eventId, rowNumber);
              
              if (guestInput.errors.length > 0) {
                invalidRows.push(...guestInput.errors);
              } else {
                // Create a preview guest object (without saving to database)
                const previewGuest: Guest = {
                  id: `preview-${i}`,
                  name: guestInput.data.name,
                  phoneNumber: guestInput.data.phoneNumber,
                  dietaryRestrictions: guestInput.data.dietaryRestrictions || [],
                  additionalGuestCount: guestInput.data.additionalGuestCount || 0,
                  relationshipType: guestInput.data.relationshipType,
                  brideOrGroomSide: guestInput.data.brideOrGroomSide,
                  specialRequests: guestInput.data.specialRequests || '',
                  rsvpStatus: 'pending',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                validGuests.push(previewGuest);
              }
            } catch (error) {
              invalidRows.push({
                row: rowNumber,
                message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: row
              });
            }
          }

          resolve({
            validGuests,
            invalidRows,
            totalRows
          });
        })
        .on('error', (error) => {
          resolve({
            validGuests: [],
            invalidRows: [{ row: 0, message: `CSV parsing error: ${error.message}` }],
            totalRows: 0
          });
        });
    });
  }

  async importFromContacts(contacts: ContactData[], eventId: string): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const importedGuests: Guest[] = [];
    let totalProcessed = contacts.length;
    let successfulImports = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        // Use the first phone number if available
        const phoneNumber = contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0] : '';
        
        if (!phoneNumber) {
          errors.push({
            row: i + 1,
            field: 'phoneNumber',
            message: 'Contact has no phone number',
            data: contact
          });
          continue;
        }

        const guestInput: GuestInput = {
          name: contact.name,
          phoneNumber: this.normalizePhoneNumber(phoneNumber),
          eventId,
          dietaryRestrictions: [],
          additionalGuestCount: 0,
          relationshipType: RelationshipType.FRIEND, // Default value
          brideOrGroomSide: 'bride', // Default value
          specialRequests: ''
        };

        const result = await this.createGuest(guestInput);
        
        if (result.success && result.guest) {
          importedGuests.push(result.guest);
          successfulImports++;
        } else {
          errors.push({
            row: i + 1,
            message: result.errors?.join(', ') || 'Unknown error',
            data: contact
          });
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: contact
        });
      }
    }

    return {
      success: errors.length === 0,
      totalProcessed,
      successfulImports,
      failedImports: totalProcessed - successfulImports,
      errors,
      importedGuests
    };
  }

  private parseCSVRowToGuestInput(row: any, eventId: string, rowNumber: number): { data: GuestInput; errors: ImportError[] } {
    const errors: ImportError[] = [];
    
    // Map CSV headers (which are transformed to lowercase with underscores) to our expected fields
    const name = row.name || '';
    const phoneNumber = row.phone_number || row.phonenumber || '';
    const dietaryRestrictions = row.dietary_restrictions || row.dietaryrestrictions || '';
    const additionalGuestCount = row.additional_guest_count || row.additionalguestcount || '';
    const relationshipType = row.relationship_type || row.relationshiptype || '';
    const brideOrGroomSide = row.bride_or_groom_side || row.brideorgroomside || '';
    const specialRequests = row.special_requests || row.specialrequests || '';
    
    // Validate required fields
    if (!name || name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name is required',
        data: row
      });
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'phoneNumber',
        message: 'Phone number is required',
        data: row
      });
    }

    // Parse and validate optional fields
    const parsedDietaryRestrictions = dietaryRestrictions 
      ? dietaryRestrictions.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0)
      : [];

    let parsedAdditionalGuestCount = 0;
    if (additionalGuestCount) {
      const parsed = parseInt(additionalGuestCount, 10);
      if (isNaN(parsed) || parsed < 0) {
        errors.push({
          row: rowNumber,
          field: 'additionalGuestCount',
          message: 'Additional guest count must be a non-negative number',
          data: row
        });
      } else {
        parsedAdditionalGuestCount = parsed;
      }
    }

    let parsedRelationshipType = RelationshipType.FRIEND; // Default
    if (relationshipType) {
      const validRelationships = Object.values(RelationshipType);
      const foundRelationship = validRelationships.find(
        r => r.toLowerCase() === relationshipType?.toLowerCase()
      );
      if (foundRelationship) {
        parsedRelationshipType = foundRelationship;
      } else {
        errors.push({
          row: rowNumber,
          field: 'relationshipType',
          message: `Invalid relationship type. Valid options: ${validRelationships.join(', ')}`,
          data: row
        });
      }
    }

    let parsedBrideOrGroomSide: 'bride' | 'groom' = 'bride'; // Default
    if (brideOrGroomSide) {
      const side = brideOrGroomSide.toLowerCase();
      if (side === 'bride' || side === 'groom') {
        parsedBrideOrGroomSide = side;
      } else {
        errors.push({
          row: rowNumber,
          field: 'brideOrGroomSide',
          message: 'Bride or groom side must be either "bride" or "groom"',
          data: row
        });
      }
    }

    const guestInput: GuestInput = {
      name: name?.trim() || '',
      phoneNumber: this.normalizePhoneNumber(phoneNumber?.trim() || ''),
      eventId,
      dietaryRestrictions: parsedDietaryRestrictions,
      additionalGuestCount: parsedAdditionalGuestCount,
      relationshipType: parsedRelationshipType,
      brideOrGroomSide: parsedBrideOrGroomSide,
      specialRequests: specialRequests?.trim() || ''
    };

    return { data: guestInput, errors };
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except + at the beginning
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it, otherwise remove any + characters
    if (normalized.startsWith('+')) {
      normalized = '+' + normalized.substring(1).replace(/\+/g, '');
    } else {
      normalized = normalized.replace(/\+/g, '');
    }
    
    return normalized;
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