import { GuestService } from '../../services/GuestService';
import { GuestRepository } from '../../repositories/GuestRepository';
import { Guest, RelationshipType } from '../../../../shared/src/types';
import { GuestInput, GuestUpdate } from '../../models/Guest';

// Mock the GuestRepository
jest.mock('../../repositories/GuestRepository');

describe('GuestService', () => {
  let guestService: GuestService;
  let mockGuestRepository: jest.Mocked<GuestRepository>;

  const mockGuest: Guest = {
    id: '1',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    dietaryRestrictions: ['vegetarian'],
    additionalGuestCount: 1,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    rsvpStatus: 'pending',
    specialRequests: 'Window seat preferred',
    tableAssignment: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockGuestInput: GuestInput = {
    eventId: 'event-1',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    dietaryRestrictions: ['vegetarian'],
    additionalGuestCount: 1,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    specialRequests: 'Window seat preferred'
  };

  beforeEach(() => {
    mockGuestRepository = new GuestRepository() as jest.Mocked<GuestRepository>;
    guestService = new GuestService(mockGuestRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuest', () => {
    it('should create a guest successfully with valid data', async () => {
      mockGuestRepository.create.mockResolvedValue(mockGuest);

      const result = await guestService.createGuest(mockGuestInput);

      expect(result.success).toBe(true);
      expect(result.guest).toEqual(mockGuest);
      expect(result.errors).toBeUndefined();
      expect(mockGuestRepository.create).toHaveBeenCalledWith(mockGuestInput);
    });

    it('should return validation errors for invalid data', async () => {
      const invalidInput: GuestInput = {
        ...mockGuestInput,
        name: '', // Invalid: empty name
        phoneNumber: 'invalid-phone' // Invalid: bad format
      };

      const result = await guestService.createGuest(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Phone number format is invalid');
      expect(result.guest).toBeUndefined();
      expect(mockGuestRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockGuestRepository.create.mockRejectedValue(new Error('Database error'));

      const result = await guestService.createGuest(mockGuestInput);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create guest');
      expect(result.guest).toBeUndefined();
    });
  });

  describe('getGuest', () => {
    it('should return a guest when found', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);

      const result = await guestService.getGuest('1');

      expect(result).toEqual(mockGuest);
      expect(mockGuestRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when guest not found', async () => {
      mockGuestRepository.findById.mockResolvedValue(null);

      const result = await guestService.getGuest('999');

      expect(result).toBeNull();
      expect(mockGuestRepository.findById).toHaveBeenCalledWith('999');
    });

    it('should handle repository errors', async () => {
      mockGuestRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await guestService.getGuest('1');

      expect(result).toBeNull();
    });
  });

  describe('getGuestsByEvent', () => {
    it('should return guests for an event', async () => {
      const mockGuests = [mockGuest];
      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);

      const result = await guestService.getGuestsByEvent('event-1');

      expect(result).toEqual(mockGuests);
      expect(mockGuestRepository.findByEventId).toHaveBeenCalledWith('event-1');
    });

    it('should return empty array on error', async () => {
      mockGuestRepository.findByEventId.mockRejectedValue(new Error('Database error'));

      const result = await guestService.getGuestsByEvent('event-1');

      expect(result).toEqual([]);
    });
  });

  describe('searchGuests', () => {
    it('should search guests with filters', async () => {
      const filters = { eventId: 'event-1', rsvpStatus: 'pending' };
      const mockGuests = [mockGuest];
      mockGuestRepository.findWithFilters.mockResolvedValue(mockGuests);

      const result = await guestService.searchGuests(filters);

      expect(result).toEqual(mockGuests);
      expect(mockGuestRepository.findWithFilters).toHaveBeenCalledWith(filters);
    });

    it('should return empty array on error', async () => {
      mockGuestRepository.findWithFilters.mockRejectedValue(new Error('Database error'));

      const result = await guestService.searchGuests({ eventId: 'event-1' });

      expect(result).toEqual([]);
    });
  });

  describe('updateGuest', () => {
    const mockUpdate: GuestUpdate = {
      name: 'Jane Doe',
      rsvpStatus: 'accepted'
    };

    it('should update a guest successfully', async () => {
      const updatedGuest = { ...mockGuest, ...mockUpdate };
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockGuestRepository.update.mockResolvedValue(updatedGuest);

      const result = await guestService.updateGuest('1', mockUpdate);

      expect(result.success).toBe(true);
      expect(result.guest).toEqual(updatedGuest);
      expect(result.errors).toBeUndefined();
    });

    it('should return error when guest not found', async () => {
      mockGuestRepository.findById.mockResolvedValue(null);

      const result = await guestService.updateGuest('999', mockUpdate);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Guest not found');
      expect(result.guest).toBeUndefined();
    });

    it('should return validation errors for invalid updates', async () => {
      const invalidUpdate: GuestUpdate = {
        name: '', // Invalid: empty name
        rsvpStatus: 'invalid' as any // Invalid: bad status
      };

      const result = await guestService.updateGuest('1', invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Name cannot be empty');
      expect(result.errors).toContain('Invalid RSVP status');
    });

    it('should handle repository errors', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockGuestRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await guestService.updateGuest('1', mockUpdate);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to update guest');
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest successfully', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockGuestRepository.delete.mockResolvedValue(true);

      const result = await guestService.deleteGuest('1');

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error when guest not found', async () => {
      mockGuestRepository.findById.mockResolvedValue(null);

      const result = await guestService.deleteGuest('999');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Guest not found');
    });

    it('should handle repository errors', async () => {
      mockGuestRepository.findById.mockResolvedValue(mockGuest);
      mockGuestRepository.delete.mockRejectedValue(new Error('Database error'));

      const result = await guestService.deleteGuest('1');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to delete guest');
    });
  });

  describe('getGuestAnalytics', () => {
    it('should return guest analytics', async () => {
      const mockGuests = [
        mockGuest,
        { ...mockGuest, id: '2', brideOrGroomSide: 'groom' as const, relationshipType: RelationshipType.COUSIN }
      ];
      const mockStatusCounts = { pending: 1, accepted: 1 };
      const mockDietarySummary = { vegetarian: 2 };

      mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
      mockGuestRepository.getGuestCountByStatus.mockResolvedValue(mockStatusCounts);
      mockGuestRepository.getDietaryRestrictionsSummary.mockResolvedValue(mockDietarySummary);

      const result = await guestService.getGuestAnalytics('event-1');

      expect(result.totalGuests).toBe(2);
      expect(result.rsvpStatusCounts).toEqual(mockStatusCounts);
      expect(result.dietaryRestrictionsSummary).toEqual(mockDietarySummary);
      expect(result.brideGroomSideCounts).toEqual({ bride: 1, groom: 1 });
      expect(result.relationshipTypeCounts).toEqual({ Friend: 1, Cousin: 1 });
    });

    it('should return empty analytics on error', async () => {
      mockGuestRepository.findByEventId.mockRejectedValue(new Error('Database error'));

      const result = await guestService.getGuestAnalytics('event-1');

      expect(result.totalGuests).toBe(0);
      expect(result.rsvpStatusCounts).toEqual({});
      expect(result.dietaryRestrictionsSummary).toEqual({});
      expect(result.brideGroomSideCounts).toEqual({ bride: 0, groom: 0 });
      expect(result.relationshipTypeCounts).toEqual({});
    });
  });

  describe('assignGuestToTable', () => {
    it('should assign guest to table successfully', async () => {
      const assignedGuest = { ...mockGuest, tableAssignment: 'table-1' };
      mockGuestRepository.assignToTable.mockResolvedValue(assignedGuest);

      const result = await guestService.assignGuestToTable('1', 'table-1');

      expect(result.success).toBe(true);
      expect(result.guest).toEqual(assignedGuest);
      expect(mockGuestRepository.assignToTable).toHaveBeenCalledWith('1', 'table-1');
    });

    it('should handle assignment errors', async () => {
      mockGuestRepository.assignToTable.mockResolvedValue(null);

      const result = await guestService.assignGuestToTable('1', 'table-1');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Guest not found or failed to assign');
    });
  });

  describe('unassignGuestFromTable', () => {
    it('should unassign guest from table successfully', async () => {
      const unassignedGuest = { ...mockGuest, tableAssignment: undefined };
      mockGuestRepository.unassignFromTable.mockResolvedValue(unassignedGuest);

      const result = await guestService.unassignGuestFromTable('1');

      expect(result.success).toBe(true);
      expect(result.guest).toEqual(unassignedGuest);
      expect(mockGuestRepository.unassignFromTable).toHaveBeenCalledWith('1');
    });

    it('should handle unassignment errors', async () => {
      mockGuestRepository.unassignFromTable.mockResolvedValue(null);

      const result = await guestService.unassignGuestFromTable('1');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Guest not found or failed to unassign');
    });
  });

  describe('getGuestsByTable', () => {
    it('should return guests assigned to a table', async () => {
      const mockGuests = [mockGuest];
      mockGuestRepository.findByTableId.mockResolvedValue(mockGuests);

      const result = await guestService.getGuestsByTable('table-1');

      expect(result).toEqual(mockGuests);
      expect(mockGuestRepository.findByTableId).toHaveBeenCalledWith('table-1');
    });

    it('should return empty array on error', async () => {
      mockGuestRepository.findByTableId.mockRejectedValue(new Error('Database error'));

      const result = await guestService.getGuestsByTable('table-1');

      expect(result).toEqual([]);
    });
  });
});