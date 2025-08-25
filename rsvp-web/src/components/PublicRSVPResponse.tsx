import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvitationDisplay } from './InvitationDisplay';
import './PublicRSVPResponse.css';

interface RSVPToken {
  id: string;
  eventId: string;
  guestId: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
}

interface Guest {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dietaryRestrictions?: string;
  additionalGuests: number;
  relationship: string;
  side: 'bride' | 'groom';
  rsvpStatus: 'pending' | 'accepted' | 'declined' | 'no_response';
}

interface RSVPResponse {
  id: string;
  guestId: string;
  eventId: string;
  status: 'accepted' | 'declined';
  mealPreference?: string;
  dietaryRestrictions?: string;
  additionalGuests: number;
  specialRequests?: string;
  respondedAt: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  rsvpDeadline: string;
}

const PublicRSVPResponse: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpToken, setRsvpToken] = useState<RSVPToken | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [existingResponse, setExistingResponse] = useState<RSVPResponse | null>(null);
  
  // Form state
  const [status, setStatus] = useState<'accepted' | 'declined'>('accepted');
  const [mealPreference, setMealPreference] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchRSVPData();
    }
  }, [token]);

  // Cleanup function to clear form cache when leaving the page
  useEffect(() => {
    return () => {
      // Clear all form state when component unmounts
      clearFormCache();
    };
  }, []);

  const clearFormCache = () => {
    // Reset all form state to initial values
    setStatus('accepted');
    setMealPreference('');
    setDietaryRestrictions('');
    setAdditionalGuests(0);
    setSpecialRequests('');
    setError(null);
    setExistingResponse(null);
    setRsvpToken(null);
    setGuest(null);
    setEvent(null);
  };

  const fetchRSVPData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch RSVP token details
      const tokenResponse = await fetch(`http://localhost:5000/api/rsvp/token/${token}`);
      if (!tokenResponse.ok) {
        throw new Error('Invalid or expired RSVP link');
      }
      const tokenData = await tokenResponse.json();
      setRsvpToken(tokenData.data);

      // Fetch guest details
      const guestResponse = await fetch(`http://localhost:5000/api/guests/${tokenData.data.guestId}`);
      if (!guestResponse.ok) {
        throw new Error('Guest not found');
      }
      const guestData = await guestResponse.json();
      setGuest(guestData.data);

      // Fetch event details
      const eventResponse = await fetch(`http://localhost:5000/api/rsvp/events/${tokenData.data.eventId}`);
      if (!eventResponse.ok) {
        throw new Error('Event not found');
      }
      const eventData = await eventResponse.json();
      setEvent(eventData.data);

      // Check for existing response
      try {
        const responseResponse = await fetch(`http://localhost:5000/api/rsvp/responses/guest/${tokenData.data.guestId}/event/${tokenData.data.eventId}`);
        if (responseResponse.ok) {
          const responseData = await responseResponse.json();
          setExistingResponse(responseData.data);
          
          // Pre-fill form with existing response
          setStatus(responseData.data.status);
          setMealPreference(responseData.data.mealPreference || '');
          setDietaryRestrictions(responseData.data.dietaryRestrictions || '');
          setAdditionalGuests(responseData.data.additionalGuests || 0);
          setSpecialRequests(responseData.data.specialRequests || '');
        }
      } catch (err) {
        // No existing response, that's fine
      }

      // Pre-fill dietary restrictions from guest profile
      if (guestData.data.dietaryRestrictions && !existingResponse) {
        setDietaryRestrictions(guestData.data.dietaryRestrictions);
      }
      
      // Pre-fill additional guests from guest profile
      if (guestData.data.additionalGuests && !existingResponse) {
        setAdditionalGuests(guestData.data.additionalGuests);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RSVP details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rsvpToken || !guest || !event) return;

    try {
      setSubmitting(true);
      setError(null);

      const responseData = {
        guestId: guest.id,
        eventId: event.id,
        status,
        mealPreference: status === 'accepted' ? mealPreference : undefined,
        dietaryRestrictions: status === 'accepted' ? dietaryRestrictions : undefined,
        additionalGuests: status === 'accepted' ? additionalGuests : 0,
        specialRequests: status === 'accepted' ? specialRequests : undefined
      };

      const method = existingResponse ? 'PUT' : 'POST';
      const url = existingResponse 
        ? `http://localhost:5000/api/rsvp/responses/${existingResponse.id}`
        : 'http://localhost:5000/api/rsvp/responses';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RSVP response');
      }

      // Navigate to confirmation page
      navigate(`/rsvp/confirmation/${token}`, { 
        state: { 
          status, 
          guestName: guest.name, 
          eventName: event.name,
          isUpdate: !!existingResponse
        } 
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rsvp-response-container">
        <div className="loading">Loading RSVP details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rsvp-response-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!guest || !event || !rsvpToken) {
    return (
      <div className="rsvp-response-container">
        <div className="error-message">
          <h2>RSVP Not Found</h2>
          <p>This RSVP link is invalid or has expired.</p>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  // Check if RSVP deadline has passed
  const isExpired = new Date() > new Date(event.rsvpDeadline);

  if (isExpired && !existingResponse) {
    return (
      <div className="rsvp-response-container">
        <div className="expired-message">
          <h2>RSVP Deadline Passed</h2>
          <p>The RSVP deadline for {event.name} has passed.</p>
          <p>Please contact the event organizer directly if you need to respond.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rsvp-response-container">
      {/* Display the beautiful invitation template */}
      <InvitationDisplay
        eventId={event.id}
        guestName={guest.name}
        eventTitle={event.name}
        eventDate={new Date(event.date).toLocaleDateString()}
        eventTime={event.time}
        eventLocation={event.location}
        rsvpDeadline={new Date(event.rsvpDeadline).toLocaleDateString()}
        className="invitation-section"
      />
      
      <div className="rsvp-response-card">
        <div className="guest-info">
          <h2>Hello, {guest.name}!</h2>
          <p>Please respond to your invitation below:</p>
          {existingResponse && (
            <div className="existing-response-notice">
              <p>You have already responded to this invitation. You can update your response below.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rsvp-form">
          <div className="form-group">
            <label className="form-label">Will you be attending?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="accepted"
                  checked={status === 'accepted'}
                  onChange={(e) => setStatus(e.target.value as 'accepted' | 'declined')}
                />
                Yes, I'll be there!
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="declined"
                  checked={status === 'declined'}
                  onChange={(e) => setStatus(e.target.value as 'accepted' | 'declined')}
                />
                Sorry, I can't make it
              </label>
            </div>
          </div>

          {status === 'accepted' && (
            <>
              <div className="form-group">
                <label htmlFor="mealPreference" className="form-label">
                  Meal Preference
                </label>
                <select
                  id="mealPreference"
                  value={mealPreference}
                  onChange={(e) => setMealPreference(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select meal preference</option>
                  <option value="chicken">Chicken</option>
                  <option value="beef">Beef</option>
                  <option value="fish">Fish</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dietaryRestrictions" className="form-label">
                  Dietary Restrictions or Allergies
                </label>
                <textarea
                  id="dietaryRestrictions"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  className="form-textarea"
                  placeholder="Please let us know about any dietary restrictions or allergies..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="additionalGuests" className="form-label">
                  Number of Additional Guests
                </label>
                <input
                  type="number"
                  id="additionalGuests"
                  value={additionalGuests}
                  onChange={(e) => setAdditionalGuests(parseInt(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                  max="5"
                />
                <small className="form-help">Including yourself, how many people will attend?</small>
              </div>

              <div className="form-group">
                <label htmlFor="specialRequests" className="form-label">
                  Special Requests or Comments
                </label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="form-textarea"
                  placeholder="Any special requests or comments for the event organizer..."
                  rows={3}
                />
              </div>
            </>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Submitting...' : existingResponse ? 'Update RSVP' : 'Submit RSVP'}
            </button>
          </div>
        </form>

        <div className="rsvp-deadline">
          <p><strong>RSVP Deadline:</strong> {new Date(event.rsvpDeadline).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicRSVPResponse;