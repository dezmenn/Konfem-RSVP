"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSeeder = void 0;
const repositories_1 = require("../repositories");
const types_1 = require("../../../shared/src/types");
const logger_1 = require("../utils/logger");
class DatabaseSeeder {
    constructor() {
        this.eventRepo = new repositories_1.EventRepository();
        this.guestRepo = new repositories_1.GuestRepository();
        this.tableRepo = new repositories_1.TableRepository();
        this.venueRepo = new repositories_1.VenueElementRepository();
    }
    async seedSampleData() {
        try {
            logger_1.logger.info('Starting database seeding...');
            // Create sample event
            const event = await this.eventRepo.create({
                title: 'Sarah & John\'s Wedding',
                description: 'Join us for our special day filled with love, laughter, and celebration!',
                date: new Date('2025-08-15T18:00:00Z'),
                location: 'Grand Ballroom, Elegant Hotel, 123 Wedding Ave, City, State',
                rsvpDeadline: new Date('2025-07-15T23:59:59Z'),
                organizerId: 'sample-organizer-id',
                publicRSVPEnabled: true
            });
            logger_1.logger.info(`Created sample event: ${event.id}`);
            // Create sample guests
            const sampleGuests = [
                {
                    eventId: event.id,
                    name: 'Michael Johnson',
                    phoneNumber: '+1234567890',
                    dietaryRestrictions: ['Vegetarian'],
                    additionalGuestCount: 1,
                    relationshipType: types_1.RelationshipType.UNCLE,
                    brideOrGroomSide: 'bride',
                    specialRequests: 'Wheelchair accessible seating please'
                },
                {
                    eventId: event.id,
                    name: 'Emily Davis',
                    phoneNumber: '+1234567891',
                    dietaryRestrictions: ['Gluten-free'],
                    additionalGuestCount: 0,
                    relationshipType: types_1.RelationshipType.FRIEND,
                    brideOrGroomSide: 'bride',
                    specialRequests: ''
                },
                {
                    eventId: event.id,
                    name: 'Robert Wilson',
                    phoneNumber: '+1234567892',
                    dietaryRestrictions: [],
                    additionalGuestCount: 1,
                    relationshipType: types_1.RelationshipType.COLLEAGUE,
                    brideOrGroomSide: 'groom',
                    specialRequests: ''
                },
                {
                    eventId: event.id,
                    name: 'Lisa Anderson',
                    phoneNumber: '+1234567893',
                    dietaryRestrictions: ['Vegan'],
                    additionalGuestCount: 0,
                    relationshipType: types_1.RelationshipType.COUSIN,
                    brideOrGroomSide: 'groom',
                    specialRequests: 'Please seat near the dance floor'
                },
                {
                    eventId: event.id,
                    name: 'David Brown',
                    phoneNumber: '+1234567894',
                    dietaryRestrictions: [],
                    additionalGuestCount: 2,
                    relationshipType: types_1.RelationshipType.SIBLING,
                    brideOrGroomSide: 'bride',
                    specialRequests: ''
                }
            ];
            const createdGuests = [];
            for (const guestData of sampleGuests) {
                const guest = await this.guestRepo.create(guestData);
                createdGuests.push(guest);
            }
            logger_1.logger.info(`Created ${createdGuests.length} sample guests`);
            // Create sample venue elements
            const venueElements = [
                {
                    eventId: event.id,
                    type: 'stage',
                    name: 'Main Stage',
                    position: { x: 200, y: 50 },
                    dimensions: { width: 150, height: 100 },
                    color: '#8B4513'
                },
                {
                    eventId: event.id,
                    type: 'dance_floor',
                    name: 'Dance Floor',
                    position: { x: 180, y: 200 },
                    dimensions: { width: 190, height: 150 },
                    color: '#FFD700'
                },
                {
                    eventId: event.id,
                    type: 'bar',
                    name: 'Main Bar',
                    position: { x: 50, y: 50 },
                    dimensions: { width: 100, height: 50 },
                    color: '#4169E1'
                },
                {
                    eventId: event.id,
                    type: 'entrance',
                    name: 'Main Entrance',
                    position: { x: 250, y: 450 },
                    dimensions: { width: 80, height: 30 },
                    color: '#32CD32'
                }
            ];
            for (const elementData of venueElements) {
                await this.venueRepo.create(elementData);
            }
            logger_1.logger.info(`Created ${venueElements.length} venue elements`);
            // Create sample tables
            const tables = [
                {
                    eventId: event.id,
                    name: 'Table 1 - Family',
                    capacity: 8,
                    position: { x: 100, y: 300 }
                },
                {
                    eventId: event.id,
                    name: 'Table 2 - Friends',
                    capacity: 6,
                    position: { x: 300, y: 300 }
                },
                {
                    eventId: event.id,
                    name: 'Table 3 - Colleagues',
                    capacity: 8,
                    position: { x: 450, y: 300 }
                },
                {
                    eventId: event.id,
                    name: 'Table 4 - Extended Family',
                    capacity: 10,
                    position: { x: 100, y: 400 }
                }
            ];
            const createdTables = [];
            for (const tableData of tables) {
                const table = await this.tableRepo.create(tableData);
                createdTables.push(table);
            }
            logger_1.logger.info(`Created ${createdTables.length} sample tables`);
            // Assign some guests to tables
            if (createdGuests.length > 0 && createdTables.length > 0) {
                await this.guestRepo.assignToTable(createdGuests[0].id, createdTables[0].id);
                await this.guestRepo.assignToTable(createdGuests[1].id, createdTables[1].id);
                await this.guestRepo.assignToTable(createdGuests[2].id, createdTables[2].id);
                logger_1.logger.info('Assigned sample guests to tables');
            }
            logger_1.logger.info('Database seeding completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Database seeding failed:', error);
            throw error;
        }
    }
    async clearSampleData() {
        try {
            logger_1.logger.info('Clearing sample data...');
            // This will cascade delete all related data
            const events = await this.eventRepo.findByOrganizerId('sample-organizer-id');
            for (const event of events) {
                await this.eventRepo.delete(event.id);
            }
            logger_1.logger.info('Sample data cleared successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to clear sample data:', error);
            throw error;
        }
    }
}
exports.DatabaseSeeder = DatabaseSeeder;
//# sourceMappingURL=index.js.map