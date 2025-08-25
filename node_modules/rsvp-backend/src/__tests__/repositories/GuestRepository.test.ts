import { GuestRepository } from '../../repositories/GuestRepository';
import { GuestInput } from '../../models/Guest';
import { RelationshipType } from '../../../../shared/src/types';

// Mock the database pool
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: jest.fn(),
  end: jest.fn()
};

jest.mock('../../config/database', () => ({
  getPool: () => mockPool
}));

describe('GuestRepository', () => {
  let repository: GuestRepository;

  beforeEach(() => {
    repository = new GuestRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a guest successfully', async () => {
      const guestInput: GuestInput = {
        eventId: 'event-123',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['Vegetarian'],
        additionalGuestCount: 1,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        specialRequests: 'Window seat'
      };

      const mockDbRow = {
        id: 'guest-123',
        event_id: 'event-123',
        name: 'John Doe',
        phone_number: '+1234567890',
        dietary_restrictions: ['Vegetarian'],
        additional_guest_count: 1,
        relationship_type: 'Friend',
        bride_or_groom_side: 'bride',
        rsvp_status: 'pending',
        special_requests: 'Window seat',
        table_assignment: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.create(guestInput);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO guests'),
        [
          'event-123',
          'John Doe',
          '+1234567890',
          ['Vegetarian'],
          1,
          'Friend',
          'bride',
          'Window seat'
        ]
      );

      expect(result.id).toBe('guest-123');
      expect(result.name).toBe('John Doe');
      expect(result.phoneNumber).toBe('+1234567890');
    });
  });

  describe('findById', () => {
    it('should find guest by ID', async () => {
      const mockDbRow = {
        id: 'guest-123',
        event_id: 'event-123',
        name: 'John Doe',
        phone_number: '+1234567890',
        dietary_restrictions: ['Vegetarian'],
        additional_guest_count: 1,
        relationship_type: 'Friend',
        bride_or_groom_side: 'bride',
        rsvp_status: 'pending',
        special_requests: 'Window seat',
        table_assignment: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.findById('guest-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests WHERE id = $1',
        ['guest-123']
      );

      expect(result?.id).toBe('guest-123');
      expect(result?.name).toBe('John Doe');
    });

    it('should return null when guest not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should find guests by event ID', async () => {
      const mockDbRows = [
        {
          id: 'guest-123',
          event_id: 'event-123',
          name: 'John Doe',
          phone_number: '+1234567890',
          dietary_restrictions: [],
          additional_guest_count: 0,
          relationship_type: 'Friend',
          bride_or_groom_side: 'bride',
          rsvp_status: 'pending',
          special_requests: '',
          table_assignment: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockDbRows });

      const result = await repository.findByEventId('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests WHERE event_id = $1 ORDER BY name',
        ['event-123']
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('guest-123');
    });
  });

  describe('getGuestCountByStatus', () => {
    it('should return guest count by status', async () => {
      const mockResults = [
        { rsvp_status: 'pending', count: '5' },
        { rsvp_status: 'accepted', count: '10' },
        { rsvp_status: 'declined', count: '2' }
      ];

      mockQuery.mockResolvedValue({ rows: mockResults });

      const result = await repository.getGuestCountByStatus('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT rsvp_status, COUNT(*) as count'),
        ['event-123']
      );

      expect(result).toEqual({
        pending: 5,
        accepted: 10,
        declined: 2
      });
    });
  });
});