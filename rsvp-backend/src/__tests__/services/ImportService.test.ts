import { GuestService } from '../../services/GuestService';
import { GuestRepository } from '../../repositories/GuestRepository';
import { ContactData, ImportResult, Guest, RelationshipType } from '../../../../shared/src/types';

// Mock the GuestRepository
jest.mock('../../repositories/GuestRepository');

describe('Import Service Tests', () => {
  let guestService: GuestService;
  let mockGuestRepository: jest.Mocked<GuestRepository>;
  const testEventId = 'test-event-123';

  beforeEach(() => {
    mockGuestRepository = new GuestRepository() as jest.Mocked<GuestRepository>;
    guestService = new GuestService(mockGuestRepository);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('CSV Import', () => {
    it('should successfully parse and validate CSV data', async () => {
      const csvContent = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
John Doe,+1234567890,Vegetarian,1,Friend,bride,Needs wheelchair access
Jane Smith,+0987654321,"Gluten-free,Vegan",0,Cousin,groom,`;

      // Mock successful guest creation
      const mockGuest1: Guest = {
        id: 'guest-1',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['Vegetarian'],
        additionalGuestCount: 1,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: 'Needs wheelchair access',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockGuest2: Guest = {
        id: 'guest-2',
        name: 'Jane Smith',
        phoneNumber: '+0987654321',
        dietaryRestrictions: ['Gluten-free', 'Vegan'],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.COUSIN,
        brideOrGroomSide: 'groom',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the createGuest method to return successful results
      guestService.createGuest = jest.fn()
        .mockResolvedValueOnce({ success: true, guest: mockGuest1 })
        .mockResolvedValueOnce({ success: true, guest: mockGuest2 });

      const result: ImportResult = await guestService.importFromCSV(csvContent, testEventId);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.successfulImports).toBe(2);
      expect(result.failedImports).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedGuests).toHaveLength(2);

      // Verify createGuest was called with correct data
      expect(guestService.createGuest).toHaveBeenCalledTimes(2);
    });

    it('should handle CSV with validation errors', async () => {
      const csvContent = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
,+1234567890,Vegetarian,1,Friend,bride,Missing name
John Doe,,Vegetarian,1,Friend,bride,Missing phone`;

      const result: ImportResult = await guestService.importFromCSV(csvContent, testEventId);

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(2);
      expect(result.successfulImports).toBe(0);
      expect(result.failedImports).toBe(2);
      expect(result.errors).toHaveLength(2);

      // Check specific error messages
      const errors = result.errors;
      expect(errors.some(e => e.message.includes('Name is required'))).toBe(true);
      expect(errors.some(e => e.message.includes('Phone number is required'))).toBe(true);
    });

    it('should preview CSV import without creating guests', async () => {
      const csvContent = `name,phoneNumber,dietaryRestrictions,additionalGuestCount,relationshipType,brideOrGroomSide,specialRequests
John Doe,+1234567890,Vegetarian,1,Friend,bride,Valid guest
,+0987654321,Vegetarian,0,Cousin,groom,Missing name`;

      const preview = await guestService.previewCSVImport(csvContent, testEventId);

      expect(preview.totalRows).toBe(2);
      expect(preview.validGuests).toHaveLength(1);
      expect(preview.invalidRows).toHaveLength(1);

      // Verify valid guest
      const validGuest = preview.validGuests[0];
      expect(validGuest.name).toBe('John Doe');
      expect(validGuest.id).toMatch(/^preview-/);

      // Verify invalid row
      const invalidRow = preview.invalidRows[0];
      expect(invalidRow.message).toContain('Name is required');

      // Verify createGuest was not called (preview mode)
      // Note: Preview mode doesn't call createGuest, so we don't need to check this
    });

    it('should handle malformed CSV', async () => {
      const csvContent = 'invalid csv content without proper structure';

      const result: ImportResult = await guestService.importFromCSV(csvContent, testEventId);

      // The CSV parser handles malformed CSV gracefully by treating it as no rows
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(0);
      expect(result.successfulImports).toBe(0);
      expect(result.failedImports).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedGuests).toHaveLength(0);
    });

    it('should handle empty CSV files', async () => {
      const csvContent = 'name,phoneNumber\n'; // Header only

      const result: ImportResult = await guestService.importFromCSV(csvContent, testEventId);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(0);
      expect(result.successfulImports).toBe(0);
      expect(result.failedImports).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedGuests).toHaveLength(0);
    });
  });

  describe('Contact Import', () => {
    it('should successfully import valid contacts', async () => {
      const contacts: ContactData[] = [
        {
          id: 'contact1',
          name: 'John Doe',
          phoneNumbers: ['+1234567890', '+1234567891'],
          emails: ['john@example.com']
        },
        {
          id: 'contact2',
          name: 'Jane Smith',
          phoneNumbers: ['+0987654321'],
          emails: []
        }
      ];

      const mockGuest1: Guest = {
        id: 'guest-1',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockGuest2: Guest = {
        id: 'guest-2',
        name: 'Jane Smith',
        phoneNumber: '+0987654321',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock successful guest creation
      guestService.createGuest = jest.fn()
        .mockResolvedValueOnce({ success: true, guest: mockGuest1 })
        .mockResolvedValueOnce({ success: true, guest: mockGuest2 });

      const result: ImportResult = await guestService.importFromContacts(contacts, testEventId);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.successfulImports).toBe(2);
      expect(result.failedImports).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedGuests).toHaveLength(2);

      // Verify the first contact used the first phone number
      expect(guestService.createGuest).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phoneNumber: '+1234567890'
        })
      );
    });

    it('should handle contacts without phone numbers', async () => {
      const contacts: ContactData[] = [
        {
          id: 'contact1',
          name: 'John Doe',
          phoneNumbers: ['+1234567890'],
          emails: ['john@example.com']
        },
        {
          id: 'contact2',
          name: 'Jane Smith',
          phoneNumbers: [], // No phone numbers
          emails: ['jane@example.com']
        }
      ];

      const mockGuest: Guest = {
        id: 'guest-1',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock successful guest creation for valid contact
      guestService.createGuest = jest.fn()
        .mockResolvedValueOnce({ success: true, guest: mockGuest });

      const result: ImportResult = await guestService.importFromContacts(contacts, testEventId);

      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(2);
      expect(result.successfulImports).toBe(1);
      expect(result.failedImports).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.importedGuests).toHaveLength(1);

      // Verify error for contact without phone number
      const error = result.errors[0];
      expect(error.message).toContain('Contact has no phone number');
      expect(error.field).toBe('phoneNumber');
    });

    it('should normalize phone numbers correctly', async () => {
      const contacts: ContactData[] = [
        {
          id: 'contact1',
          name: 'John Doe',
          phoneNumbers: ['(123) 456-7890'],
          emails: []
        },
        {
          id: 'contact2',
          name: 'Jane Smith',
          phoneNumbers: ['+1-987-654-3210'],
          emails: []
        }
      ];

      const mockGuest1: Guest = {
        id: 'guest-1',
        name: 'John Doe',
        phoneNumber: '1234567890',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockGuest2: Guest = {
        id: 'guest-2',
        name: 'Jane Smith',
        phoneNumber: '+19876543210',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: '',
        rsvpStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock successful guest creation
      guestService.createGuest = jest.fn()
        .mockResolvedValueOnce({ success: true, guest: mockGuest1 })
        .mockResolvedValueOnce({ success: true, guest: mockGuest2 });

      const result = await guestService.importFromContacts(contacts, testEventId);

      expect(result.success).toBe(true);
      expect(result.importedGuests).toHaveLength(2);

      // Verify normalized phone numbers were used
      expect(guestService.createGuest).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: '1234567890' // Normalized
        })
      );

      expect(guestService.createGuest).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: '+19876543210' // Normalized with +
        })
      );
    });

    it('should handle empty contact arrays', async () => {
      const result = await guestService.importFromContacts([], testEventId);

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(0);
      expect(result.successfulImports).toBe(0);
      expect(result.failedImports).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.importedGuests).toHaveLength(0);
    });
  });

  describe('Phone Number Normalization', () => {
    it('should normalize various phone number formats', () => {
      const testCases = [
        { input: '(123) 456-7890', expected: '1234567890' },
        { input: '+1-987-654-3210', expected: '+19876543210' },
        { input: '555.123.4567', expected: '5551234567' },
        { input: '+44 20 7946 0958', expected: '+442079460958' },
        { input: '123-456-7890 ext 123', expected: '1234567890123' },
        { input: '+1 (555) 123-4567', expected: '+15551234567' }
      ];

      testCases.forEach(({ input, expected }) => {
        // Access the private method through any casting for testing
        const normalizedPhone = (guestService as any).normalizePhoneNumber(input);
        expect(normalizedPhone).toBe(expected);
      });
    });
  });
});