import { EventRepository } from '../../repositories/EventRepository';
import { EventInput } from '../../models/Event';

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

describe('EventRepository', () => {
  let repository: EventRepository;

  beforeEach(() => {
    repository = new EventRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const eventInput: EventInput = {
        title: 'Wedding Celebration',
        description: 'Join us for our special day',
        date: new Date('2025-08-15T18:00:00Z'),
        location: 'Grand Ballroom',
        rsvpDeadline: new Date('2025-07-15T23:59:59Z'),
        organizerId: 'organizer-123',
        publicRSVPEnabled: true
      };

      const mockDbRow = {
        id: 'event-123',
        title: 'Wedding Celebration',
        description: 'Join us for our special day',
        date: new Date('2025-08-15T18:00:00Z'),
        location: 'Grand Ballroom',
        rsvp_deadline: new Date('2025-07-15T23:59:59Z'),
        organizer_id: 'organizer-123',
        public_rsvp_enabled: true,
        public_rsvp_link: 'http://localhost:3000/rsvp/public/temp',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock the initial create query
      mockQuery.mockResolvedValueOnce({ rows: [mockDbRow] });
      // Mock the update query for public RSVP link
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ ...mockDbRow, public_rsvp_link: 'http://localhost:3000/rsvp/public/event-123' }] 
      });

      const result = await repository.create(eventInput);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        [
          'Wedding Celebration',
          'Join us for our special day',
          eventInput.date,
          'Grand Ballroom',
          eventInput.rsvpDeadline,
          'organizer-123',
          true,
          'http://localhost:3000/rsvp/public/temp'
        ]
      );

      expect(result.id).toBe('event-123');
      expect(result.title).toBe('Wedding Celebration');
    });
  });

  describe('findById', () => {
    it('should find event by ID', async () => {
      const mockDbRow = {
        id: 'event-123',
        title: 'Wedding Celebration',
        description: 'Join us for our special day',
        date: new Date('2025-08-15T18:00:00Z'),
        location: 'Grand Ballroom',
        rsvp_deadline: new Date('2025-07-15T23:59:59Z'),
        organizer_id: 'organizer-123',
        public_rsvp_enabled: true,
        public_rsvp_link: 'http://localhost:3000/rsvp/public/event-123',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.findById('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM events WHERE id = $1',
        ['event-123']
      );

      expect(result?.id).toBe('event-123');
      expect(result?.title).toBe('Wedding Celebration');
    });

    it('should return null when event not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganizerId', () => {
    it('should find events by organizer ID', async () => {
      const mockDbRows = [
        {
          id: 'event-123',
          title: 'Wedding Celebration',
          organizer_id: 'organizer-123',
          date: new Date('2025-08-15T18:00:00Z'),
          description: '',
          location: 'Venue',
          rsvp_deadline: new Date(),
          public_rsvp_enabled: false,
          public_rsvp_link: '',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockDbRows });

      const result = await repository.findByOrganizerId('organizer-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM events WHERE organizer_id = $1 ORDER BY date DESC',
        ['organizer-123']
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-123');
    });
  });

  describe('isRSVPDeadlinePassed', () => {
    it('should return true when deadline has passed', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockQuery.mockResolvedValue({ rows: [{ rsvp_deadline: pastDate }] });

      const result = await repository.isRSVPDeadlinePassed('event-123');

      expect(result).toBe(true);
    });

    it('should return false when deadline has not passed', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockQuery.mockResolvedValue({ rows: [{ rsvp_deadline: futureDate }] });

      const result = await repository.isRSVPDeadlinePassed('event-123');

      expect(result).toBe(false);
    });

    it('should throw error when event not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(repository.isRSVPDeadlinePassed('non-existent')).rejects.toThrow('Event not found');
    });
  });
});