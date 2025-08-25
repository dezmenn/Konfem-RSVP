import { MessageRepository } from '../../repositories/MessageRepository';
import { MessageInput } from '../../models/Message';

// Mock the database pool
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockPool = {
  query: mockQuery,
  connect: mockConnect,
  end: jest.fn()
};

jest.mock('../../config/database', () => ({
  getPool: () => mockPool
}));

describe('MessageRepository', () => {
  let repository: MessageRepository;

  beforeEach(() => {
    repository = new MessageRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a message successfully', async () => {
      const messageInput: MessageInput = {
        eventId: 'event-123',
        recipientId: 'guest-123',
        content: 'You are invited to our wedding!',
        messageType: 'invitation',
        scheduledAt: new Date('2025-07-01T10:00:00Z')
      };

      const mockDbRow = {
        id: 'message-123',
        event_id: 'event-123',
        recipient_id: 'guest-123',
        content: 'You are invited to our wedding!',
        message_type: 'invitation',
        delivery_status: 'pending',
        scheduled_at: new Date('2025-07-01T10:00:00Z'),
        sent_at: null,
        created_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.create(messageInput);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        [
          'event-123',
          'guest-123',
          'You are invited to our wedding!',
          'invitation',
          messageInput.scheduledAt
        ]
      );

      expect(result.id).toBe('message-123');
      expect(result.content).toBe('You are invited to our wedding!');
      expect(result.messageType).toBe('invitation');
    });
  });

  describe('findById', () => {
    it('should find message by ID', async () => {
      const mockDbRow = {
        id: 'message-123',
        event_id: 'event-123',
        recipient_id: 'guest-123',
        content: 'You are invited to our wedding!',
        message_type: 'invitation',
        delivery_status: 'sent',
        scheduled_at: null,
        sent_at: new Date(),
        created_at: new Date()
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.findById('message-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM messages WHERE id = $1',
        ['message-123']
      );

      expect(result?.id).toBe('message-123');
      expect(result?.deliveryStatus).toBe('sent');
    });

    it('should return null when message not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findPendingMessages', () => {
    it('should find pending messages ready to send', async () => {
      const mockDbRows = [
        {
          id: 'message-123',
          event_id: 'event-123',
          recipient_id: 'guest-123',
          content: 'Pending message',
          message_type: 'invitation',
          delivery_status: 'pending',
          scheduled_at: null,
          sent_at: null,
          created_at: new Date()
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockDbRows });

      const result = await repository.findPendingMessages();

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].deliveryStatus).toBe('pending');
    });
  });

  describe('getMessageStats', () => {
    it('should return message statistics', async () => {
      const mockResults = [
        { message_type: 'invitation', delivery_status: 'sent', count: '10' },
        { message_type: 'invitation', delivery_status: 'delivered', count: '8' },
        { message_type: 'reminder', delivery_status: 'pending', count: '5' }
      ];

      mockQuery.mockResolvedValue({ rows: mockResults });

      const result = await repository.getMessageStats('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['event-123']
      );

      expect(result).toEqual({
        'invitation_sent': 10,
        'invitation_delivered': 8,
        'reminder_pending': 5
      });
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple messages in transaction', async () => {
      const messages: MessageInput[] = [
        {
          eventId: 'event-123',
          recipientId: 'guest-123',
          content: 'Message 1',
          messageType: 'invitation'
        },
        {
          eventId: 'event-123',
          recipientId: 'guest-124',
          content: 'Message 2',
          messageType: 'invitation'
        }
      ];

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'message-123',
              event_id: 'event-123',
              recipient_id: 'guest-123',
              content: 'Message 1',
              message_type: 'invitation',
              delivery_status: 'pending',
              scheduled_at: null,
              sent_at: null,
              created_at: new Date()
            }
          ]
        }),
        release: jest.fn()
      };

      mockConnect.mockResolvedValue(mockClient);

      const result = await repository.bulkCreate(messages);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      const result = await repository.bulkCreate([]);

      expect(result).toEqual([]);
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });
});