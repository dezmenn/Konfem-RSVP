import { Event } from '../../../shared/src/types';
import { DemoDataService } from './DemoDataService';
import { logger } from '../utils/logger';

export class MockEventService {
  private demoDataService: DemoDataService;

  constructor() {
    this.demoDataService = DemoDataService.getInstance();
  }

  async findById(eventId: string): Promise<Event | null> {
    try {
      const eventData = this.demoDataService.getEvent(eventId);
      if (!eventData) {
        return null;
      }

      // For demo purposes, always use current date + 3 days for event date
      // and current date + 2 days for RSVP deadline to ensure it's in the future
      const now = new Date();
      const eventDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
      const rsvpDeadline = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now

      // Convert demo data to Event interface with dynamic dates
      const event: Event = {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || '',
        date: eventDate,
        location: eventData.location,
        rsvpDeadline: rsvpDeadline,
        organizerId: eventData.organizerId || 'demo-organizer-1',
        publicRSVPEnabled: eventData.publicRSVPEnabled || false,
        publicRSVPLink: eventData.publicRSVPLink || '',
        createdAt: new Date(eventData.createdAt || '2024-01-01T00:00:00Z'),
        updatedAt: new Date(eventData.updatedAt || '2024-01-01T00:00:00Z')
      };

      return event;
    } catch (error) {
      logger.error('Error finding event by ID:', error);
      return null;
    }
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    try {
      const eventData = this.demoDataService.getEvent('demo-event-1');
      if (!eventData || eventData.organizerId !== organizerId) {
        return [];
      }

      const event = await this.findById('demo-event-1');
      return event ? [event] : [];
    } catch (error) {
      logger.error('Error finding events by organizer ID:', error);
      return [];
    }
  }

  async findUpcomingEvents(organizerId?: string): Promise<Event[]> {
    try {
      const event = await this.findById('demo-event-1');
      if (!event) {
        return [];
      }

      // Check if event is upcoming
      if (event.date > new Date()) {
        if (!organizerId || event.organizerId === organizerId) {
          return [event];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error finding upcoming events:', error);
      return [];
    }
  }

  async findPastEvents(organizerId?: string): Promise<Event[]> {
    try {
      const event = await this.findById('demo-event-1');
      if (!event) {
        return [];
      }

      // Check if event is past
      if (event.date <= new Date()) {
        if (!organizerId || event.organizerId === organizerId) {
          return [event];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error finding past events:', error);
      return [];
    }
  }

  async findAll(): Promise<Event[]> {
    try {
      const event = await this.findById('demo-event-1');
      return event ? [event] : [];
    } catch (error) {
      logger.error('Error finding all events:', error);
      return [];
    }
  }

  async isRSVPDeadlinePassed(eventId: string): Promise<boolean> {
    try {
      const event = await this.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      return event.rsvpDeadline <= new Date();
    } catch (error) {
      logger.error('Error checking RSVP deadline:', error);
      throw error;
    }
  }

  // Mock methods for compatibility
  async create(eventData: any): Promise<Event> {
    throw new Error('Create operation not supported in demo mode');
  }

  async update(id: string, updates: any): Promise<Event | null> {
    throw new Error('Update operation not supported in demo mode');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('Delete operation not supported in demo mode');
  }

  async enablePublicRSVP(eventId: string): Promise<Event | null> {
    throw new Error('Enable public RSVP operation not supported in demo mode');
  }

  async disablePublicRSVP(eventId: string): Promise<Event | null> {
    throw new Error('Disable public RSVP operation not supported in demo mode');
  }
}