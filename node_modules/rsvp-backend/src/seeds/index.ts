import { EventRepository, GuestRepository, TableRepository, VenueElementRepository } from '../repositories';
import { RelationshipType } from '../../../shared/src/types';
import { logger } from '../utils/logger';

export class DatabaseSeeder {
  private eventRepo: EventRepository;
  private guestRepo: GuestRepository;
  private tableRepo: TableRepository;
  private venueRepo: VenueElementRepository;

  constructor() {
    this.eventRepo = new EventRepository();
    this.guestRepo = new GuestRepository();
    this.tableRepo = new TableRepository();
    this.venueRepo = new VenueElementRepository();
  }

  async seedSampleData(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

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

      logger.info(`Created sample event: ${event.id}`);

      // Create sample guests
      const sampleGuests = [
        {
          eventId: event.id,
          name: 'Michael Johnson',
          phoneNumber: '+1234567890',
          dietaryRestrictions: ['Vegetarian'],
          additionalGuestCount: 1,
          relationshipType: RelationshipType.UNCLE,
          brideOrGroomSide: 'bride' as const,
          specialRequests: 'Wheelchair accessible seating please'
        },
        {
          eventId: event.id,
          name: 'Emily Davis',
          phoneNumber: '+1234567891',
          dietaryRestrictions: ['Gluten-free'],
          additionalGuestCount: 0,
          relationshipType: RelationshipType.FRIEND,
          brideOrGroomSide: 'bride' as const,
          specialRequests: ''
        },
        {
          eventId: event.id,
          name: 'Robert Wilson',
          phoneNumber: '+1234567892',
          dietaryRestrictions: [],
          additionalGuestCount: 1,
          relationshipType: RelationshipType.COLLEAGUE,
          brideOrGroomSide: 'groom' as const,
          specialRequests: ''
        },
        {
          eventId: event.id,
          name: 'Lisa Anderson',
          phoneNumber: '+1234567893',
          dietaryRestrictions: ['Vegan'],
          additionalGuestCount: 0,
          relationshipType: RelationshipType.COUSIN,
          brideOrGroomSide: 'groom' as const,
          specialRequests: 'Please seat near the dance floor'
        },
        {
          eventId: event.id,
          name: 'David Brown',
          phoneNumber: '+1234567894',
          dietaryRestrictions: [],
          additionalGuestCount: 2,
          relationshipType: RelationshipType.SIBLING,
          brideOrGroomSide: 'bride' as const,
          specialRequests: ''
        }
      ];

      const createdGuests = [];
      for (const guestData of sampleGuests) {
        const guest = await this.guestRepo.create(guestData);
        createdGuests.push(guest);
      }

      logger.info(`Created ${createdGuests.length} sample guests`);

      // Create sample venue elements
      const venueElements = [
        {
          eventId: event.id,
          type: 'stage' as const,
          name: 'Main Stage',
          position: { x: 200, y: 50 },
          dimensions: { width: 150, height: 100 },
          color: '#8B4513'
        },
        {
          eventId: event.id,
          type: 'dance_floor' as const,
          name: 'Dance Floor',
          position: { x: 180, y: 200 },
          dimensions: { width: 190, height: 150 },
          color: '#FFD700'
        },
        {
          eventId: event.id,
          type: 'bar' as const,
          name: 'Main Bar',
          position: { x: 50, y: 50 },
          dimensions: { width: 100, height: 50 },
          color: '#4169E1'
        },
        {
          eventId: event.id,
          type: 'entrance' as const,
          name: 'Main Entrance',
          position: { x: 250, y: 450 },
          dimensions: { width: 80, height: 30 },
          color: '#32CD32'
        }
      ];

      for (const elementData of venueElements) {
        await this.venueRepo.create(elementData);
      }

      logger.info(`Created ${venueElements.length} venue elements`);

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

      logger.info(`Created ${createdTables.length} sample tables`);

      // Assign some guests to tables
      if (createdGuests.length > 0 && createdTables.length > 0) {
        await this.guestRepo.assignToTable(createdGuests[0].id, createdTables[0].id);
        await this.guestRepo.assignToTable(createdGuests[1].id, createdTables[1].id);
        await this.guestRepo.assignToTable(createdGuests[2].id, createdTables[2].id);
        
        logger.info('Assigned sample guests to tables');
      }

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async clearSampleData(): Promise<void> {
    try {
      logger.info('Clearing sample data...');
      
      // This will cascade delete all related data
      const events = await this.eventRepo.findByOrganizerId('sample-organizer-id');
      for (const event of events) {
        await this.eventRepo.delete(event.id);
      }
      
      logger.info('Sample data cleared successfully');
    } catch (error) {
      logger.error('Failed to clear sample data:', error);
      throw error;
    }
  }
}