import { BaseRepository } from '../../repositories/BaseRepository';

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

class TestRepository extends BaseRepository {
  async testQuery(query: string, params?: any[]) {
    return this.query(query, params);
  }

  async testQueryOne(query: string, params?: any[]) {
    return this.queryOne(query, params);
  }

  testBuildUpdateQuery(tableName: string, updates: Record<string, any>, whereClause: string) {
    return this.buildUpdateQuery(tableName, updates, whereClause);
  }

  testCamelToSnake(str: string) {
    return this.camelToSnake(str);
  }

  testSnakeToCamel(str: string) {
    return this.snakeToCamel(str);
  }

  testMapRowToCamelCase<T>(row: any): T {
    return this.mapRowToCamelCase<T>(row);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should execute query and return rows', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await repository.testQuery('SELECT * FROM test');

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockRows);
    });
  });

  describe('queryOne', () => {
    it('should return first row when results exist', async () => {
      const mockRows = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await repository.testQueryOne('SELECT * FROM test WHERE id = $1', [1]);

      expect(result).toEqual(mockRows[0]);
    });

    it('should return null when no results', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.testQueryOne('SELECT * FROM test WHERE id = $1', [999]);

      expect(result).toBeNull();
    });
  });

  describe('buildUpdateQuery', () => {
    it('should build update query with parameters', () => {
      const updates = { name: 'John', age: 30 };
      const result = repository.testBuildUpdateQuery('users', updates, 'WHERE id = $3');

      expect(result.query).toBe('UPDATE users SET name = $1, age = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3');
      expect(result.values).toEqual(['John', 30]);
    });

    it('should filter undefined values', () => {
      const updates = { name: 'John', age: undefined, email: 'john@example.com' };
      const result = repository.testBuildUpdateQuery('users', updates, 'WHERE id = $3');

      expect(result.query).toBe('UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3');
      expect(result.values).toEqual(['John', 'john@example.com']);
    });

    it('should throw error when no fields to update', () => {
      const updates = { name: undefined, age: undefined };
      
      expect(() => {
        repository.testBuildUpdateQuery('users', updates, 'WHERE id = $1');
      }).toThrow('No fields to update');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(repository.testCamelToSnake('firstName')).toBe('first_name');
      expect(repository.testCamelToSnake('phoneNumber')).toBe('phone_number');
      expect(repository.testCamelToSnake('rsvpStatus')).toBe('rsvp_status');
      expect(repository.testCamelToSnake('name')).toBe('name');
    });
  });

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(repository.testSnakeToCamel('first_name')).toBe('firstName');
      expect(repository.testSnakeToCamel('phone_number')).toBe('phoneNumber');
      expect(repository.testSnakeToCamel('rsvp_status')).toBe('rsvpStatus');
      expect(repository.testSnakeToCamel('name')).toBe('name');
    });
  });

  describe('mapRowToCamelCase', () => {
    it('should convert database row to camelCase object', () => {
      const dbRow = {
        id: '123',
        first_name: 'John',
        phone_number: '+1234567890',
        rsvp_status: 'pending',
        created_at: new Date()
      };

      const result = repository.testMapRowToCamelCase(dbRow);

      expect(result).toEqual({
        id: '123',
        firstName: 'John',
        phoneNumber: '+1234567890',
        rsvpStatus: 'pending',
        createdAt: dbRow.created_at
      });
    });

    it('should handle null input', () => {
      const result = repository.testMapRowToCamelCase(null);
      expect(result).toBeNull();
    });
  });
});