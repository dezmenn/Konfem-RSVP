import { TableRepository } from '../../repositories/TableRepository';
import { TableInput } from '../../models/Table';

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

describe('TableRepository', () => {
  let repository: TableRepository;

  beforeEach(() => {
    repository = new TableRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a table successfully', async () => {
      const tableInput: TableInput = {
        eventId: 'event-123',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 200 }
      };

      const mockDbRow = {
        id: 'table-123',
        event_id: 'event-123',
        name: 'Table 1',
        capacity: 8,
        position_x: 100,
        position_y: 200,
        is_locked: false
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.create(tableInput);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tables'),
        ['event-123', 'Table 1', 8, 100, 200]
      );

      expect(result.id).toBe('table-123');
      expect(result.name).toBe('Table 1');
      expect(result.capacity).toBe(8);
      expect(result.position).toEqual({ x: 100, y: 200 });
      expect(result.isLocked).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find table by ID', async () => {
      const mockDbRow = {
        id: 'table-123',
        event_id: 'event-123',
        name: 'Table 1',
        capacity: 8,
        position_x: 100.5,
        position_y: 200.75,
        is_locked: false
      };

      mockQuery.mockResolvedValue({ rows: [mockDbRow] });

      const result = await repository.findById('table-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM tables WHERE id = $1',
        ['table-123']
      );

      expect(result?.id).toBe('table-123');
      expect(result?.position).toEqual({ x: 100.5, y: 200.75 });
    });

    it('should return null when table not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should find tables by event ID', async () => {
      const mockDbRows = [
        {
          id: 'table-123',
          event_id: 'event-123',
          name: 'Table 1',
          capacity: 8,
          position_x: 100,
          position_y: 200,
          is_locked: false
        },
        {
          id: 'table-124',
          event_id: 'event-123',
          name: 'Table 2',
          capacity: 6,
          position_x: 300,
          position_y: 200,
          is_locked: true
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockDbRows });

      const result = await repository.findByEventId('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM tables WHERE event_id = $1 ORDER BY name',
        ['event-123']
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Table 1');
      expect(result[1].isLocked).toBe(true);
    });
  });

  describe('checkTableCapacity', () => {
    it('should return table capacity information', async () => {
      const mockResult = {
        capacity: 8,
        occupied: '3'
      };

      mockQuery.mockResolvedValue({ rows: [mockResult] });

      const result = await repository.checkTableCapacity('table-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['table-123']
      );

      expect(result).toEqual({
        capacity: 8,
        occupied: 3,
        available: 5
      });
    });

    it('should throw error when table not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(repository.checkTableCapacity('non-existent')).rejects.toThrow('Table not found');
    });
  });

  describe('getTableCapacityInfo', () => {
    it('should return capacity info for all tables', async () => {
      const mockResults = [
        {
          table_id: 'table-123',
          name: 'Table 1',
          capacity: 8,
          occupied: '3'
        },
        {
          table_id: 'table-124',
          name: 'Table 2',
          capacity: 6,
          occupied: '6'
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockResults });

      const result = await repository.getTableCapacityInfo('event-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN guests g ON t.id = g.table_assignment'),
        ['event-123']
      );

      expect(result).toEqual([
        {
          tableId: 'table-123',
          name: 'Table 1',
          capacity: 8,
          occupied: 3,
          available: 5
        },
        {
          tableId: 'table-124',
          name: 'Table 2',
          capacity: 6,
          occupied: 6,
          available: 0
        }
      ]);
    });
  });
});