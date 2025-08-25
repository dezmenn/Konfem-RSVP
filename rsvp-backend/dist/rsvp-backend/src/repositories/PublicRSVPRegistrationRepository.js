"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRSVPRegistrationRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PublicRSVPRegistrationRepository extends BaseRepository_1.BaseRepository {
    async create(registrationData) {
        const query = `
      INSERT INTO public_rsvp_registrations (
        event_id, name, phone_number, relationship_type, bride_or_groom_side,
        attendance_status, meal_preferences, special_requests, 
        additional_guest_count, additional_guest_details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const values = [
            registrationData.eventId,
            registrationData.name,
            registrationData.phoneNumber,
            registrationData.relationshipType,
            registrationData.brideOrGroomSide,
            registrationData.attendanceStatus,
            JSON.stringify(registrationData.mealPreferences || []),
            registrationData.specialRequests,
            registrationData.additionalGuestCount,
            JSON.stringify(registrationData.additionalGuestDetails || [])
        ];
        const result = await this.query(query, values);
        return this.mapRowToPublicRSVPRegistration(result[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM public_rsvp_registrations WHERE id = $1';
        const result = await this.query(query, [id]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToPublicRSVPRegistration(result[0]);
    }
    async findByEventId(eventId) {
        const query = 'SELECT * FROM public_rsvp_registrations WHERE event_id = $1 ORDER BY submitted_at DESC';
        const result = await this.query(query, [eventId]);
        return result.map(row => this.mapRowToPublicRSVPRegistration(row));
    }
    async findByPhoneNumber(eventId, phoneNumber) {
        const query = 'SELECT * FROM public_rsvp_registrations WHERE event_id = $1 AND phone_number = $2 LIMIT 1';
        const result = await this.query(query, [eventId, phoneNumber]);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToPublicRSVPRegistration(result[0]);
    }
    async update(id, updates) {
        const updateFields = [];
        const values = [];
        let paramCount = 1;
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                const dbField = this.camelToSnakeCase(key);
                if (key === 'mealPreferences' || key === 'additionalGuestDetails') {
                    updateFields.push(`${dbField} = $${paramCount}`);
                    values.push(JSON.stringify(value));
                }
                else {
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
      UPDATE public_rsvp_registrations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await this.query(query, values);
        if (result.length === 0) {
            return null;
        }
        return this.mapRowToPublicRSVPRegistration(result[0]);
    }
    async delete(id) {
        const query = 'DELETE FROM public_rsvp_registrations WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
    async getEventStatistics(eventId) {
        const query = `
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN attendance_status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN attendance_status = 'declined' THEN 1 ELSE 0 END) as declined_count,
        SUM(CASE WHEN attendance_status = 'accepted' THEN 1 + additional_guest_count ELSE 0 END) as total_attendees,
        SUM(CASE WHEN bride_or_groom_side = 'bride' THEN 1 ELSE 0 END) as bride_guest_count,
        SUM(CASE WHEN bride_or_groom_side = 'groom' THEN 1 ELSE 0 END) as groom_guest_count,
        jsonb_agg(relationship_type) as all_relationship_types,
        jsonb_agg(meal_preferences) as all_meal_preferences
      FROM public_rsvp_registrations 
      WHERE event_id = $1
    `;
        const result = await this.query(query, [eventId]);
        const row = result[0];
        // Process relationship types
        const relationshipTypeCounts = {};
        if (row.all_relationship_types) {
            row.all_relationship_types.forEach((type) => {
                if (type) {
                    relationshipTypeCounts[type] = (relationshipTypeCounts[type] || 0) + 1;
                }
            });
        }
        // Process meal preferences
        const mealPreferenceCounts = {};
        if (row.all_meal_preferences) {
            const allPreferences = row.all_meal_preferences.flat();
            allPreferences.forEach((pref) => {
                if (pref) {
                    mealPreferenceCounts[pref] = (mealPreferenceCounts[pref] || 0) + 1;
                }
            });
        }
        return {
            totalRegistrations: parseInt(row.total_registrations) || 0,
            acceptedCount: parseInt(row.accepted_count) || 0,
            declinedCount: parseInt(row.declined_count) || 0,
            totalAttendees: parseInt(row.total_attendees) || 0,
            brideGuestCount: parseInt(row.bride_guest_count) || 0,
            groomGuestCount: parseInt(row.groom_guest_count) || 0,
            relationshipTypeCounts,
            mealPreferenceCounts
        };
    }
    mapRowToPublicRSVPRegistration(row) {
        return {
            id: row.id,
            eventId: row.event_id,
            name: row.name,
            phoneNumber: row.phone_number,
            relationshipType: row.relationship_type,
            brideOrGroomSide: row.bride_or_groom_side,
            attendanceStatus: row.attendance_status,
            mealPreferences: row.meal_preferences ? JSON.parse(row.meal_preferences) : [],
            specialRequests: row.special_requests,
            additionalGuestCount: row.additional_guest_count,
            additionalGuestDetails: row.additional_guest_details ? JSON.parse(row.additional_guest_details) : [],
            submittedAt: row.submitted_at
        };
    }
    camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.PublicRSVPRegistrationRepository = PublicRSVPRegistrationRepository;
//# sourceMappingURL=PublicRSVPRegistrationRepository.js.map