import { BaseRepository } from './BaseRepository';
import { RSVPResponse, AdditionalGuestDetail } from '../../../shared/src/types';
import { RSVPResponseInput, RSVPResponseUpdate } from '../models/RSVPResponse';

export class RSVPResponseRepository extends BaseRepository {
  async create(responseData: RSVPResponseInput): Promise<RSVPResponse> {
    const query = `
      INSERT INTO rsvp_responses (
        guest_id, event_id, rsvp_token_id, attendance_status, 
        meal_preferences, special_requests, additional_guest_details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      responseData.guestId,
      responseData.eventId,
      responseData.rsvpTokenId,
      responseData.attendanceStatus,
      JSON.stringify(responseData.mealPreferences || []),
      responseData.specialRequests,
      JSON.stringify(responseData.additionalGuestDetails || [])
    ];

    const result = await this.query(query, values);
    return this.mapRowToRSVPResponse(result[0]);
  }

  async findById(id: string): Promise<RSVPResponse | null> {
    const query = 'SELECT * FROM rsvp_responses WHERE id = $1';
    const result = await this.query(query, [id]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPResponse(result[0]);
  }

  async findByGuestId(guestId: string): Promise<RSVPResponse | null> {
    const query = 'SELECT * FROM rsvp_responses WHERE guest_id = $1 ORDER BY submitted_at DESC LIMIT 1';
    const result = await this.query(query, [guestId]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPResponse(result[0]);
  }

  async findByEventId(eventId: string): Promise<RSVPResponse[]> {
    const query = 'SELECT * FROM rsvp_responses WHERE event_id = $1 ORDER BY submitted_at DESC';
    const result = await this.query(query, [eventId]);
    
    return result.map(row => this.mapRowToRSVPResponse(row));
  }

  async findByTokenId(rsvpTokenId: string): Promise<RSVPResponse | null> {
    const query = 'SELECT * FROM rsvp_responses WHERE rsvp_token_id = $1';
    const result = await this.query(query, [rsvpTokenId]);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPResponse(result[0]);
  }

  async update(id: string, updates: RSVPResponseUpdate): Promise<RSVPResponse | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnakeCase(key);
        if (key === 'mealPreferences' || key === 'additionalGuestDetails') {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE rsvp_responses 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.query(query, values);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapRowToRSVPResponse(result[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM rsvp_responses WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async findRecent(limit: number = 10): Promise<RSVPResponse[]> {
    const query = 'SELECT * FROM rsvp_responses ORDER BY submitted_at DESC LIMIT $1';
    const result = await this.query(query, [limit]);
    
    return result.map(row => this.mapRowToRSVPResponse(row));
  }

  async getEventStatistics(eventId: string): Promise<{
    totalResponses: number;
    acceptedCount: number;
    declinedCount: number;
    totalAttendees: number;
    mealPreferenceCounts: Record<string, number>;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_responses,
        SUM(CASE WHEN attendance_status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN attendance_status = 'declined' THEN 1 ELSE 0 END) as declined_count,
        SUM(CASE WHEN attendance_status = 'accepted' THEN 1 + COALESCE(jsonb_array_length(additional_guest_details), 0) ELSE 0 END) as total_attendees,
        jsonb_agg(meal_preferences) as all_meal_preferences
      FROM rsvp_responses 
      WHERE event_id = $1
    `;

    const result = await this.query(query, [eventId]);
    const row = result[0];

    // Process meal preferences
    const mealPreferenceCounts: Record<string, number> = {};
    if (row.all_meal_preferences) {
      const allPreferences = row.all_meal_preferences.flat();
      allPreferences.forEach((pref: string) => {
        if (pref) {
          mealPreferenceCounts[pref] = (mealPreferenceCounts[pref] || 0) + 1;
        }
      });
    }

    return {
      totalResponses: parseInt(row.total_responses) || 0,
      acceptedCount: parseInt(row.accepted_count) || 0,
      declinedCount: parseInt(row.declined_count) || 0,
      totalAttendees: parseInt(row.total_attendees) || 0,
      mealPreferenceCounts
    };
  }

  private mapRowToRSVPResponse(row: any): RSVPResponse {
    return {
      id: row.id,
      guestId: row.guest_id,
      eventId: row.event_id,
      rsvpTokenId: row.rsvp_token_id,
      attendanceStatus: row.attendance_status,
      mealPreferences: row.meal_preferences ? JSON.parse(row.meal_preferences) : [],
      specialRequests: row.special_requests,
      additionalGuestDetails: row.additional_guest_details ? JSON.parse(row.additional_guest_details) : [],
      submittedAt: row.submitted_at,
      createdAt: row.created_at || row.submitted_at
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}