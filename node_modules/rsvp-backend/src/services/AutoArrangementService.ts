import { Guest, Table, VenueElement, Position, RelationshipType } from '../../../shared/src/types';

export interface ArrangementConstraints {
  respectRelationships: boolean;
  considerDietaryRestrictions: boolean;
  keepFamiliesTogether: boolean;
  optimizeVenueProximity: boolean;
  minGuestsPerTable: number;
  preferredTableDistance: number;
}

export interface ArrangementResult {
  success: boolean;
  message: string;
  arrangedGuests: number;
  tableAssignments: Map<string, string[]>; // tableId -> guestIds
  conflicts: ArrangementConflict[];
  score: number; // Overall arrangement quality score
}

export interface ArrangementConflict {
  type: 'capacity' | 'dietary' | 'relationship' | 'balance' | 'proximity';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedGuests: string[];
  affectedTables: string[];
}

export interface GuestGroup {
  id: string;
  guests: Guest[];
  priority: number;
  constraints: {
    mustSitTogether: boolean;
    preferredSide: 'bride' | 'groom' | 'mixed';
    dietaryRestrictions: string[];
    relationshipType: RelationshipType;
    proximityPreferences: VenueProximityPreference[];
  };
}

export interface VenueProximityPreference {
  elementType: VenueElement['type'];
  preference: 'close' | 'far' | 'neutral';
  weight: number;
}

export interface TableScore {
  tableId: string;
  score: number;
  factors: {
    capacity: number;
    balance: number;
    dietary: number;
    proximity: number;
    relationship: number;
  };
}

export class AutoArrangementService {
  private static readonly RELATIONSHIP_PRIORITIES: Record<RelationshipType, number> = {
    [RelationshipType.BRIDE]: 100,
    [RelationshipType.GROOM]: 100,
    [RelationshipType.PARENT]: 90,
    [RelationshipType.SIBLING]: 80,
    [RelationshipType.GRANDPARENT]: 70,
    [RelationshipType.GRANDUNCLE]: 60,
    [RelationshipType.GRANDAUNT]: 60,
    [RelationshipType.UNCLE]: 50,
    [RelationshipType.AUNT]: 50,
    [RelationshipType.COUSIN]: 40,
    [RelationshipType.COLLEAGUE]: 20,
    [RelationshipType.FRIEND]: 30,
    [RelationshipType.OTHER]: 10
  };

  private static readonly VENUE_PROXIMITY_RULES: Record<RelationshipType, VenueProximityPreference[]> = {
    [RelationshipType.BRIDE]: [
      { elementType: 'stage', preference: 'close', weight: 1.0 },
      { elementType: 'dance_floor', preference: 'close', weight: 0.8 }
    ],
    [RelationshipType.GROOM]: [
      { elementType: 'stage', preference: 'close', weight: 1.0 },
      { elementType: 'dance_floor', preference: 'close', weight: 0.8 }
    ],
    [RelationshipType.PARENT]: [
      { elementType: 'stage', preference: 'close', weight: 0.9 },
      { elementType: 'dance_floor', preference: 'close', weight: 0.6 }
    ],
    [RelationshipType.SIBLING]: [
      { elementType: 'stage', preference: 'close', weight: 0.7 },
      { elementType: 'dance_floor', preference: 'close', weight: 0.6 }
    ],
    [RelationshipType.GRANDPARENT]: [
      { elementType: 'stage', preference: 'close', weight: 0.8 },
      { elementType: 'bar', preference: 'far', weight: 0.5 },
      { elementType: 'dance_floor', preference: 'far', weight: 0.4 }
    ],
    [RelationshipType.GRANDUNCLE]: [
      { elementType: 'stage', preference: 'close', weight: 0.6 },
      { elementType: 'bar', preference: 'neutral', weight: 0.3 }
    ],
    [RelationshipType.GRANDAUNT]: [
      { elementType: 'stage', preference: 'close', weight: 0.6 },
      { elementType: 'bar', preference: 'neutral', weight: 0.3 }
    ],
    [RelationshipType.UNCLE]: [
      { elementType: 'stage', preference: 'close', weight: 0.5 }
    ],
    [RelationshipType.AUNT]: [
      { elementType: 'stage', preference: 'close', weight: 0.5 }
    ],
    [RelationshipType.COUSIN]: [
      { elementType: 'dance_floor', preference: 'close', weight: 0.4 }
    ],
    [RelationshipType.COLLEAGUE]: [
      { elementType: 'bar', preference: 'close', weight: 0.5 },
      { elementType: 'stage', preference: 'neutral', weight: 0.3 }
    ],
    [RelationshipType.FRIEND]: [
      { elementType: 'dance_floor', preference: 'close', weight: 0.7 },
      { elementType: 'bar', preference: 'close', weight: 0.6 }
    ],
    [RelationshipType.OTHER]: []
  };

  async generateArrangement(
    guests: Guest[],
    tables: Table[],
    venueElements: VenueElement[],
    constraints: ArrangementConstraints
  ): Promise<ArrangementResult> {
    try {
      // Filter guests to only include those who have accepted their RSVP AND are not already assigned to tables
      const acceptedGuests = guests.filter(guest => 
        guest.rsvpStatus === 'accepted' && !guest.tableAssignment
      );
      
      if (acceptedGuests.length === 0) {
        return {
          success: true,
          message: 'No guests with accepted RSVP status to arrange',
          arrangedGuests: 0,
          tableAssignments: new Map(),
          conflicts: [],
          score: 1.0
        };
      }

      // Step 1: Create guest groups based on relationships and constraints
      const guestGroups = this.createGuestGroups(acceptedGuests, tables, constraints);

      // Step 2: Score tables for each group based on constraints
      const tableScores = this.calculateTableScores(guestGroups, tables, venueElements, constraints, acceptedGuests);

      // Step 3: Assign groups to tables using optimization algorithm
      const assignments = this.optimizeAssignments(guestGroups, tables, tableScores, constraints);

      // Step 4: Validate assignments and identify conflicts
      const conflicts = this.validateAssignments(assignments, guests, tables, constraints);

      // Step 5: Calculate overall arrangement quality score
      const score = this.calculateArrangementScore(assignments, guests, tables, venueElements, constraints);

      const arrangedGuestCount = Array.from(assignments.values()).flat().length;
      
      return {
        success: true,
        message: `Successfully arranged ${arrangedGuestCount} guests across ${assignments.size} tables`,
        arrangedGuests: arrangedGuestCount,
        tableAssignments: assignments,
        conflicts,
        score
      };

    } catch (error) {
      return {
        success: false,
        message: `Auto-arrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        arrangedGuests: 0,
        tableAssignments: new Map(),
        conflicts: [],
        score: 0
      };
    }
  }

  private createGuestGroups(guests: Guest[], tables: Table[], constraints: ArrangementConstraints): GuestGroup[] {
    const groups: GuestGroup[] = [];
    const processed = new Set<string>();

    // Create VIP head table group with bride, groom, and other VIP guests
    const vipHeadTableGroup = this.createVIPHeadTableGroup(guests, tables);
    if (vipHeadTableGroup.guests.length > 0) {
      groups.push(vipHeadTableGroup);
      vipHeadTableGroup.guests.forEach(g => processed.add(g.id));
    }

    if (constraints.keepFamiliesTogether) {
      // Group by actual family units (last name + relationship type + side)
      // This keeps actual families together, not just relationship types
      const familyGroups = new Map<string, Guest[]>();

      guests.forEach(guest => {
        if (processed.has(guest.id)) return;

        // Create family group key using last name + relationship type + side
        // This groups actual family units together (e.g., "Smith-PARENT-bride")
        const lastName = guest.name.split(' ').pop() || 'Unknown';
        const familyKey = `${lastName}-${guest.relationshipType}-${guest.brideOrGroomSide}`;
        
        if (!familyGroups.has(familyKey)) {
          familyGroups.set(familyKey, []);
        }
        
        familyGroups.get(familyKey)!.push(guest);
        processed.add(guest.id);
      });

      // Convert family groups to GuestGroup objects
      familyGroups.forEach((familyMembers, familyKey) => {
        const [lastName, relationshipType, side] = familyKey.split('-');
        
        if (familyMembers.length > 1) {
          // Multiple family members - keep them together
          groups.push(this.createGuestGroupFromFamily(
            familyMembers, 
            side as 'bride' | 'groom', 
            relationshipType as RelationshipType
          ));
        } else {
          // Single family member - create individual group
          groups.push(this.createGuestGroupFromGuests(familyMembers));
        }
      });
    } else {
      // Group by relationship type and side only (original behavior)
      const relationshipGroups = new Map<string, Guest[]>();

      guests.forEach(guest => {
        if (processed.has(guest.id)) return;

        const groupKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
        
        if (!relationshipGroups.has(groupKey)) {
          relationshipGroups.set(groupKey, []);
        }
        
        relationshipGroups.get(groupKey)!.push(guest);
        processed.add(guest.id);
      });

      // Convert relationship groups to individual guest groups
      relationshipGroups.forEach((relationshipMembers, groupKey) => {
        const [side, relationshipType] = groupKey.split('-');
        
        // Create individual groups for each guest (no family grouping)
        relationshipMembers.forEach(guest => {
          groups.push(this.createGuestGroupFromGuests([guest]));
        });
      });
    }

    return groups.sort((a, b) => b.priority - a.priority);
  }

  private createVIPHeadTableGroup(guests: Guest[], tables: Table[]): GuestGroup {
    // Find the head table (Table 1 or lowest numbered table)
    const headTable = tables
      .filter(table => !table.isLocked)
      .sort((a, b) => this.extractTableNumber(a.name) - this.extractTableNumber(b.name))[0];
    
    if (!headTable) {
      return this.createGuestGroupFromGuests([]); // No available tables
    }

    // Calculate available capacity for head table (accounting for additional guests)
    const currentlyOccupiedSeats = headTable.assignedGuests.reduce((sum, guestId) => {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        return sum + 1 + guest.additionalGuestCount;
      }
      return sum + 1; // Fallback if guest not found
    }, 0);
    const availableCapacity = headTable.capacity - currentlyOccupiedSeats;

    // Define VIP priority order for head table
    const vipPriorityOrder = [
      RelationshipType.BRIDE,
      RelationshipType.GROOM,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.GRANDPARENT
    ];

    // Collect VIP guests in priority order
    const vipGuests: Guest[] = [];
    let remainingCapacity = availableCapacity;

    for (const relationshipType of vipPriorityOrder) {
      if (remainingCapacity <= 0) break;

      const guestsOfType = guests.filter(g => 
        g.relationshipType === relationshipType && 
        g.rsvpStatus === 'accepted' && 
        !g.tableAssignment
      );

      for (const guest of guestsOfType) {
        const requiredSeats = 1 + guest.additionalGuestCount;
        
        if (requiredSeats <= remainingCapacity) {
          vipGuests.push(guest);
          remainingCapacity -= requiredSeats;
        }
        
        // Stop if we've filled the table
        if (remainingCapacity <= 0) break;
      }
    }

    if (vipGuests.length === 0) {
      return this.createGuestGroupFromGuests([]); // No VIP guests to place
    }

    // Create the VIP head table group
    const dietaryRestrictions = [...new Set(vipGuests.flatMap(g => g.dietaryRestrictions))];
    
    // Combine proximity preferences from all VIP relationship types
    const proximityPreferences: VenueProximityPreference[] = [];
    const addedPreferences = new Set<string>();
    
    vipGuests.forEach(guest => {
      const prefs = AutoArrangementService.VENUE_PROXIMITY_RULES[guest.relationshipType] || [];
      prefs.forEach(pref => {
        const key = `${pref.elementType}-${pref.preference}`;
        if (!addedPreferences.has(key)) {
          proximityPreferences.push(pref);
          addedPreferences.add(key);
        }
      });
    });

    return {
      id: `vip-head-table-${Date.now()}`,
      guests: vipGuests,
      priority: 200, // Highest priority - ensures head table gets Table 1
      constraints: {
        mustSitTogether: true,
        preferredSide: 'mixed', // Head table can mix bride and groom sides
        dietaryRestrictions,
        relationshipType: RelationshipType.BRIDE, // Use bride as primary for compatibility
        proximityPreferences
      }
    };
  }

  private createBrideGroomHeadTableGroup(brideGroomMembers: Guest[]): GuestGroup {
    const dietaryRestrictions = [...new Set(brideGroomMembers.flatMap(g => g.dietaryRestrictions))];
    
    // Combine proximity preferences from both bride and groom
    const bridePrefs = AutoArrangementService.VENUE_PROXIMITY_RULES[RelationshipType.BRIDE] || [];
    const groomPrefs = AutoArrangementService.VENUE_PROXIMITY_RULES[RelationshipType.GROOM] || [];
    const proximityPreferences = [...bridePrefs, ...groomPrefs];

    return {
      id: `head-table-${Date.now()}`,
      guests: brideGroomMembers,
      priority: 150, // Highest priority - above both bride and groom individual priorities
      constraints: {
        mustSitTogether: true,
        preferredSide: 'mixed', // Head table can be mixed
        dietaryRestrictions,
        relationshipType: RelationshipType.BRIDE, // Use bride as primary for compatibility
        proximityPreferences
      }
    };
  }

  private createGuestGroupFromFamily(
    familyMembers: Guest[], 
    side: 'bride' | 'groom', 
    relationshipType: RelationshipType
  ): GuestGroup {
    const dietaryRestrictions = [...new Set(familyMembers.flatMap(g => g.dietaryRestrictions))];
    const priority = AutoArrangementService.RELATIONSHIP_PRIORITIES[relationshipType] || 1;
    const proximityPreferences = AutoArrangementService.VENUE_PROXIMITY_RULES[relationshipType] || [];

    return {
      id: `${side}-${relationshipType}-${Date.now()}`,
      guests: familyMembers,
      priority,
      constraints: {
        mustSitTogether: true,
        preferredSide: side,
        dietaryRestrictions,
        relationshipType,
        proximityPreferences
      }
    };
  }

  private createGuestGroupFromGuests(guests: Guest[]): GuestGroup {
    const sides = guests.map(g => g.brideOrGroomSide);
    const brideCount = sides.filter(s => s === 'bride').length;
    const groomCount = sides.filter(s => s === 'groom').length;
    
    const preferredSide: 'bride' | 'groom' | 'mixed' = 
      brideCount > groomCount ? 'bride' : 
      groomCount > brideCount ? 'groom' : 'mixed';

    const dietaryRestrictions = [...new Set(guests.flatMap(g => g.dietaryRestrictions))];
    const avgPriority = guests.reduce((sum, g) => 
      sum + (AutoArrangementService.RELATIONSHIP_PRIORITIES[g.relationshipType] || 1), 0
    ) / guests.length;

    return {
      id: `mixed-group-${Date.now()}`,
      guests,
      priority: avgPriority,
      constraints: {
        mustSitTogether: false,
        preferredSide,
        dietaryRestrictions,
        relationshipType: RelationshipType.OTHER,
        proximityPreferences: []
      }
    };
  }

  private calculateTableScores(
    guestGroups: GuestGroup[],
    tables: Table[],
    venueElements: VenueElement[],
    constraints: ArrangementConstraints,
    allGuests: Guest[]
  ): Map<string, Map<string, TableScore>> {
    const scores = new Map<string, Map<string, TableScore>>();

    guestGroups.forEach(group => {
      const groupScores = new Map<string, TableScore>();

      tables.forEach(table => {
        if (table.isLocked) return; // Skip locked tables

        const score = this.calculateTableScoreForGroup(group, table, venueElements, constraints, allGuests);
        groupScores.set(table.id, score);
      });

      scores.set(group.id, groupScores);
    });

    return scores;
  }

  private calculateTableScoreForGroup(
    group: GuestGroup,
    table: Table,
    venueElements: VenueElement[],
    constraints: ArrangementConstraints,
    allGuests: Guest[]
  ): TableScore {
    const factors = {
      capacity: this.calculateCapacityScore(group, table, allGuests),
      balance: this.calculateBalanceScore(group, table, constraints),
      dietary: this.calculateDietaryScore(group, constraints),
      proximity: this.calculateProximityScore(group, table, venueElements, constraints),
      relationship: this.calculateRelationshipScore(group, constraints)
    };

    const totalScore = 
      factors.capacity * 0.3 +
      factors.balance * 0.2 +
      factors.dietary * 0.15 +
      factors.proximity * 0.2 +
      factors.relationship * 0.15;

    return {
      tableId: table.id,
      score: totalScore,
      factors
    };
  }

  private calculateCapacityScore(group: GuestGroup, table: Table, allGuests: Guest[]): number {
    const requiredSeats = group.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
    
    // Calculate currently occupied seats including additional guests
    const currentlyOccupiedSeats = table.assignedGuests.reduce((sum, guestId) => {
      const guest = allGuests.find(g => g.id === guestId);
      if (guest) {
        return sum + 1 + guest.additionalGuestCount;
      }
      return sum + 1; // Fallback if guest not found
    }, 0);
    
    const availableSeats = table.capacity - currentlyOccupiedSeats;

    if (requiredSeats > availableSeats) {
      return 0; // Cannot fit
    }

    // Prefer tables that are well-utilized but not overcrowded
    const utilization = (currentlyOccupiedSeats + requiredSeats) / table.capacity;
    if (utilization >= 0.6 && utilization <= 0.9) {
      return 1.0;
    } else if (utilization >= 0.4 && utilization < 0.6) {
      return 0.8;
    } else if (utilization > 0.9) {
      return 0.6;
    } else {
      return 0.4; // Under-utilized
    }
  }

  private calculateBalanceScore(group: GuestGroup, table: Table, constraints: ArrangementConstraints): number {
    // Balance scoring removed - bride/groom sides should be kept separate
    return 1.0;
  }

  private calculateDietaryScore(group: GuestGroup, constraints: ArrangementConstraints): number {
    if (!constraints.considerDietaryRestrictions) {
      return 1.0;
    }

    const uniqueDietaryRestrictions = group.constraints.dietaryRestrictions.length;
    
    // Prefer tables with similar dietary needs
    if (uniqueDietaryRestrictions === 0) {
      return 1.0;
    } else if (uniqueDietaryRestrictions <= 2) {
      return 0.9;
    } else {
      return 0.7; // Many different dietary restrictions
    }
  }

  private calculateProximityScore(
    group: GuestGroup,
    table: Table,
    venueElements: VenueElement[],
    constraints: ArrangementConstraints
  ): number {
    if (!constraints.optimizeVenueProximity || group.constraints.proximityPreferences.length === 0) {
      return 1.0;
    }

    let totalScore = 0;
    let totalWeight = 0;

    group.constraints.proximityPreferences.forEach(preference => {
      const relevantElements = venueElements.filter(e => e.type === preference.elementType);
      
      if (relevantElements.length === 0) {
        return;
      }

      const distances = relevantElements.map(element => 
        this.calculateDistance(table.position, element.position)
      );
      const minDistance = Math.min(...distances);

      let proximityScore: number;
      switch (preference.preference) {
        case 'close':
          proximityScore = Math.max(0, 1 - (minDistance / 200)); // Closer is better
          break;
        case 'far':
          proximityScore = Math.min(1, minDistance / 200); // Farther is better
          break;
        case 'neutral':
        default:
          proximityScore = 0.5; // Neutral preference
          break;
      }

      totalScore += proximityScore * preference.weight;
      totalWeight += preference.weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 1.0;
  }

  private calculateRelationshipScore(group: GuestGroup, constraints: ArrangementConstraints): number {
    if (!constraints.respectRelationships) {
      return 1.0;
    }

    // Higher priority relationships get higher scores
    const basePriorityScore = group.priority / 100; // Normalize to 0-1.5 range

    // Additional bonus for keeping relationship types together
    // This encourages similar relationships to sit at the same table
    let relationshipBonus = 0;
    const relationshipType = group.constraints.relationshipType;
    
    // VIP relationships get extra bonus for being at head tables
    if ([RelationshipType.BRIDE, RelationshipType.GROOM, RelationshipType.PARENT].includes(relationshipType)) {
      relationshipBonus = 0.3;
    } else if ([RelationshipType.SIBLING, RelationshipType.GRANDPARENT].includes(relationshipType)) {
      relationshipBonus = 0.2;
    } else if ([RelationshipType.UNCLE, RelationshipType.AUNT, RelationshipType.COUSIN].includes(relationshipType)) {
      relationshipBonus = 0.1;
    }

    return Math.min(1.0, basePriorityScore + relationshipBonus);
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  }

  private optimizeAssignments(
    guestGroups: GuestGroup[],
    tables: Table[],
    tableScores: Map<string, Map<string, TableScore>>,
    constraints: ArrangementConstraints
  ): Map<string, string[]> {
    const assignments = new Map<string, string[]>();
    const tableCapacities = new Map<string, number>();
    const tableRelationshipTypes = new Map<string, Set<RelationshipType>>(); // Track relationship types per table

    // Initialize table capacities only for unlocked tables, sorted by table number (ascending = closer to VIP)
    const availableTables = tables
      .filter(table => !table.isLocked)
      .sort((a, b) => this.extractTableNumber(a.name) - this.extractTableNumber(b.name));
    
    availableTables.forEach(table => {
      assignments.set(table.id, []);
      tableCapacities.set(table.id, table.capacity - table.assignedGuests.length);
      tableRelationshipTypes.set(table.id, new Set());
    });

    // If no available tables or no guests, return empty assignments
    if (availableTables.length === 0 || guestGroups.length === 0) {
      return assignments;
    }

    // Sort groups by priority (highest first)
    const sortedGroups = [...guestGroups].sort((a, b) => b.priority - a.priority);

    // Assign each group to the best available table
    for (const group of sortedGroups) {
      const groupScores = tableScores.get(group.id);
      if (!groupScores) continue;

      const requiredSeats = group.guests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);
      const groupRelationshipType = group.constraints.relationshipType;

      // Find tables that can accommodate this group
      let availableTableOptions = Array.from(groupScores.entries())
        .filter(([tableId]) => {
          const availableCapacity = tableCapacities.get(tableId) || 0;
          return availableCapacity >= requiredSeats;
        });

      // If keepFamiliesTogether is enabled, prefer tables with same relationship type or empty tables
      if (constraints.keepFamiliesTogether) {
        const sameRelationshipTables = availableTableOptions.filter(([tableId]) => {
          const tableRelationships = tableRelationshipTypes.get(tableId) || new Set();
          return tableRelationships.size === 0 || tableRelationships.has(groupRelationshipType);
        });

        // If we found compatible tables, use those
        if (sameRelationshipTables.length > 0) {
          availableTableOptions = sameRelationshipTables;
        }
      }

      // Sort by table number priority using 3-tier wedding seating system
      availableTableOptions.sort(([tableIdA, scoreA], [tableIdB, scoreB]) => {
        const tableA = tables.find(t => t.id === tableIdA);
        const tableB = tables.find(t => t.id === tableIdB);
        
        if (!tableA || !tableB) return 0;
        
        const tableNumA = this.extractTableNumber(tableA.name);
        const tableNumB = this.extractTableNumber(tableB.name);
        
        // Tier 1: VIP/Immediate Family (priority >= 80) - Tables 1, 2, 3...
        // Includes: Bride/Groom head table (200), Parents (90), Siblings (80)
        if (group.priority >= 80) {
          if (tableNumA !== tableNumB) {
            return tableNumA - tableNumB; // Lower table numbers first (closer to head table)
          }
          return scoreB.score - scoreA.score; // Score tiebreaker
        }
        
        // Tier 2: Extended Family (priority 40-79) - Middle tables
        // Includes: Grandparents (70), Grand-uncles/aunts (60), Uncles/Aunts (50), Cousins (40)
        else if (group.priority >= 40) {
          // For extended family, use natural table order (ascending) but start after VIP tables
          if (tableNumA !== tableNumB) {
            return tableNumA - tableNumB; // Lower table numbers first, but they'll get middle tables
          }
          return scoreB.score - scoreA.score; // Score tiebreaker
        }
        
        // Tier 3: Friends/Colleagues/Others (priority < 40) - Back tables
        // Includes: Friends (30), Colleagues (20), Others (10)
        else {
          if (tableNumA !== tableNumB) {
            return tableNumB - tableNumA; // Higher table numbers first (farther from head table)
          }
          return scoreB.score - scoreA.score; // Score tiebreaker
        }
      });

      if (availableTableOptions.length > 0) {
        const [bestTableId] = availableTableOptions[0];
        const currentAssignments = assignments.get(bestTableId) || [];
        const newAssignments = [...currentAssignments, ...group.guests.map(g => g.id)];
        
        assignments.set(bestTableId, newAssignments);
        tableCapacities.set(bestTableId, (tableCapacities.get(bestTableId) || 0) - requiredSeats);
        
        // Track the relationship type for this table
        const tableRelationships = tableRelationshipTypes.get(bestTableId) || new Set();
        tableRelationships.add(groupRelationshipType);
        tableRelationshipTypes.set(bestTableId, tableRelationships);
      }
    }

    // Remove empty table assignments
    const finalAssignments = new Map<string, string[]>();
    for (const [tableId, guestIds] of assignments.entries()) {
      if (guestIds.length > 0) {
        finalAssignments.set(tableId, guestIds);
      }
    }

    return finalAssignments;
  }

  private extractTableNumber(tableName: string): number {
    const match = tableName.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999; // Default to high number if no number found
  }

  private validateAssignments(
    assignments: Map<string, string[]>,
    guests: Guest[],
    tables: Table[],
    constraints: ArrangementConstraints
  ): ArrangementConflict[] {
    const conflicts: ArrangementConflict[] = [];

    // Check capacity violations
    assignments.forEach((guestIds, tableId) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      const assignedGuests = guests.filter(g => guestIds.includes(g.id));
      const totalSeats = assignedGuests.reduce((sum, guest) => sum + 1 + guest.additionalGuestCount, 0);

      if (totalSeats > table.capacity) {
        conflicts.push({
          type: 'capacity',
          severity: 'error',
          message: `Table "${table.name}" is over capacity: ${totalSeats}/${table.capacity} seats`,
          affectedGuests: guestIds,
          affectedTables: [tableId]
        });
      }
    });

    // Bride/groom balance checking removed - sides should be kept separate

    return conflicts;
  }

  private calculateArrangementScore(
    assignments: Map<string, string[]>,
    guests: Guest[],
    tables: Table[],
    venueElements: VenueElement[],
    constraints: ArrangementConstraints
  ): number {
    let totalScore = 0;
    let totalTables = 0;

    assignments.forEach((guestIds, tableId) => {
      const table = tables.find(t => t.id === tableId);
      if (!table || guestIds.length === 0) return;

      const assignedGuests = guests.filter(g => guestIds.includes(g.id));
      const group: GuestGroup = this.createGuestGroupFromGuests(assignedGuests);
      
      const tableScore = this.calculateTableScoreForGroup(group, table, venueElements, constraints, guests);
      totalScore += tableScore.score;
      totalTables++;
    });

    return totalTables > 0 ? totalScore / totalTables : 0;
  }
}