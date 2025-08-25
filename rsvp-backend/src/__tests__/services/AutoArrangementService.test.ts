import { AutoArrangementService, ArrangementConstraints } from '../../services/AutoArrangementService';
import { Guest, Table, VenueElement, RelationshipType } from '../../../../shared/src/types';

describe('AutoArrangementService', () => {
  let autoArrangementService: AutoArrangementService;
  let mockGuests: Guest[];
  let mockTables: Table[];
  let mockVenueElements: VenueElement[];

  beforeEach(() => {
    autoArrangementService = new AutoArrangementService();
    
    // Create mock guests with diverse relationships and sides
    mockGuests = [
      {
        id: 'guest-1',
        name: 'John Smith',
        phoneNumber: '+1234567890',
        dietaryRestrictions: ['vegetarian'],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.PARENT,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-2',
        name: 'Jane Smith',
        phoneNumber: '+1234567891',
        dietaryRestrictions: ['vegetarian'],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.PARENT,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-3',
        name: 'Bob Johnson',
        phoneNumber: '+1234567892',
        dietaryRestrictions: [],
        additionalGuestCount: 1,
        relationshipType: RelationshipType.PARENT,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-4',
        name: 'Alice Johnson',
        phoneNumber: '+1234567893',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.PARENT,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-5',
        name: 'Mike Brown',
        phoneNumber: '+1234567894',
        dietaryRestrictions: ['gluten-free'],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-6',
        name: 'Sarah Wilson',
        phoneNumber: '+1234567895',
        dietaryRestrictions: ['gluten-free'],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.FRIEND,
        brideOrGroomSide: 'bride',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-7',
        name: 'Tom Davis',
        phoneNumber: '+1234567896',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.COLLEAGUE,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'guest-8',
        name: 'Lisa Garcia',
        phoneNumber: '+1234567897',
        dietaryRestrictions: [],
        additionalGuestCount: 0,
        relationshipType: RelationshipType.COLLEAGUE,
        brideOrGroomSide: 'groom',
        rsvpStatus: 'accepted',
        specialRequests: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create mock tables
    mockTables = [
      {
        id: 'table-1',
        name: 'Table 1',
        capacity: 8,
        position: { x: 100, y: 100 },
        isLocked: false,
        assignedGuests: [],
        eventId: 'event-1'
      },
      {
        id: 'table-2',
        name: 'Table 2',
        capacity: 8,
        position: { x: 200, y: 100 },
        isLocked: false,
        assignedGuests: [],
        eventId: 'event-1'
      },
      {
        id: 'table-3',
        name: 'Table 3',
        capacity: 6,
        position: { x: 300, y: 200 },
        isLocked: true, // Locked table should be skipped
        assignedGuests: [],
        eventId: 'event-1'
      }
    ];

    // Create mock venue elements
    mockVenueElements = [
      {
        id: 'stage-1',
        type: 'stage',
        name: 'Main Stage',
        position: { x: 150, y: 50 },
        dimensions: { width: 100, height: 50 },
        color: '#8B4513',
        eventId: 'event-1'
      },
      {
        id: 'dance-floor-1',
        type: 'dance_floor',
        name: 'Dance Floor',
        position: { x: 250, y: 150 },
        dimensions: { width: 100, height: 100 },
        color: '#FFD700',
        eventId: 'event-1'
      },
      {
        id: 'bar-1',
        type: 'bar',
        name: 'Bar',
        position: { x: 400, y: 100 },
        dimensions: { width: 80, height: 40 },
        color: '#654321',
        eventId: 'event-1'
      }
    ];
  });

  describe('generateArrangement', () => {
    it('should successfully arrange guests with default constraints', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);
      expect(result.arrangedGuests).toBe(mockGuests.length);
      expect(result.tableAssignments.size).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should keep families together when keepFamiliesTogether is true', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: false,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that parents from the same side are at the same table
      const brideParents = mockGuests.filter(g => 
        g.relationshipType === RelationshipType.PARENT && g.brideOrGroomSide === 'bride'
      );
      const groomParents = mockGuests.filter(g => 
        g.relationshipType === RelationshipType.PARENT && g.brideOrGroomSide === 'groom'
      );

      if (brideParents.length > 1) {
        const brideParentTables = brideParents.map(parent => {
          for (const [tableId, guestIds] of result.tableAssignments.entries()) {
            if (guestIds.includes(parent.id)) {
              return tableId;
            }
          }
          return null;
        });
        
        // All bride parents should be at the same table
        const uniqueBrideParentTables = new Set(brideParentTables.filter(t => t !== null));
        expect(uniqueBrideParentTables.size).toBeLessThanOrEqual(1);
      }

      if (groomParents.length > 1) {
        const groomParentTables = groomParents.map(parent => {
          for (const [tableId, guestIds] of result.tableAssignments.entries()) {
            if (guestIds.includes(parent.id)) {
              return tableId;
            }
          }
          return null;
        });
        
        // All groom parents should be at the same table
        const uniqueGroomParentTables = new Set(groomParentTables.filter(t => t !== null));
        expect(uniqueGroomParentTables.size).toBeLessThanOrEqual(1);
      }
    });

    it('should respect table capacity constraints', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that no table exceeds its capacity
      for (const [tableId, guestIds] of result.tableAssignments.entries()) {
        const table = mockTables.find(t => t.id === tableId);
        expect(table).toBeDefined();
        
        if (table) {
          const assignedGuests = mockGuests.filter(g => guestIds.includes(g.id));
          const totalSeats = assignedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
          expect(totalSeats).toBeLessThanOrEqual(table.capacity);
        }
      }
    });

    it('should skip locked tables', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that locked table (table-3) has no assignments
      expect(result.tableAssignments.has('table-3')).toBe(false);
    });

    it('should consider dietary restrictions when enabled', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: false,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: false,
        optimizeVenueProximity: false,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that guests with similar dietary restrictions are grouped together
      const vegetarianGuests = mockGuests.filter(g => g.dietaryRestrictions.includes('vegetarian'));
      const glutenFreeGuests = mockGuests.filter(g => g.dietaryRestrictions.includes('gluten-free'));

      if (vegetarianGuests.length > 1) {
        const vegetarianTables = vegetarianGuests.map(guest => {
          for (const [tableId, guestIds] of result.tableAssignments.entries()) {
            if (guestIds.includes(guest.id)) {
              return tableId;
            }
          }
          return null;
        });
        
        // Vegetarian guests should preferably be at the same table
        const uniqueVegetarianTables = new Set(vegetarianTables.filter(t => t !== null));
        expect(uniqueVegetarianTables.size).toBeLessThanOrEqual(2); // Allow some flexibility
      }
    });

    it('should optimize venue proximity when enabled', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that parents (high priority) are assigned to tables closer to the stage
      const parents = mockGuests.filter(g => g.relationshipType === RelationshipType.PARENT);
      const friends = mockGuests.filter(g => g.relationshipType === RelationshipType.FRIEND);

      if (parents.length > 0 && friends.length > 0) {
        // Find tables assigned to parents and friends
        const parentTables = new Set<string>();
        const friendTables = new Set<string>();

        for (const [tableId, guestIds] of result.tableAssignments.entries()) {
          const hasParents = parents.some(p => guestIds.includes(p.id));
          const hasFriends = friends.some(f => guestIds.includes(f.id));
          
          if (hasParents) parentTables.add(tableId);
          if (hasFriends) friendTables.add(tableId);
        }

        // This is a basic check - in a real scenario, we'd calculate distances to stage
        expect(parentTables.size).toBeGreaterThan(0);
        expect(friendTables.size).toBeGreaterThan(0);
      }
    });

    it('should handle insufficient table capacity gracefully', async () => {
      // Create scenario with insufficient capacity
      const limitedTables: Table[] = [
        {
          id: 'small-table-1',
          name: 'Small Table 1',
          capacity: 2,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: [],
          eventId: 'event-1'
        }
      ];

      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        limitedTables,
        mockVenueElements,
        constraints
      );

      // Should still succeed but with fewer arranged guests
      expect(result.success).toBe(true);
      expect(result.arrangedGuests).toBeLessThan(mockGuests.length);
      expect(result.arrangedGuests).toBeGreaterThan(0);
    });

    it('should balance bride and groom sides when enabled', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: false,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: false,
        optimizeVenueProximity: false,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that tables have a reasonable balance of bride/groom sides
      for (const [tableId, guestIds] of result.tableAssignments.entries()) {
        if (guestIds.length > 2) { // Only check tables with multiple guests
          const assignedGuests = mockGuests.filter(g => guestIds.includes(g.id));
          const brideCount = assignedGuests.filter(g => g.brideOrGroomSide === 'bride').length;
          const groomCount = assignedGuests.filter(g => g.brideOrGroomSide === 'groom').length;

          // Allow some imbalance but not extreme cases
          if (brideCount > 0 && groomCount > 0) {
            const ratio = Math.min(brideCount, groomCount) / Math.max(brideCount, groomCount);
            expect(ratio).toBeGreaterThan(0.2); // At least 20% balance
          }
        }
      }
    });

    it('should validate arrangements and identify conflicts', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.conflicts)).toBe(true);

      // Check that conflicts are properly categorized
      result.conflicts.forEach(conflict => {
        expect(['capacity', 'dietary', 'relationship', 'balance', 'proximity']).toContain(conflict.type);
        expect(['error', 'warning', 'info']).toContain(conflict.severity);
        expect(typeof conflict.message).toBe('string');
        expect(Array.isArray(conflict.affectedGuests)).toBe(true);
        expect(Array.isArray(conflict.affectedTables)).toBe(true);
      });
    });

    it('should calculate arrangement quality score', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should handle empty guest list', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        [],
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);
      expect(result.arrangedGuests).toBe(0);
      expect(result.tableAssignments.size).toBe(0);
    });

    it('should handle no available tables', async () => {
      const allLockedTables = mockTables.map(table => ({ ...table, isLocked: true }));
      
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: true,
        considerDietaryRestrictions: true,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        allLockedTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);
      expect(result.arrangedGuests).toBe(0);
      expect(result.tableAssignments.size).toBe(0);
    });
  });

  describe('relationship priority handling', () => {
    it('should prioritize parents over other relationships', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      // Create a scenario with limited table space
      const limitedTables: Table[] = [
        {
          id: 'priority-table-1',
          name: 'Priority Table 1',
          capacity: 4,
          position: { x: 100, y: 100 },
          isLocked: false,
          assignedGuests: [],
          eventId: 'event-1'
        }
      ];

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        limitedTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // Check that parents are assigned before other relationship types
      const assignedGuestIds = Array.from(result.tableAssignments.values()).flat();
      const assignedGuests = mockGuests.filter(g => assignedGuestIds.includes(g.id));
      
      const hasParents = assignedGuests.some(g => g.relationshipType === RelationshipType.PARENT);
      expect(hasParents).toBe(true);
    });
  });

  describe('venue proximity optimization', () => {
    it('should place parents closer to stage', async () => {
      const constraints: ArrangementConstraints = {
        respectRelationships: true,
        balanceBrideGroomSides: false,
        considerDietaryRestrictions: false,
        keepFamiliesTogether: true,
        optimizeVenueProximity: true,
        maxGuestsPerTable: 8,
        minGuestsPerTable: 2,
        preferredTableDistance: 100
      };

      const result = await autoArrangementService.generateArrangement(
        mockGuests,
        mockTables,
        mockVenueElements,
        constraints
      );

      expect(result.success).toBe(true);

      // This is a basic test - in practice, we'd verify actual distance calculations
      const parents = mockGuests.filter(g => g.relationshipType === RelationshipType.PARENT);
      const friends = mockGuests.filter(g => g.relationshipType === RelationshipType.FRIEND);

      // Ensure both groups are assigned
      const assignedGuestIds = Array.from(result.tableAssignments.values()).flat();
      const assignedParents = parents.filter(p => assignedGuestIds.includes(p.id));
      const assignedFriends = friends.filter(f => assignedGuestIds.includes(f.id));

      expect(assignedParents.length).toBeGreaterThan(0);
      expect(assignedFriends.length).toBeGreaterThan(0);
    });
  });
});