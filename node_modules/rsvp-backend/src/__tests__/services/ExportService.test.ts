import { ExportService, ExportOptions } from '../../services/ExportService';
import { GuestRepository } from '../../repositories/GuestRepository';
import { TableRepository } from '../../repositories/TableRepository';
import { VenueElementRepository } from '../../repositories/VenueElementRepository';
import { Guest, Table, VenueElement, RelationshipType } from '../../../../shared/src/types';

// Mock repositories
jest.mock('../../repositories/GuestRepository');
jest.mock('../../repositories/TableRepository');
jest.mock('../../repositories/VenueElementRepository');

const MockedGuestRepository = GuestRepository as jest.MockedClass<typeof GuestRepository>;
const MockedTableRepository = TableRepository as jest.MockedClass<typeof TableRepository>;
const MockedVenueElementRepository = VenueElementRepository as jest.MockedClass<typeof VenueElementRepository>;

describe('ExportService', () => {
  let exportService: ExportService;
  let mockGuestRepository: jest.Mocked<GuestRepository>;
  let mockTableRepository: jest.Mocked<TableRepository>;
  let mockVenueElementRepository: jest.Mocked<VenueElementRepository>;

  const mockEventId = 'test-event-1';

  const mockGuests: Guest[] = [
    {
      id: 'guest-1',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      dietaryRestrictions: ['Vegetarian'],
      additionalGuestCount: 1,
      relationshipType: RelationshipType.FRIEND,
      brideOrGroomSide: 'bride',
      rsvpStatus: 'accepted',
      specialRequests: 'Wheelchair access',
      tableAssignment: 'table-1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'guest-2',
      name: 'Jane Smith',
      phoneNumber: '+0987654321',
      dietaryRestrictions: ['Gluten-free'],
      additionalGuestCount: 0,
      relationshipType: RelationshipType.COUSIN,
      brideOrGroomSide: 'groom',
      rsvpStatus: 'accepted',
      specialRequests: '',
      tableAssignment: 'table-1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'guest-3',
      name: 'Bob Wilson',
      phoneNumber: '+1122334455',
      dietaryRestrictions: [],
      additionalGuestCount: 2,
      relationshipType: RelationshipType.UNCLE,
      brideOrGroomSide: 'bride',
      rsvpStatus: 'pending',
      specialRequests: 'Late arrival',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTables: Table[] = [
    {
      id: 'table-1',
      name: 'Table 1',
      capacity: 8,
      position: { x: 100, y: 100 },
      isLocked: false,
      assignedGuests: ['guest-1', 'guest-2'],
      eventId: mockEventId
    },
    {
      id: 'table-2',
      name: 'Table 2',
      capacity: 6,
      position: { x: 200, y: 100 },
      isLocked: true,
      assignedGuests: [],
      eventId: mockEventId
    }
  ];

  const mockVenueElements: VenueElement[] = [
    {
      id: 'element-1',
      type: 'stage',
      name: 'Main Stage',
      position: { x: 50, y: 50 },
      dimensions: { width: 200, height: 100 },
      color: '#8B4513',
      eventId: mockEventId
    },
    {
      id: 'element-2',
      type: 'bar',
      name: 'Bar Area',
      position: { x: 300, y: 200 },
      dimensions: { width: 120, height: 60 },
      color: '#654321',
      eventId: mockEventId
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockGuestRepository = new MockedGuestRepository() as jest.Mocked<GuestRepository>;
    mockTableRepository = new MockedTableRepository() as jest.Mocked<TableRepository>;
    mockVenueElementRepository = new MockedVenueElementRepository() as jest.Mocked<VenueElementRepository>;

    exportService = new ExportService(
      mockGuestRepository,
      mockTableRepository,
      mockVenueElementRepository
    );

    // Setup default mock implementations
    mockGuestRepository.findByEventId.mockResolvedValue(mockGuests);
    mockTableRepository.getTablesWithGuests.mockResolvedValue(mockTables);
    mockVenueElementRepository.findByEventId.mockResolvedValue(mockVenueElements);
  });

  describe('exportSeatingChart', () => {
    it('should export seating chart as CSV successfully', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/seating-chart-\d+\.csv/);
      expect(result.buffer).toBeDefined();

      // Verify CSV content
      const csvContent = result.buffer!.toString('utf-8');
      expect(csvContent).toContain('Table Name,Guest Name,Additional Guests');
      expect(csvContent).toContain('Table 1');
      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('Jane Smith');
      expect(csvContent).toContain('Statistics');
      expect(csvContent).toContain('Total Guests,3');
    });

    it('should export seating chart as PDF (placeholder)', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: true
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.filename).toMatch(/seating-chart-\d+\.pdf/);
      expect(result.buffer).toBeDefined();
    });

    it('should export seating chart as Excel (placeholder)', async () => {
      const options: ExportOptions = {
        format: 'xlsx',
        includeVenueLayout: false,
        includeGuestDetails: false,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('xlsx');
      expect(result.filename).toMatch(/seating-chart-\d+\.xlsx/);
      expect(result.buffer).toBeDefined();
    });

    it('should handle unsupported export format', async () => {
      const options: ExportOptions = {
        format: 'xml' as any,
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format: xml');
    });

    it('should handle repository errors gracefully', async () => {
      mockGuestRepository.findByEventId.mockRejectedValue(new Error('Database connection failed'));

      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('exportGuestList', () => {
    it('should export guest list as CSV successfully', async () => {
      const result = await exportService.exportGuestList(mockEventId, 'csv');

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/guest-list-\d+\.csv/);
      expect(result.buffer).toBeDefined();

      // Verify CSV content
      const csvContent = result.buffer!.toString('utf-8');
      expect(csvContent).toContain('Name,Phone Number,RSVP Status');
      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('Jane Smith');
      expect(csvContent).toContain('Bob Wilson');
      expect(csvContent).toContain('Table 1');
      expect(csvContent).toContain('Unassigned');
    });

    it('should export guest list as Excel (placeholder)', async () => {
      const result = await exportService.exportGuestList(mockEventId, 'xlsx');

      expect(result.success).toBe(true);
      expect(result.format).toBe('xlsx');
      expect(result.filename).toMatch(/guest-list-\d+\.xlsx/);
      expect(result.buffer).toBeDefined();
    });

    it('should handle empty guest list', async () => {
      mockGuestRepository.findByEventId.mockResolvedValue([]);
      mockTableRepository.getTablesWithGuests.mockResolvedValue([]);

      const result = await exportService.exportGuestList(mockEventId, 'csv');

      expect(result.success).toBe(true);
      const csvContent = result.buffer!.toString('utf-8');
      expect(csvContent).toContain('Name,Phone Number,RSVP Status');
      // Should only contain headers and empty line at end
      expect(csvContent.split('\n').length).toBe(1); // Header only
    });
  });

  describe('exportVenueLayout', () => {
    it('should export venue layout as PDF (placeholder)', async () => {
      const result = await exportService.exportVenueLayout(mockEventId, 'pdf');

      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.filename).toMatch(/venue-layout-\d+\.pdf/);
      expect(result.buffer).toBeDefined();
    });

    it('should export venue layout as Excel (placeholder)', async () => {
      const result = await exportService.exportVenueLayout(mockEventId, 'xlsx');

      expect(result.success).toBe(true);
      expect(result.format).toBe('xlsx');
      expect(result.filename).toMatch(/venue-layout-\d+\.xlsx/);
      expect(result.buffer).toBeDefined();
    });
  });

  describe('data gathering', () => {
    it('should gather complete seating chart data', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(mockGuestRepository.findByEventId).toHaveBeenCalledWith(mockEventId);
      expect(mockTableRepository.getTablesWithGuests).toHaveBeenCalledWith(mockEventId);
      expect(mockVenueElementRepository.findByEventId).toHaveBeenCalledWith(mockEventId);

      expect(result.success).toBe(true);
    });

    it('should calculate statistics correctly', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);
      const csvContent = result.buffer!.toString('utf-8');

      // Total guests: 3
      expect(csvContent).toContain('Total Guests,3');
      // Total seats required: John(1+1) + Jane(1+0) + Bob(1+2) = 6
      expect(csvContent).toContain('Total Seats Required,6');
      // Occupied seats: John(1+1) + Jane(1+0) = 3 (only assigned guests)
      expect(csvContent).toContain('Occupied Seats,3');
      // Available seats: (8+6) - 3 = 11
      expect(csvContent).toContain('Available Seats,11');
      // Tables used: 1 (only Table 1 has guests)
      expect(csvContent).toContain('Tables Used,1');
      // Total tables: 2
      expect(csvContent).toContain('Total Tables,2');
    });

    it('should handle missing guest data gracefully', async () => {
      // Mock a table with a guest ID that doesn't exist in the guest list
      const tablesWithMissingGuest: Table[] = [
        {
          id: 'table-1',
          name: 'Table 1',
          capacity: 8,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: ['guest-1', 'missing-guest'],
          eventId: mockEventId
        }
      ];

      mockTableRepository.getTablesWithGuests.mockResolvedValue(tablesWithMissingGuest);

      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Guest not found: missing-guest');
    });
  });

  describe('CSV formatting', () => {
    it('should properly escape CSV special characters', async () => {
      const guestsWithSpecialChars: Guest[] = [
        {
          id: 'guest-special',
          name: 'John "Johnny" Doe',
          phoneNumber: '+1234567890',
          dietaryRestrictions: ['Vegetarian, No spicy food'],
          additionalGuestCount: 0,
          relationshipType: RelationshipType.FRIEND,
          brideOrGroomSide: 'bride',
          rsvpStatus: 'accepted',
          specialRequests: 'Needs "special" seating',
          tableAssignment: 'table-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockGuestRepository.findByEventId.mockResolvedValue(guestsWithSpecialChars);

      const result = await exportService.exportGuestList(mockEventId, 'csv');
      const csvContent = result.buffer!.toString('utf-8');

      // Check that quotes are properly escaped
      expect(csvContent).toContain('John "Johnny" Doe');
      expect(csvContent).toContain('Needs ""special"" seating');
    });

    it('should handle empty table in seating chart export', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeVenueLayout: true,
        includeGuestDetails: true,
        includeTableAssignments: true,
        printOptimized: false
      };

      const result = await exportService.exportSeatingChart(mockEventId, options);
      const csvContent = result.buffer!.toString('utf-8');

      // Should include empty table entry
      expect(csvContent).toContain('Table 2');
      expect(csvContent).toContain('[Empty Table]');
    });
  });
});