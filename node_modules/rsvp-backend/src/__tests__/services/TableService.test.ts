import { TableService, TableValidationResult, TableCapacityInfo } from '../../services/TableService';
import { MockTableService } from '../../services/MockTableService';
import { Table, Position } from '../../../../shared/src/types';
import { TableInput, TableUpdate } from '../../models/Table';

// Mock the repositories
const mockTableRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEventId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  lockTable: jest.fn(),
  unlockTable: jest.fn(),
  findLockedTables: jest.fn(),
  findUnlockedTables: jest.fn(),
  getTableWithGuests: jest.fn(),
  getTablesWithGuests: jest.fn(),
  getTableCapacityInfo: jest.fn(),
  checkTableCapacity: jest.fn()
};

const mockGuestRepository = {
  findById: jest.fn(),
  update: jest.fn()
};

describe('TableService', () => {
  let tableService: TableService;
  let mockTableService: MockTableService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockVenueElementRepository = {
      findByEventId: jest.fn().mockResolvedValue([])
    };
    tableService = new TableService(mockTableRepository as any, mockGuestRepository as any, mockVenueElementRepository as any);
    mockTableService = new MockTableService();
  });

  describe('createTable', () => {
    const validTableInput: TableInput = {
      eventId: 'event-1',
      name: 'Table 1',
      capacity: 8,
      position: { x: 100, y: 100 }
    };

    it('should create a table with valid input', async () => {
      const expectedTable: Table = {
        id: 'table-1',
        ...validTableInput,
        isLocked: false,
        assignedGuests: []
      };

      mockTableRepository.create.mockResolvedValue(expectedTable);
      mockTableRepository.findByEventId.mockResolvedValue([]);

      const result = await tableService.createTable(validTableInput);

      expect(mockTableRepository.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 100 }
      });
      expect(result).toEqual(expectedTable);
    });

    it('should throw error for invalid input', async () => {
      const invalidInput: TableInput = {
        eventId: '',
        name: '',
        capacity: 0,
        position: { x: -1, y: -1 }
      };

      await expect(tableService.createTable(invalidInput)).rejects.toThrow('Validation failed');
    });

    it('should warn about position conflicts', async () => {
      const existingTable: Table = {
        id: 'existing-table',
        eventId: 'event-1',
        name: 'Existing Table',
        capacity: 6,
        position: { x: 105, y: 105 },
        isLocked: false,
        assignedGuests: []
      };

      mockTableRepository.findByEventId.mockResolvedValue([existingTable]);
      mockTableRepository.create.mockResolvedValue({
        id: 'table-1',
        ...validTableInput,
        isLocked: false,
        assignedGuests: []
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await tableService.createTable(validTableInput);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Table position conflicts detected')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateTable', () => {
    const existingTable: Table = {
      id: 'table-1',
      eventId: 'event-1',
      name: 'Table 1',
      capacity: 8,
      position: { x: 100, y: 100 },
      isLocked: false,
      assignedGuests: []
    };

    it('should update table with valid input', async () => {
      const updates: TableUpdate = {
        name: 'Updated Table',
        capacity: 10
      };

      const updatedTable = { ...existingTable, ...updates };

      mockTableRepository.findById.mockResolvedValue(existingTable);
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 5,
        available: 3
      });
      mockTableRepository.update.mockResolvedValue(updatedTable);

      const result = await tableService.updateTable('table-1', updates);

      expect(mockTableRepository.update).toHaveBeenCalledWith('table-1', updates);
      expect(result).toEqual(updatedTable);
    });

    it('should throw error when reducing capacity below occupied seats', async () => {
      const updates: TableUpdate = {
        capacity: 4
      };

      mockTableRepository.findById.mockResolvedValue(existingTable);
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 6,
        available: 2
      });

      await expect(tableService.updateTable('table-1', updates)).rejects.toThrow(
        'Cannot reduce capacity to 4. Table currently has 6 assigned guests.'
      );
    });

    it('should throw error for non-existent table', async () => {
      mockTableRepository.findById.mockResolvedValue(null);

      await expect(tableService.updateTable('non-existent', {})).rejects.toThrow('Table not found');
    });
  });

  describe('deleteTable', () => {
    it('should delete table with no assigned guests', async () => {
      const table: Table = {
        id: 'table-1',
        eventId: 'event-1',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 100 },
        isLocked: false,
        assignedGuests: []
      };

      mockTableRepository.findById.mockResolvedValue(table);
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 0,
        available: 8
      });
      mockTableRepository.delete.mockResolvedValue(true);

      const result = await tableService.deleteTable('table-1');

      expect(mockTableRepository.delete).toHaveBeenCalledWith('table-1');
      expect(result).toBe(true);
    });

    it('should throw error when deleting table with assigned guests', async () => {
      const table: Table = {
        id: 'table-1',
        eventId: 'event-1',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 100 },
        isLocked: false,
        assignedGuests: ['guest-1', 'guest-2']
      };

      mockTableRepository.findById.mockResolvedValue(table);
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 2,
        available: 6
      });

      await expect(tableService.deleteTable('table-1')).rejects.toThrow(
        'Cannot delete table. It has 2 assigned guests. Please reassign guests first.'
      );
    });
  });

  describe('assignGuestToTable', () => {
    it('should assign guest to table with available capacity', async () => {
      const guest = { id: 'guest-1', name: 'John Doe' };
      
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 5,
        available: 3
      });
      mockGuestRepository.findById.mockResolvedValue(guest);
      mockGuestRepository.update.mockResolvedValue({ ...guest, tableAssignment: 'table-1' });

      await tableService.assignGuestToTable('guest-1', 'table-1');

      expect(mockGuestRepository.update).toHaveBeenCalledWith('guest-1', { tableAssignment: 'table-1' });
    });

    it('should throw error when table is at full capacity', async () => {
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 8,
        available: 0
      });

      await expect(tableService.assignGuestToTable('guest-1', 'table-1')).rejects.toThrow(
        'Table is at full capacity (8/8)'
      );
    });

    it('should throw error for non-existent guest', async () => {
      mockTableRepository.checkTableCapacity.mockResolvedValue({
        capacity: 8,
        occupied: 5,
        available: 3
      });
      mockGuestRepository.findById.mockResolvedValue(null);

      await expect(tableService.assignGuestToTable('non-existent', 'table-1')).rejects.toThrow(
        'Guest not found'
      );
    });
  });

  describe('validateTableArrangement', () => {
    it('should return valid result for proper arrangement', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          eventId: 'event-1',
          name: 'Table 1',
          capacity: 8,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: ['guest-1', 'guest-2']
        },
        {
          id: 'table-2',
          eventId: 'event-1',
          name: 'Table 2',
          capacity: 6,
          position: { x: 200, y: 200 },
          isLocked: false,
          assignedGuests: ['guest-3']
        }
      ];

      mockTableRepository.getTablesWithGuests.mockResolvedValue(tables);

      const result = await tableService.validateTableArrangement('event-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect over-capacity tables', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          eventId: 'event-1',
          name: 'Table 1',
          capacity: 4,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: ['guest-1', 'guest-2', 'guest-3', 'guest-4', 'guest-5']
        }
      ];

      mockTableRepository.getTablesWithGuests.mockResolvedValue(tables);

      const result = await tableService.validateTableArrangement('event-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table "Table 1" is over capacity: 5/4 guests');
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].severity).toBe('error');
    });

    it('should detect overlapping table positions', async () => {
      const tables: Table[] = [
        {
          id: 'table-1',
          eventId: 'event-1',
          name: 'Table 1',
          capacity: 8,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: []
        },
        {
          id: 'table-2',
          eventId: 'event-1',
          name: 'Table 2',
          capacity: 8,
          position: { x: 110, y: 110 }, // Close position
          isLocked: false,
          assignedGuests: []
        }
      ];

      mockTableRepository.getTablesWithGuests.mockResolvedValue(tables);

      const result = await tableService.validateTableArrangement('event-1');

      expect(result.warnings).toContain('Tables "Table 1" and "Table 2" have overlapping positions');
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].severity).toBe('warning');
    });
  });

  describe('duplicateTable', () => {
    it('should duplicate table with offset', async () => {
      const originalTable: Table = {
        id: 'table-1',
        eventId: 'event-1',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 100 },
        isLocked: false,
        assignedGuests: []
      };

      const duplicatedTable: Table = {
        id: 'table-2',
        eventId: 'event-1',
        name: 'Table 1 (Copy)',
        capacity: 8,
        position: { x: 150, y: 150 },
        isLocked: false,
        assignedGuests: []
      };

      mockTableRepository.findById.mockResolvedValue(originalTable);
      mockTableRepository.findByEventId.mockResolvedValue([originalTable]);
      mockTableRepository.create.mockResolvedValue(duplicatedTable);

      const result = await tableService.duplicateTable('table-1', { x: 50, y: 50 });

      expect(mockTableRepository.create).toHaveBeenCalledWith({
        eventId: 'event-1',
        name: 'Table 1 (Copy)',
        capacity: 8,
        position: { x: 150, y: 150 }
      });
      expect(result).toEqual(duplicatedTable);
    });
  });
});

describe('MockTableService', () => {
  let mockTableService: MockTableService;

  beforeEach(async () => {
    mockTableService = new MockTableService();
    // Initialize demo data service
    const { DemoDataService } = require('../../services/DemoDataService');
    const demoService = DemoDataService.getInstance();
    
    // Initialize with minimal demo data structure
    const demoData = {
      event: { id: 'demo-event-1', title: 'Test Event' },
      guests: [],
      tables: [],
      venueElements: [],
      invitationTemplates: [],
      messages: [],
      rsvpTokens: [],
      publicRSVPRegistrations: [],
      analytics: {}
    };
    
    // Set the demo data directly
    (demoService as any).demoData = demoData;
  });

  describe('createTable', () => {
    it('should create a table in demo mode', async () => {
      const tableInput: TableInput = {
        eventId: 'demo-event-1',
        name: 'Test Table',
        capacity: 6,
        position: { x: 200, y: 200 }
      };

      const result = await mockTableService.createTable(tableInput);

      expect(result.name).toBe('Test Table');
      expect(result.capacity).toBe(6);
      expect(result.position).toEqual({ x: 200, y: 200 });
      expect(result.isLocked).toBe(false);
      expect(result.assignedGuests).toEqual([]);
    });
  });

  describe('getEventTables', () => {
    it('should return tables for event', async () => {
      // Create a test table first
      await mockTableService.createTable({
        eventId: 'demo-event-1',
        name: 'Test Table',
        capacity: 8,
        position: { x: 100, y: 100 }
      });

      const tables = await mockTableService.getEventTables('demo-event-1');

      expect(tables).toHaveLength(1);
      expect(tables[0].name).toBe('Test Table');
    });
  });

  describe('lockTable and unlockTable', () => {
    it('should lock and unlock tables', async () => {
      const table = await mockTableService.createTable({
        eventId: 'demo-event-1',
        name: 'Test Table',
        capacity: 8,
        position: { x: 100, y: 100 }
      });

      // Lock the table
      const lockedTable = await mockTableService.lockTable(table.id);
      expect(lockedTable.isLocked).toBe(true);

      // Unlock the table
      const unlockedTable = await mockTableService.unlockTable(table.id);
      expect(unlockedTable.isLocked).toBe(false);
    });
  });

  describe('validateTableArrangement', () => {
    it('should validate table arrangement in demo mode', async () => {
      // Create tables with different scenarios
      await mockTableService.createTable({
        eventId: 'demo-event-1',
        name: 'Normal Table',
        capacity: 8,
        position: { x: 100, y: 100 }
      });

      const result = await mockTableService.validateTableArrangement('demo-event-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toContain('1 tables have no assigned guests');
    });
  });
});