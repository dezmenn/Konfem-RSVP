"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableService = void 0;
const Table_1 = require("../models/Table");
const AutoArrangementService_1 = require("./AutoArrangementService");
class TableService {
    constructor(tableRepository, guestRepository, venueElementRepository) {
        this.tableRepository = tableRepository;
        this.guestRepository = guestRepository;
        this.venueElementRepository = venueElementRepository;
        this.autoArrangementService = new AutoArrangementService_1.AutoArrangementService();
    }
    async createTable(tableData) {
        // Validate input
        const validation = Table_1.TableModel.validate(tableData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Sanitize input
        const sanitizedData = Table_1.TableModel.sanitize(tableData);
        // Check for position conflicts with other tables
        const existingTables = await this.tableRepository.findByEventId(tableData.eventId);
        const conflicts = this.checkTablePositionConflicts(sanitizedData.position, existingTables);
        if (conflicts.length > 0) {
            console.warn(`Table position conflicts detected: ${conflicts.join(', ')}`);
        }
        return await this.tableRepository.create(sanitizedData);
    }
    async updateTable(id, updates) {
        // Validate updates
        const validation = Table_1.TableModel.validateUpdate(updates);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Check if table exists
        const existingTable = await this.tableRepository.findById(id);
        if (!existingTable) {
            throw new Error('Table not found');
        }
        // If updating capacity, check if it would cause over-capacity
        if (updates.capacity !== undefined) {
            const capacityInfo = await this.tableRepository.checkTableCapacity(id);
            if (updates.capacity < capacityInfo.occupied) {
                throw new Error(`Cannot reduce capacity to ${updates.capacity}. Table currently has ${capacityInfo.occupied} assigned guests.`);
            }
        }
        // Check for position conflicts if position is being updated
        if (updates.position) {
            const existingTables = await this.tableRepository.findByEventId(existingTable.eventId);
            const otherTables = existingTables.filter(t => t.id !== id);
            const conflicts = this.checkTablePositionConflicts(updates.position, otherTables);
            if (conflicts.length > 0) {
                console.warn(`Table position conflicts detected: ${conflicts.join(', ')}`);
            }
        }
        const updatedTable = await this.tableRepository.update(id, updates);
        if (!updatedTable) {
            throw new Error('Table not found');
        }
        return updatedTable;
    }
    async deleteTable(id) {
        const table = await this.tableRepository.findById(id);
        if (!table) {
            throw new Error('Table not found');
        }
        // Check if table has assigned guests
        const capacityInfo = await this.tableRepository.checkTableCapacity(id);
        if (capacityInfo.occupied > 0) {
            throw new Error(`Cannot delete table. It has ${capacityInfo.occupied} assigned guests. Please reassign guests first.`);
        }
        return await this.tableRepository.delete(id);
    }
    async getTable(id) {
        return await this.tableRepository.getTableWithGuests(id);
    }
    async getEventTables(eventId) {
        return await this.tableRepository.getTablesWithGuests(eventId);
    }
    async lockTable(id) {
        const table = await this.tableRepository.lockTable(id);
        if (!table) {
            throw new Error('Table not found');
        }
        return table;
    }
    async unlockTable(id) {
        const table = await this.tableRepository.unlockTable(id);
        if (!table) {
            throw new Error('Table not found');
        }
        return table;
    }
    async getLockedTables(eventId) {
        return await this.tableRepository.findLockedTables(eventId);
    }
    async getUnlockedTables(eventId) {
        return await this.tableRepository.findUnlockedTables(eventId);
    }
    async assignGuestToTable(guestId, tableId) {
        // Check if table exists and has capacity
        const capacityInfo = await this.tableRepository.checkTableCapacity(tableId);
        if (capacityInfo.available <= 0) {
            throw new Error(`Table is at full capacity (${capacityInfo.capacity}/${capacityInfo.capacity})`);
        }
        // Check if guest exists
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        // Assign guest to table
        await this.guestRepository.update(guestId, { tableAssignment: tableId });
    }
    async unassignGuestFromTable(guestId) {
        // Check if guest exists
        const guest = await this.guestRepository.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }
        // Unassign guest from table
        await this.guestRepository.update(guestId, { tableAssignment: undefined });
    }
    async getTableCapacityInfo(eventId) {
        const capacityData = await this.tableRepository.getTableCapacityInfo(eventId);
        return capacityData.map(data => ({
            ...data,
            isOverCapacity: data.occupied > data.capacity
        }));
    }
    async validateTableArrangement(eventId) {
        const tables = await this.tableRepository.getTablesWithGuests(eventId);
        const errors = [];
        const warnings = [];
        const conflicts = [];
        // Check for over-capacity tables
        for (const table of tables) {
            if (table.assignedGuests.length > table.capacity) {
                const error = `Table "${table.name}" is over capacity: ${table.assignedGuests.length}/${table.capacity} guests`;
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
        const emptyTables = tables.filter(table => table.assignedGuests.length === 0);
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
    async duplicateTable(id, offset = { x: 50, y: 50 }) {
        const originalTable = await this.tableRepository.findById(id);
        if (!originalTable) {
            throw new Error('Table not found');
        }
        const duplicateData = {
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
    async autoArrangeGuestsEnhanced(eventId, constraints = {}) {
        try {
            // Get all required data
            const guests = await this.guestRepository.findByEventId(eventId);
            const tables = await this.tableRepository.findByEventId(eventId);
            const venueElements = await this.venueElementRepository.findByEventId(eventId);
            // Set default constraints
            const fullConstraints = {
                respectRelationships: constraints.respectRelationships ?? true,
                considerDietaryRestrictions: constraints.considerDietaryRestrictions ?? true,
                keepFamiliesTogether: constraints.keepFamiliesTogether ?? true,
                optimizeVenueProximity: constraints.optimizeVenueProximity ?? true,
                minGuestsPerTable: constraints.minGuestsPerTable ?? 2,
                preferredTableDistance: constraints.preferredTableDistance ?? 100
            };
            // Generate the arrangement using the enhanced algorithm
            const result = await this.autoArrangementService.generateArrangement(guests, tables, venueElements, fullConstraints);
            if (result.success) {
                // Apply the assignments to the database
                await this.applyTableAssignments(result.tableAssignments);
            }
            return result;
        }
        catch (error) {
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
    async autoArrangeGuests(eventId, options = {}) {
        const { respectRelationships = true, balanceBrideGroomSides = true, considerDietaryRestrictions = false, keepFamiliesTogether = true, maxGuestsPerTable = 8 } = options;
        try {
            // Get all guests and filter for accepted RSVP status only
            const allGuests = await this.guestRepository.findByEventId(eventId);
            const acceptedGuests = allGuests.filter(guest => guest.rsvpStatus === 'accepted');
            const availableTables = await this.tableRepository.findUnlockedTables(eventId);
            if (availableTables.length === 0) {
                return {
                    success: false,
                    message: 'No unlocked tables available for auto-arrangement',
                    arrangedGuests: 0
                };
            }
            if (acceptedGuests.length === 0) {
                return {
                    success: false,
                    message: 'No guests with accepted RSVP status to arrange',
                    arrangedGuests: 0
                };
            }
            // First, unassign all guests from tables
            for (const guest of allGuests) {
                if (guest.tableAssignment) {
                    await this.unassignGuestFromTable(guest.id);
                }
            }
            // Group guests for arrangement (only accepted guests)
            const guestGroups = this.groupGuestsForArrangement(acceptedGuests, {
                keepFamiliesTogether,
                maxGuestsPerTable
            });
            // Assign groups to tables
            let arrangedGuests = 0;
            let tableIndex = 0;
            for (const group of guestGroups) {
                if (tableIndex >= availableTables.length) {
                    console.warn('Not enough tables for all guest groups');
                    break;
                }
                const table = availableTables[tableIndex];
                // Assign each guest in the group to the current table
                for (const guest of group) {
                    const capacityInfo = await this.tableRepository.checkTableCapacity(table.id);
                    if (capacityInfo.available > 0) {
                        await this.assignGuestToTable(guest.id, table.id);
                        arrangedGuests++;
                    }
                    else {
                        // Move to next table if current is full
                        tableIndex++;
                        if (tableIndex < availableTables.length) {
                            await this.assignGuestToTable(guest.id, availableTables[tableIndex].id);
                            arrangedGuests++;
                        }
                        else {
                            console.warn('No more available tables for remaining guests');
                            break;
                        }
                    }
                }
                tableIndex++;
            }
            return {
                success: true,
                message: `Successfully arranged ${arrangedGuests} guests across ${Math.min(tableIndex + 1, availableTables.length)} tables`,
                arrangedGuests
            };
        }
        catch (error) {
            console.error('Error during auto-arrangement:', error);
            return {
                success: false,
                message: `Auto-arrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                arrangedGuests: 0
            };
        }
    }
    groupGuestsForArrangement(guests, options) {
        const groups = [];
        const processed = new Set();
        if (options.keepFamiliesTogether) {
            const familyGroups = new Map();
            guests.forEach(guest => {
                if (processed.has(guest.id))
                    return;
                // Create family key based on relationship type and side
                const familyKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
                if (!familyGroups.has(familyKey)) {
                    familyGroups.set(familyKey, []);
                }
                familyGroups.get(familyKey).push(guest);
                processed.add(guest.id);
            });
            // Convert family groups to arrays and split large groups
            familyGroups.forEach(family => {
                if (family.length <= options.maxGuestsPerTable) {
                    groups.push(family);
                }
                else {
                    // Split large families across multiple tables
                    for (let i = 0; i < family.length; i += options.maxGuestsPerTable) {
                        groups.push(family.slice(i, i + options.maxGuestsPerTable));
                    }
                }
            });
        }
        else {
            // Simple grouping without family consideration
            for (let i = 0; i < guests.length; i += options.maxGuestsPerTable) {
                groups.push(guests.slice(i, i + options.maxGuestsPerTable));
            }
        }
        return groups;
    }
    async applyTableAssignments(assignments) {
        // First, clear all existing assignments for guests in this event
        const allGuestIds = Array.from(assignments.values()).flat();
        for (const guestId of allGuestIds) {
            await this.guestRepository.update(guestId, { tableAssignment: undefined });
        }
        // Apply new assignments
        for (const [tableId, guestIds] of assignments.entries()) {
            for (const guestId of guestIds) {
                await this.guestRepository.update(guestId, { tableAssignment: tableId });
            }
        }
    }
    checkTablePositionConflicts(position, existingTables) {
        const conflicts = [];
        const tableSize = 60; // Assume standard table size for conflict detection
        for (const table of existingTables) {
            if (this.doTablesOverlap(position, table.position, tableSize)) {
                conflicts.push(`Overlaps with table "${table.name}"`);
            }
        }
        return conflicts;
    }
    doTablesOverlap(pos1, pos2, size = 60) {
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
        return distance < size;
    }
}
exports.TableService = TableService;
//# sourceMappingURL=TableService.js.map