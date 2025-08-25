import { BaseRepository } from './BaseRepository';
import { Event } from '../../../shared/src/types';
import { EventInput, EventUpdate } from '../models/Event';

export class EventRepository extends BaseRepository {
  async create(eventData: EventInput): Promise<Event> {
    const query = `
      INSERT INTO events (
        title, description, date, location, rsvp_deadline, 
        organizer_id, public_rsvp_enabled, public_rsvp_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const publicRSVPLink = eventData.publicRSVPEnabled ? 
      `${process.env.BASE_URL || 'http://localhost:3000'}/rsvp/public/temp` : null;

    const values = [
      eventData.title,
      eventData.description || '',
      eventData.date,
      eventData.location,
      eventData.rsvpDeadline,
      eventData.organizerId,
      eventData.publicRSVPEnabled || false,
      publicRSVPLink
    ];

    const result = await this.query(query, values);
    const event = this.mapRowToCamelCase<Event>(result[0]);

    // Update the public RSVP link with the actual event ID
    if (event.publicRSVPEnabled) {
      await this.update(event.id, { 
        publicRSVPLink: `${process.env.BASE_URL || 'http://localhost:3000'}/rsvp/public/${event.id}` 
      });
      event.publicRSVPLink = `${process.env.BASE_URL || 'http://localhost:3000'}/rsvp/public/${event.id}`;
    }

    return event;
  }

  async findById(id: string): Promise<Event | null> {
    const query = 'SELECT * FROM events WHERE id = $1';
    const result = await this.queryOne(query, [id]);
    return result ? this.mapRowToCamelCase<Event>(result) : null;
  }

  async findAll(): Promise<Event[]> {
    const query = 'SELECT * FROM events ORDER BY date DESC';
    const results = await this.query(query);
    return this.mapRowsToCamelCase<Event>(results);
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    const query = 'SELECT * FROM events WHERE organizer_id = $1 ORDER BY date DESC';
    const results = await this.query(query, [organizerId]);
    return this.mapRowsToCamelCase<Event>(results);
  }

  async update(id: string, updates: EventUpdate): Promise<Event | null> {
    const { query, values } = this.buildUpdateQuery('events', updates, `WHERE id = $${Object.keys(updates).length + 1} RETURNING *`);
    values.push(id);

    const result = await this.queryOne(query, values);
    return result ? this.mapRowToCamelCase<Event>(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM events WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async findUpcomingEvents(organizerId?: string): Promise<Event[]> {
    let query = 'SELECT * FROM events WHERE date > CURRENT_TIMESTAMP';
    const values: any[] = [];

    if (organizerId) {
      query += ' AND organizer_id = $1';
      values.push(organizerId);
    }

    query += ' ORDER BY date ASC';

    const results = await this.query(query, values);
    return this.mapRowsToCamelCase<Event>(results);
  }

  async findPastEvents(organizerId?: string): Promise<Event[]> {
    let query = 'SELECT * FROM events WHERE date <= CURRENT_TIMESTAMP';
    const values: any[] = [];

    if (organizerId) {
      query += ' AND organizer_id = $1';
      values.push(organizerId);
    }

    query += ' ORDER BY date DESC';

    const results = await this.query(query, values);
    return this.mapRowsToCamelCase<Event>(results);
  }

  async findEventsWithExpiredRSVP(): Promise<Event[]> {
    const query = `
      SELECT * FROM events 
      WHERE rsvp_deadline <= CURRENT_TIMESTAMP 
      AND date > CURRENT_TIMESTAMP
      ORDER BY date ASC
    `;
    
    const results = await this.query(query);
    return this.mapRowsToCamelCase<Event>(results);
  }

  async isRSVPDeadlinePassed(eventId: string): Promise<boolean> {
    const query = 'SELECT rsvp_deadline FROM events WHERE id = $1';
    const result = await this.queryOne(query, [eventId]);
    
    if (!result) {
      throw new Error('Event not found');
    }

    return new Date(result.rsvp_deadline) <= new Date();
  }

  async enablePublicRSVP(eventId: string): Promise<Event | null> {
    const publicRSVPLink = `${process.env.BASE_URL || 'http://localhost:3000'}/rsvp/public/${eventId}`;
    
    return this.update(eventId, {
      publicRSVPEnabled: true,
      publicRSVPLink
    });
  }

  async disablePublicRSVP(eventId: string): Promise<Event | null> {
    return this.update(eventId, {
      publicRSVPEnabled: false,
      publicRSVPLink: null
    });
  }
}