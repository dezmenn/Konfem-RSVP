import { Table, Position } from '../../../shared/src/types';
import { TableInput, TableUpdate } from '../models/Table';
import { DemoDataService } from './DemoDataService';
import { TableValidationResult, TableCapacityInfo } from './TableService';
import { AutoArrangementService, ArrangementConstraints, ArrangementResult } from './AutoArrangementService';

export class MockTableService {
  private demoDataService: DemoDataService;
  private autoArrangementService: AutoArrangementService;
  private nextId = 6; // Start after the demo tables

  constructor() {
    this.demoDataService = DemoDataService.getInstance();
    this.autoArrangementService = new AutoArrangementService();
  }

  async createTable(tableData: TableInput): Promise<Table> {
    const newTable: Table = {
      id: `table-${this.nextId++}`,
      name: tableData.name,
      capacity: tableData.capacity,
      position: tableData.position,
      isLocked: false,
      assignedGuests: [],
      eventId: tableData.eventId
    };

    this.demoDataService.addTable(newTable);
    return newTable;
  }

  async updateTable(id: string, updates: TableUpdate): Promise<Table> {
    const existingTable = this.demoDataService.getTableById(id);
    if (!existingTable) {
      throw new Error('Table not found');
    }

    // Check capacity constraints
    if (updates.capacity !== undefined) {
      const assignedGuests = existingTable.assignedGuests || [];
      const assignedGuestCount = assignedGuests.length;
      if (updates.capacity < assignedGuestCount) {
        throw new Error(`Cannot reduce capacity to ${updates.capacity}. Table currently has ${assignedGuestCount} assigned guests.`);
      }
    }

    const updatedTable = this.demoDataService.updateTable(id, updates);
    if (!updatedTable) {
      throw new Error('Table not found');
    }

    return updatedTable;
  }

  async deleteTable(id: string): Promise<boolean> {
    const table = this.demoDataService.getTableById(id);
    if (!table) {
      throw new Error('Table not found');
    }

    const assignedGuests = table.assignedGuests || [];
    if (assignedGuests.length > 0) {
      throw new Error(`Cannot delete table. It has ${assignedGuests.length} assigned guests. Please reassign guests first.`);
    }

    return this.demoDataService.deleteTable(id);
  }

  async getTable(id: string): Promise<Table | null> {
    return this.demoDataService.getTableById(id);
  }

  async getEventTables(eventId: string): Promise<Table[]> {
    return this.demoDataService.getTables(eventId);
  }

  async getTablesWithGuests(eventId: string): Promise<Table[]> {
    return this.demoDataService.getTables(eventId);
  }

  async lockTable(id: string): Promise<Table> {
    const table = await this.updateTable(id, { isLocked: true });
    return table;
  }

  async unlockTable(id: string): Promise<Table> {
    const table = await this.updateTable(id, { isLocked: false });
    return table;
  }

  async getLockedTables(eventId: string): Promise<Table[]> {
    const tables = this.demoDataService.getTables(eventId);
    return tables.filter(table => table.isLocked);
  }

  async getUnlockedTables(eventId: string): Promise<Table[]> {
    const tables = this.demoDataService.getTables(eventId);
    return tables.filter(table => !table.isLocked);
  }

  async assignGuestToTable(guestId: string, tableId: string): Promise<void> {
    const table = this.demoDataService.getTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const guest = this.demoDataService.getGuestById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }

    // AGGRESSIVE DUPLICATE PREVENTION: Remove guest from ALL tables first
    const allTables = this.demoDataService.getTables('demo-event-1');
    
    // Step 1: Remove from all table assignedGuests arrays
    allTables.forEach(existingTable => {
      if (existingTable.assignedGuests && existingTable.assignedGuests.includes(guestId)) {
        const updatedAssignedGuests = existingTable.assignedGuests.filter((id: string) => id !== guestId);
        this.demoDataService.updateTable(existingTable.id, { assignedGuests: updatedAssignedGuests });
        console.log(`Removed guest ${guestId} from table ${existingTable.name}`);
      }
    });

    // Step 2: Clear guest's table assignment
    this.demoDataService.updateGuest(guestId, { tableAssignment: undefined });

    // Step 3: Wait a moment to ensure data propagation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Step 4: Check capacity of target table (get fresh data)
    const freshTable = this.demoDataService.getTableById(tableId);
    const currentAssignedGuests = freshTable?.assignedGuests || [];
    
    // Calculate current seats used (including additional guests)
    let currentSeatsUsed = 0;
    for (const assignedGuestId of currentAssignedGuests) {
      const assignedGuest = this.demoDataService.getGuestById(assignedGuestId);
      if (assignedGuest) {
        currentSeatsUsed += 1 + (assignedGuest.additionalGuestCount || 0);
      }
    }
    
    // Calculate seats needed for the new guest
    const seatsNeeded = 1 + (guest.additionalGuestCount || 0);
    
    // Check if adding this guest would exceed capacity
    if (currentSeatsUsed + seatsNeeded > table.capacity) {
      throw new Error(`Table would exceed capacity. Current: ${currentSeatsUsed}/${table.capacity}, Adding: ${seatsNeeded} seats`);
    }

    // Step 5: Add guest to target table ONLY
    const newAssignedGuests = [...currentAssignedGuests, guestId];
    this.demoDataService.updateTable(tableId, { assignedGuests: newAssignedGuests });
    console.log(`Added guest ${guestId} to table ${table.name}`);

    // Step 6: Update guest's table assignment to match
    this.demoDataService.updateGuest(guestId, { tableAssignment: tableId });

    // Step 7: Verify no duplicates exist (aggressive check)
    const verificationTables = this.demoDataService.getTables('demo-event-1');
    const guestAppearances = verificationTables.filter(t => 
      t.assignedGuests && t.assignedGuests.includes(guestId)
    );
    
    if (guestAppearances.length > 1) {
      console.error(`DUPLICATE DETECTED: Guest ${guestId} appears in ${guestAppearances.length} tables`);
      // Force cleanup - keep only in target table
      verificationTables.forEach(t => {
        if (t.id !== tableId && t.assignedGuests && t.assignedGuests.includes(guestId)) {
          const cleanedGuests = t.assignedGuests.filter((id: string) => id !== guestId);
          this.demoDataService.updateTable(t.id, { assignedGuests: cleanedGuests });
          console.log(`FORCE REMOVED guest ${guestId} from table ${t.name}`);
        }
      });
    }

    console.log(`Assignment complete: Guest ${guestId} -> Table ${tableId}`);
  }

  async unassignGuestFromTable(guestId: string): Promise<void> {
    const guest = this.demoDataService.getGuestById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }

    // Remove guest from ALL tables to prevent duplicates (comprehensive cleanup)
    const allTables = this.demoDataService.getTables('demo-event-1');
    allTables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.includes(guestId)) {
        const updatedAssignedGuests = table.assignedGuests.filter((id: string) => id !== guestId);
        this.demoDataService.updateTable(table.id, { assignedGuests: updatedAssignedGuests });
      }
    });

    // Update guest's table assignment
    this.demoDataService.updateGuest(guestId, { tableAssignment: undefined });

    // Run synchronization after unassignment to ensure consistency
    await this.synchronizeGuestTableAssignments('demo-event-1');
  }

  async getTableCapacityInfo(eventId: string): Promise<TableCapacityInfo[]> {
    const tables = this.demoDataService.getTables(eventId);
    return tables.map(table => {
      const assignedGuests = table.assignedGuests || [];
      return {
        tableId: table.id,
        name: table.name,
        capacity: table.capacity,
        occupied: assignedGuests.length,
        available: table.capacity - assignedGuests.length,
        isOverCapacity: assignedGuests.length > table.capacity
      };
    });
  }

  async validateTableArrangement(eventId: string): Promise<TableValidationResult> {
    const tables = this.demoDataService.getTables(eventId);
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: TableValidationResult['conflicts'] = [];

    // Check for over-capacity tables
    for (const table of tables) {
      const assignedGuests = table.assignedGuests || [];
      if (assignedGuests.length > table.capacity) {
        const error = `Table "${table.name}" is over capacity: ${assignedGuests.length}/${table.capacity} guests`;
        errors.push(error);
        conflicts.push({
          tableId: table.id,
          issue: error,
          severity: 'error'
        });
      }
    }

    // Check for position conflicts
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = tables[i];
        const table2 = tables[j];
        
        if (this.doTablesOverlap(table1.position, table2.position)) {
          const warning = `Tables "${table1.name}" and "${table2.name}" have overlapping positions`;
          warnings.push(warning);
          conflicts.push({
            tableId: table1.id,
            issue: warning,
            severity: 'warning'
          });
        }
      }
    }

    // Check for tables with no guests (warning only)
    const emptyTables = tables.filter(table => {
      const assignedGuests = table.assignedGuests || [];
      return assignedGuests.length === 0;
    });
    if (emptyTables.length > 0) {
      warnings.push(`${emptyTables.length} tables have no assigned guests`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      conflicts
    };
  }

  async duplicateTable(id: string, offset: Position = { x: 50, y: 50 }): Promise<Table> {
    const originalTable = this.demoDataService.getTableById(id);
    if (!originalTable) {
      throw new Error('Table not found');
    }

    const duplicateData: TableInput = {
      eventId: originalTable.eventId,
      name: `${originalTable.name} (Copy)`,
      capacity: originalTable.capacity,
      position: {
        x: originalTable.position.x + offset.x,
        y: originalTable.position.y + offset.y
      }
    };

    return await this.createTable(duplicateData);
  }

  async autoArrangeGuestsEnhanced(eventId: string, constraints: Partial<ArrangementConstraints> = {}): Promise<ArrangementResult> {
    try {
      // Get all required data from demo service
      const guests = this.demoDataService.getGuests(eventId);
      const tables = this.demoDataService.getTables(eventId);
      const venueElements = this.demoDataService.getVenueElements(eventId);

      // Set default constraints
      const fullConstraints: ArrangementConstraints = {
        respectRelationships: constraints.respectRelationships ?? true,
        considerDietaryRestrictions: constraints.considerDietaryRestrictions ?? true,
        keepFamiliesTogether: constraints.keepFamiliesTogether ?? true,
        optimizeVenueProximity: constraints.optimizeVenueProximity ?? true,
        minGuestsPerTable: constraints.minGuestsPerTable ?? 2,
        preferredTableDistance: constraints.preferredTableDistance ?? 100
      };

      // Generate the arrangement using the enhanced algorithm
      const result = await this.autoArrangementService.generateArrangement(
        guests,
        tables,
        venueElements,
        fullConstraints
      );

      if (result.success) {
        // Apply the assignments to the demo data
        await this.applyTableAssignments(result.tableAssignments);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        message: `Enhanced auto-arrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        arrangedGuests: 0,
        tableAssignments: new Map(),
        conflicts: [],
        score: 0
      };
    }
  }

  async autoArrangeGuests(eventId: string, options: {
    respectRelationships?: boolean;
    balanceBrideGroomSides?: boolean;
    considerDietaryRestrictions?: boolean;
    keepFamiliesTogether?: boolean;
    maxGuestsPerTable?: number;
  } = {}): Promise<{ success: boolean; message: string; arrangedGuests: number }> {
    const {
      respectRelationships = true,
      balanceBrideGroomSides = true,
      considerDietaryRestrictions = false,
      keepFamiliesTogether = true,
      maxGuestsPerTable = 8
    } = options;

    try {
      // Get all guests and filter for ONLY guests with accepted RSVP status
      const allGuests = this.demoDataService.getGuests(eventId);
      const guestsToArrange = allGuests.filter(guest => 
        guest.rsvpStatus === 'accepted'
      );
      const availableTables = this.demoDataService.getTables(eventId).filter(t => !t.isLocked);

      if (availableTables.length === 0) {
        return {
          success: false,
          message: 'No unlocked tables available for auto-arrangement',
          arrangedGuests: 0
        };
      }

      if (guestsToArrange.length === 0) {
        return {
          success: false,
          message: 'No guests with accepted RSVP status available to arrange',
          arrangedGuests: 0
        };
      }

      // Only arrange guests that are not already assigned to tables
      const unassignedGuests = guestsToArrange.filter(guest => {
        // Check if guest is already assigned using both data sources
        const hasTableAssignment = !!guest.tableAssignment;
        const isInTableArray = availableTables.some(table => 
          table.assignedGuests && table.assignedGuests.includes(guest.id)
        );
        return !hasTableAssignment && !isInTableArray;
      });

      if (unassignedGuests.length === 0) {
        return {
          success: true,
          message: 'All eligible guests are already assigned to tables',
          arrangedGuests: 0
        };
      }

      // Group only unassigned guests for arrangement
      const guestGroups = this.groupGuestsForArrangement(unassignedGuests, {
        keepFamiliesTogether,
        maxGuestsPerTable
      });

      // Sort tables by available capacity (most available first) to optimize placement
      const sortedTables = availableTables
        .map(table => {
          // Calculate current seats used (including additional guests)
          let currentSeatsUsed = 0;
          const assignedGuests = table.assignedGuests || [];
          for (const assignedGuestId of assignedGuests) {
            const assignedGuest = this.demoDataService.getGuestById(assignedGuestId);
            if (assignedGuest) {
              currentSeatsUsed += 1 + (assignedGuest.additionalGuestCount || 0);
            }
          }
          
          return {
            ...table,
            availableCapacity: table.capacity - currentSeatsUsed
          };
        })
        .filter(table => table.availableCapacity > 0) // Only consider tables with available space
        .sort((a, b) => b.availableCapacity - a.availableCapacity);

      if (sortedTables.length === 0) {
        return {
          success: false,
          message: 'All tables are at full capacity. No space available for additional guests.',
          arrangedGuests: 0
        };
      }

      // Assign groups to tables with available capacity
      let arrangedGuests = 0;
      let tableIndex = 0;

      for (const group of guestGroups) {
        // Find a table with enough capacity for the entire group
        let targetTable = null;
        let targetTableIndex = -1;

        for (let i = tableIndex; i < sortedTables.length; i++) {
          const table = sortedTables[i];
          const currentTable = this.demoDataService.getTableById(table.id);
          const currentAssignedGuests = currentTable?.assignedGuests || [];
          
          // Calculate current seats used (including additional guests)
          let currentSeatsUsed = 0;
          for (const assignedGuestId of currentAssignedGuests) {
            const assignedGuest = this.demoDataService.getGuestById(assignedGuestId);
            if (assignedGuest) {
              currentSeatsUsed += 1 + (assignedGuest.additionalGuestCount || 0);
            }
          }
          
          // Calculate seats needed for the entire group
          let groupSeatsNeeded = 0;
          for (const guest of group) {
            groupSeatsNeeded += 1 + (guest.additionalGuestCount || 0);
          }
          
          const availableSpots = table.capacity - currentSeatsUsed;
          if (availableSpots >= groupSeatsNeeded) {
            targetTable = table;
            targetTableIndex = i;
            break;
          }
        }

        // If no table can fit the entire group, assign guests individually to available tables
        if (!targetTable) {
          for (const guest of group) {
            let assigned = false;
            
            for (let i = tableIndex; i < sortedTables.length; i++) {
              const table = sortedTables[i];
              const currentTable = this.demoDataService.getTableById(table.id);
              const currentAssignedGuests = currentTable?.assignedGuests || [];
              
              // Calculate current seats used (including additional guests)
              let currentSeatsUsed = 0;
              for (const assignedGuestId of currentAssignedGuests) {
                const assignedGuest = this.demoDataService.getGuestById(assignedGuestId);
                if (assignedGuest) {
                  currentSeatsUsed += 1 + (assignedGuest.additionalGuestCount || 0);
                }
              }
              
              // Calculate seats needed for this guest
              const seatsNeeded = 1 + (guest.additionalGuestCount || 0);
              
              if (currentSeatsUsed + seatsNeeded <= table.capacity) {
                await this.assignGuestToTable(guest.id, table.id);
                arrangedGuests++;
                assigned = true;
                
                // Update the sorted table's available capacity for next iteration
                sortedTables[i].availableCapacity -= seatsNeeded;
                break;
              }
            }
            
            if (!assigned) {
              console.warn(`Could not assign guest ${guest.name} - all tables are full`);
              break;
            }
          }
        } else {
          // Assign entire group to the target table
          let groupSeatsUsed = 0;
          for (const guest of group) {
            await this.assignGuestToTable(guest.id, targetTable.id);
            arrangedGuests++;
            groupSeatsUsed += 1 + (guest.additionalGuestCount || 0);
          }
          
          // Update available capacity and move to next table if this one is now full
          sortedTables[targetTableIndex].availableCapacity -= groupSeatsUsed;
          if (sortedTables[targetTableIndex].availableCapacity <= 0) {
            tableIndex = targetTableIndex + 1;
          }
        }
        
        // Break if we've run out of tables with capacity
        if (tableIndex >= sortedTables.length) {
          console.warn('No more tables with available capacity');
          break;
        }
      }

      // Final synchronization step to ensure data consistency
      await this.synchronizeGuestTableAssignments(eventId);

      return {
        success: true,
        message: `Successfully arranged ${arrangedGuests} guests across ${Math.min(tableIndex + 1, availableTables.length)} tables`,
        arrangedGuests
      };

    } catch (error) {
      console.error('Error during auto-arrangement:', error);
      return {
        success: false,
        message: `Auto-arrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        arrangedGuests: 0
      };
    }
  }

  private groupGuestsForArrangement(guests: any[], options: {
    keepFamiliesTogether: boolean;
    maxGuestsPerTable: number;
  }): any[][] {
    const groups: any[][] = [];
    const processed = new Set<string>();

    if (options.keepFamiliesTogether) {
      const familyGroups = new Map<string, any[]>();
      
      guests.forEach(guest => {
        if (processed.has(guest.id)) return;
        
        // Create family key based on relationship type and side
        const familyKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
        
        if (!familyGroups.has(familyKey)) {
          familyGroups.set(familyKey, []);
        }
        
        familyGroups.get(familyKey)!.push(guest);
        processed.add(guest.id);
      });

      // Convert family groups to arrays and split large groups
      familyGroups.forEach(family => {
        if (family.length <= options.maxGuestsPerTable) {
          groups.push(family);
        } else {
          // Split large families across multiple tables
          for (let i = 0; i < family.length; i += options.maxGuestsPerTable) {
            groups.push(family.slice(i, i + options.maxGuestsPerTable));
          }
        }
      });
    } else {
      // Simple grouping without family consideration
      for (let i = 0; i < guests.length; i += options.maxGuestsPerTable) {
        groups.push(guests.slice(i, i + options.maxGuestsPerTable));
      }
    }

    return groups;
  }

  private async applyTableAssignments(assignments: Map<string, string[]>): Promise<void> {
    // First, clear all existing assignments for guests in this event
    const allGuestIds = Array.from(assignments.values()).flat();
    for (const guestId of allGuestIds) {
      await this.unassignGuestFromTable(guestId);
    }

    // Apply new assignments
    for (const [tableId, guestIds] of assignments.entries()) {
      for (const guestId of guestIds) {
        await this.assignGuestToTable(guestId, tableId);
      }
    }
  }

  private async synchronizeGuestTableAssignments(eventId: string): Promise<void> {
    // This method ensures that guest.tableAssignment and table.assignedGuests are perfectly synchronized
    const allGuests = this.demoDataService.getGuests(eventId);
    const allTables = this.demoDataService.getTables(eventId);
    
    // Step 1: Build a map of what tables think they have
    const tableAssignments = new Map<string, Set<string>>();
    allTables.forEach(table => {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        tableAssignments.set(table.id, new Set(table.assignedGuests));
      }
    });
    
    // Step 2: Check each guest and ensure consistency
    for (const guest of allGuests) {
      if (guest.tableAssignment) {
        // Guest thinks they're assigned to a table
        const assignedTable = allTables.find(t => t.id === guest.tableAssignment);
        
        if (assignedTable) {
          // Table exists, make sure guest is in the table's assignedGuests array
          const tableGuestSet = tableAssignments.get(assignedTable.id) || new Set();
          if (!tableGuestSet.has(guest.id)) {
            // Add guest to table's assignedGuests array
            const currentAssignedGuests = assignedTable.assignedGuests || [];
            const updatedAssignedGuests = [...currentAssignedGuests, guest.id];
            this.demoDataService.updateTable(assignedTable.id, { assignedGuests: updatedAssignedGuests });
            tableAssignments.set(assignedTable.id, new Set(updatedAssignedGuests));
          }
        } else {
          // Guest is assigned to non-existent table, clear the assignment
          this.demoDataService.updateGuest(guest.id, { tableAssignment: undefined });
        }
      }
    }
    
    // Step 3: Check each table and ensure guests have correct tableAssignment
    for (const table of allTables) {
      if (table.assignedGuests && table.assignedGuests.length > 0) {
        for (const guestId of table.assignedGuests) {
          const guest = allGuests.find(g => g.id === guestId);
          if (guest) {
            if (guest.tableAssignment !== table.id) {
              // Update guest's tableAssignment to match table's record
              this.demoDataService.updateGuest(guest.id, { tableAssignment: table.id });
            }
          } else {
            // Guest doesn't exist, remove from table's assignedGuests
            const updatedAssignedGuests = table.assignedGuests.filter((id: string) => id !== guestId);
            this.demoDataService.updateTable(table.id, { assignedGuests: updatedAssignedGuests });
          }
        }
      }
    }
  }

  private doTablesOverlap(pos1: Position, pos2: Position, size: number = 60): boolean {
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
    return distance < size;
  }
}