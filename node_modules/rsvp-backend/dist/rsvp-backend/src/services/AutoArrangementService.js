"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoArrangementService = void 0;
const types_1 = require("../../../shared/src/types");
class AutoArrangementService {
    async generateArrangement(guests, tables, venueElements, constraints) {
        try {
            // Filter guests to only include those who have accepted their RSVP
            const acceptedGuests = guests.filter(guest => guest.rsvpStatus === 'accepted');
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
            const guestGroups = this.createGuestGroups(acceptedGuests, constraints);
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
        }
        catch (error) {
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
    createGuestGroups(guests, constraints) {
        const groups = [];
        const processed = new Set();
        if (constraints.keepFamiliesTogether) {
            // Group by relationship type and side, keeping relationship types separate
            const relationshipGroups = new Map();
            guests.forEach(guest => {
                if (processed.has(guest.id))
                    return;
                // Create more specific grouping key to separate relationship types
                const groupKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;
                if (!relationshipGroups.has(groupKey)) {
                    relationshipGroups.set(groupKey, []);
                }
                relationshipGroups.get(groupKey).push(guest);
                processed.add(guest.id);
            });
            // Convert relationship groups to GuestGroup objects
            relationshipGroups.forEach((relationshipMembers, groupKey) => {
                const [side, relationshipType] = groupKey.split('-');
                // Create group for each relationship type (no splitting needed since we use individual table capacities)
                groups.push(this.createGuestGroupFromFamily(relationshipMembers, side, relationshipType));
            });
        }
        else {
            // Simple grouping without family consideration - create individual groups
            guests.forEach(guest => {
                if (!processed.has(guest.id)) {
                    groups.push(this.createGuestGroupFromGuests([guest]));
                    processed.add(guest.id);
                }
            });
        }
        return groups.sort((a, b) => b.priority - a.priority);
    }
    createGuestGroupFromFamily(familyMembers, side, relationshipType) {
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
    createGuestGroupFromGuests(guests) {
        const sides = guests.map(g => g.brideOrGroomSide);
        const brideCount = sides.filter(s => s === 'bride').length;
        const groomCount = sides.filter(s => s === 'groom').length;
        const preferredSide = brideCount > groomCount ? 'bride' :
            groomCount > brideCount ? 'groom' : 'mixed';
        const dietaryRestrictions = [...new Set(guests.flatMap(g => g.dietaryRestrictions))];
        const avgPriority = guests.reduce((sum, g) => sum + (AutoArrangementService.RELATIONSHIP_PRIORITIES[g.relationshipType] || 1), 0) / guests.length;
        return {
            id: `mixed-group-${Date.now()}`,
            guests,
            priority: avgPriority,
            constraints: {
                mustSitTogether: false,
                preferredSide,
                dietaryRestrictions,
                relationshipType: types_1.RelationshipType.OTHER,
                proximityPreferences: []
            }
        };
    }
    calculateTableScores(guestGroups, tables, venueElements, constraints, allGuests) {
        const scores = new Map();
        guestGroups.forEach(group => {
            const groupScores = new Map();
            tables.forEach(table => {
                if (table.isLocked)
                    return; // Skip locked tables
                const score = this.calculateTableScoreForGroup(group, table, venueElements, constraints, allGuests);
                groupScores.set(table.id, score);
            });
            scores.set(group.id, groupScores);
        });
        return scores;
    }
    calculateTableScoreForGroup(group, table, venueElements, constraints, allGuests) {
        const factors = {
            capacity: this.calculateCapacityScore(group, table, allGuests),
            balance: this.calculateBalanceScore(group, table, constraints),
            dietary: this.calculateDietaryScore(group, constraints),
            proximity: this.calculateProximityScore(group, table, venueElements, constraints),
            relationship: this.calculateRelationshipScore(group, constraints)
        };
        const totalScore = factors.capacity * 0.3 +
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
    calculateCapacityScore(group, table, allGuests) {
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
        }
        else if (utilization >= 0.4 && utilization < 0.6) {
            return 0.8;
        }
        else if (utilization > 0.9) {
            return 0.6;
        }
        else {
            return 0.4; // Under-utilized
        }
    }
    calculateBalanceScore(group, table, constraints) {
        // Balance scoring removed - bride/groom sides should be kept separate
        return 1.0;
    }
    calculateDietaryScore(group, constraints) {
        if (!constraints.considerDietaryRestrictions) {
            return 1.0;
        }
        const uniqueDietaryRestrictions = group.constraints.dietaryRestrictions.length;
        // Prefer tables with similar dietary needs
        if (uniqueDietaryRestrictions === 0) {
            return 1.0;
        }
        else if (uniqueDietaryRestrictions <= 2) {
            return 0.9;
        }
        else {
            return 0.7; // Many different dietary restrictions
        }
    }
    calculateProximityScore(group, table, venueElements, constraints) {
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
            const distances = relevantElements.map(element => this.calculateDistance(table.position, element.position));
            const minDistance = Math.min(...distances);
            let proximityScore;
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
    calculateRelationshipScore(group, constraints) {
        if (!constraints.respectRelationships) {
            return 1.0;
        }
        // Higher priority relationships get higher scores
        return group.priority / 10;
    }
    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    }
    optimizeAssignments(guestGroups, tables, tableScores, constraints) {
        const assignments = new Map();
        const tableCapacities = new Map();
        const tableRelationshipTypes = new Map(); // Track relationship types per table
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
            if (!groupScores)
                continue;
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
            // Sort by table number priority (lower numbers first) then by score
            availableTableOptions.sort(([tableIdA, scoreA], [tableIdB, scoreB]) => {
                const tableA = tables.find(t => t.id === tableIdA);
                const tableB = tables.find(t => t.id === tableIdB);
                if (!tableA || !tableB)
                    return 0;
                const tableNumA = this.extractTableNumber(tableA.name);
                const tableNumB = this.extractTableNumber(tableB.name);
                // For high priority relationships (bride, groom, parents, siblings), prioritize lower table numbers
                if (group.priority >= 80) {
                    if (tableNumA !== tableNumB) {
                        return tableNumA - tableNumB; // Lower table numbers first
                    }
                }
                // For lower priority relationships, still consider table number but weight score more
                const tableNumDiff = (tableNumA - tableNumB) * 0.1; // Small weight for table number
                const scoreDiff = scoreB.score - scoreA.score; // Higher scores first
                return tableNumDiff + scoreDiff;
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
        const finalAssignments = new Map();
        for (const [tableId, guestIds] of assignments.entries()) {
            if (guestIds.length > 0) {
                finalAssignments.set(tableId, guestIds);
            }
        }
        return finalAssignments;
    }
    extractTableNumber(tableName) {
        const match = tableName.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 999; // Default to high number if no number found
    }
    validateAssignments(assignments, guests, tables, constraints) {
        const conflicts = [];
        // Check capacity violations
        assignments.forEach((guestIds, tableId) => {
            const table = tables.find(t => t.id === tableId);
            if (!table)
                return;
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
    calculateArrangementScore(assignments, guests, tables, venueElements, constraints) {
        let totalScore = 0;
        let totalTables = 0;
        assignments.forEach((guestIds, tableId) => {
            const table = tables.find(t => t.id === tableId);
            if (!table || guestIds.length === 0)
                return;
            const assignedGuests = guests.filter(g => guestIds.includes(g.id));
            const group = this.createGuestGroupFromGuests(assignedGuests);
            const tableScore = this.calculateTableScoreForGroup(group, table, venueElements, constraints, guests);
            totalScore += tableScore.score;
            totalTables++;
        });
        return totalTables > 0 ? totalScore / totalTables : 0;
    }
}
exports.AutoArrangementService = AutoArrangementService;
AutoArrangementService.RELATIONSHIP_PRIORITIES = {
    [types_1.RelationshipType.BRIDE]: 100,
    [types_1.RelationshipType.GROOM]: 100,
    [types_1.RelationshipType.PARENT]: 90,
    [types_1.RelationshipType.SIBLING]: 80,
    [types_1.RelationshipType.GRANDPARENT]: 70,
    [types_1.RelationshipType.GRANDUNCLE]: 60,
    [types_1.RelationshipType.GRANDAUNT]: 60,
    [types_1.RelationshipType.UNCLE]: 50,
    [types_1.RelationshipType.AUNT]: 50,
    [types_1.RelationshipType.COUSIN]: 40,
    [types_1.RelationshipType.COLLEAGUE]: 20,
    [types_1.RelationshipType.FRIEND]: 30,
    [types_1.RelationshipType.OTHER]: 10
};
AutoArrangementService.VENUE_PROXIMITY_RULES = {
    [types_1.RelationshipType.BRIDE]: [
        { elementType: 'stage', preference: 'close', weight: 1.0 },
        { elementType: 'dance_floor', preference: 'close', weight: 0.8 }
    ],
    [types_1.RelationshipType.GROOM]: [
        { elementType: 'stage', preference: 'close', weight: 1.0 },
        { elementType: 'dance_floor', preference: 'close', weight: 0.8 }
    ],
    [types_1.RelationshipType.PARENT]: [
        { elementType: 'stage', preference: 'close', weight: 0.9 },
        { elementType: 'dance_floor', preference: 'close', weight: 0.6 }
    ],
    [types_1.RelationshipType.SIBLING]: [
        { elementType: 'stage', preference: 'close', weight: 0.7 },
        { elementType: 'dance_floor', preference: 'close', weight: 0.6 }
    ],
    [types_1.RelationshipType.GRANDPARENT]: [
        { elementType: 'stage', preference: 'close', weight: 0.8 },
        { elementType: 'bar', preference: 'far', weight: 0.5 },
        { elementType: 'dance_floor', preference: 'far', weight: 0.4 }
    ],
    [types_1.RelationshipType.GRANDUNCLE]: [
        { elementType: 'stage', preference: 'close', weight: 0.6 },
        { elementType: 'bar', preference: 'neutral', weight: 0.3 }
    ],
    [types_1.RelationshipType.GRANDAUNT]: [
        { elementType: 'stage', preference: 'close', weight: 0.6 },
        { elementType: 'bar', preference: 'neutral', weight: 0.3 }
    ],
    [types_1.RelationshipType.UNCLE]: [
        { elementType: 'stage', preference: 'close', weight: 0.5 }
    ],
    [types_1.RelationshipType.AUNT]: [
        { elementType: 'stage', preference: 'close', weight: 0.5 }
    ],
    [types_1.RelationshipType.COUSIN]: [
        { elementType: 'dance_floor', preference: 'close', weight: 0.4 }
    ],
    [types_1.RelationshipType.COLLEAGUE]: [
        { elementType: 'bar', preference: 'close', weight: 0.5 },
        { elementType: 'stage', preference: 'neutral', weight: 0.3 }
    ],
    [types_1.RelationshipType.FRIEND]: [
        { elementType: 'dance_floor', preference: 'close', weight: 0.7 },
        { elementType: 'bar', preference: 'close', weight: 0.6 }
    ],
    [types_1.RelationshipType.OTHER]: []
};
//# sourceMappingURL=AutoArrangementService.js.map