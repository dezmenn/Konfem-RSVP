// Test setup file
process.env.NODE_ENV = 'test';
process.env.SKIP_DB_SETUP = 'true';

// Mock the database pool with proper return values
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

jest.mock('../config/database', () => ({
  setupDatabase: jest.fn(),
  getPool: jest.fn(() => ({
    query: mockQuery.mockResolvedValue({ rows: [] }),
    connect: mockConnect.mockResolvedValue(mockClient),
    end: jest.fn()
  })),
  closeDatabase: jest.fn()
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue({ rows: [] });
  mockClient.query.mockResolvedValue({ rows: [] });
});