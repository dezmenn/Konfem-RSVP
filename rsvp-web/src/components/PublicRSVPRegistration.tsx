import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvitationDisplay } from './InvitationDisplay';
import './PublicRSVPRegistration.css';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  rsvpDeadline: string;
}

interface ExistingGuest {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dietaryRestrictions?: string[];
  additionalGuestCount: number;
  relationshipType: string;
  brideOrGroomSide: 'bride' | 'groom';
  rsvpStatus: 'pending' | 'accepted' | 'declined' | 'no_response';
  specialRequests?: string;
  mealPreference?: string;
  isPublicRegistration?: boolean;
}

const PublicRSVPRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Phone lookup state
  const [phoneCheckStep, setPhoneCheckStep] = useState(true);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [existingGuest, setExistingGuest] = useState<ExistingGuest | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [side, setSide] = useState<'bride' | 'groom'>('bride');
  const [status, setStatus] = useState<'accepted' | 'declined'>('accepted');
  const [mealPreference, setMealPreference] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Cleanup function to clear form cache when leaving the page
  useEffect(() => {
    return () => {
      // Clear all form state when component unmounts
      clearFormCache();
    };
  }, []);

  // Also clear cache when user navigates back to phone check step
  useEffect(() => {
    if (phoneCheckStep) {
      clearFormData();
    }
  }, [phoneCheckStep]);

  const clearFormCache = () => {
    // Reset all form state to initial values
    setPhoneNumber('');
    setName('');
    setEmail('');
    setRelationship('');
    setSide('bride');
    setStatus('accepted');
    setMealPreference('');
    setDietaryRestrictions('');
    setAdditionalGuests(0);
    setSpecialRequests('');
    setExistingGuest(null);
    setIsEditMode(false);
    setError(null);
  };

  const clearFormData = () => {
    // Clear form data but keep phone number for the check step
    setName('');
    setEmail('');
    setRelationship('');
    setSide('bride');
    setStatus('accepted');
    setMealPreference('');
    setDietaryRestrictions('');
    setAdditionalGuests(0);
    setSpecialRequests('');
    setExistingGuest(null);
    setIsEditMode(false);
    setError(null);
  };

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/rsvp/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      const data = await response.json();
      setEvent(data.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setCheckingPhone(true);
      setError(null);

      // Search for existing guest by phone number
      const response = await fetch(`http://localhost:5000/api/guests/${eventId}/search?search=${encodeURIComponent(phoneNumber.trim())}`);
      if (!response.ok) {
        throw new Error('Failed to check phone number');
      }
      
      const data = await response.json();
      const matchingGuest = data.data.find((guest: ExistingGuest) => 
        guest.phoneNumber === phoneNumber.trim()
      );

      if (matchingGuest) {
        // Existing guest found - switch to edit mode
        setExistingGuest(matchingGuest);
        setIsEditMode(true);
        
        // Pre-fill form with existing data
        setName(matchingGuest.name);
        setEmail(matchingGuest.email || '');
        setRelationship(matchingGuest.relationshipType);
        setSide(matchingGuest.brideOrGroomSide);
        setStatus(matchingGuest.rsvpStatus === 'accepted' ? 'accepted' : 
                 matchingGuest.rsvpStatus === 'declined' ? 'declined' : 'accepted');
        setMealPreference(matchingGuest.mealPreference || '');
        setDietaryRestrictions(Array.isArray(matchingGuest.dietaryRestrictions) 
          ? matchingGuest.dietaryRestrictions.join(', ') 
          : matchingGuest.dietaryRestrictions || '');
        setAdditionalGuests(matchingGuest.additionalGuestCount || 0);
        setSpecialRequests(matchingGuest.specialRequests || '');
        
        setPhoneCheckStep(false);
      } else {
        // New guest - switch to registration mode
        setExistingGuest(null);
        setIsEditMode(false);
        setPhoneCheckStep(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check phone number');
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!relationship.trim()) {
      setError('Relationship is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditMode && existingGuest) {
        // Update existing guest
        const updateData = {
          name: name.trim(),
          email: email.trim() || undefined,
          relationshipType: relationship.trim(),
          brideOrGroomSide: side,
          rsvpStatus: status,
          mealPreference: status === 'accepted' ? mealPreference : undefined,
          dietaryRestrictions: status === 'accepted' ? dietaryRestrictions.split(',').map(s => s.trim()).filter(s => s) : [],
          additionalGuestCount: status === 'accepted' ? additionalGuests : 0,
          specialRequests: status === 'accepted' ? specialRequests : undefined
        };

        const response = await fetch(`http://localhost:5000/api/guests/${existingGuest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update RSVP');
        }

        // Navigate to confirmation page
        navigate(`/public/confirmation/${eventId}`, { 
          state: { 
            status, 
            guestName: name,
            eventName: event.name,
            isUpdate: true,
            guestId: existingGuest.id
          } 
        });

      } else {
        // Create new registration
        const registrationData = {
          eventId: event.id,
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          relationship: relationship.trim(),
          side,
          status,
          mealPreference: status === 'accepted' ? mealPreference : undefined,
          dietaryRestrictions: status === 'accepted' ? dietaryRestrictions : undefined,
          additionalGuests: status === 'accepted' ? additionalGuests : 0,
          specialRequests: status === 'accepted' ? specialRequests : undefined
        };

        const response = await fetch('http://localhost:5000/api/rsvp/public-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit registration');
        }

        const result = await response.json();

        // Navigate to confirmation page
        navigate(`/public/confirmation/${eventId}`, { 
          state: { 
            status, 
            guestName: name,
            eventName: event.name,
            registrationId: result.data.id
          } 
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-registration-container">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="public-registration-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="public-registration-container">
        <div className="error-message">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or is no longer available.</p>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  // Check if RSVP deadline has passed
  const isExpired = new Date() > new Date(event.rsvpDeadline);

  if (isExpired) {
    return (
      <div className="public-registration-container">
        <div className="expired-message">
          <h2>RSVP Deadline Passed</h2>
          <p>The RSVP deadline for {event.name} has passed.</p>
          <p>Please contact the event organizer directly if you need to respond.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-registration-container">
      <div className="registration-card">

        {phoneCheckStep ? (
          <div className="phone-check-section">
            <div className="registration-info">
              <h2>RSVP to this Event</h2>
              <p>First, let's check if you're already on our guest list.</p>
            </div>

            <form onSubmit={handlePhoneCheck} className="phone-check-form">
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label required">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-input"
                  required
                  placeholder="60123456789"
                  disabled={checkingPhone}
                />
                <small className="form-help">
                  We'll check if this number is already in our guest list
                </small>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={checkingPhone}
                  className="submit-button"
                >
                  {checkingPhone ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Display the beautiful invitation template after phone check */}
            <InvitationDisplay
              eventId={event.id}
              guestName={isEditMode ? existingGuest?.name || name : name || "Guest"}
              eventTitle={event.name}
              eventDate={new Date(event.date).toLocaleDateString()}
              eventTime={event.time}
              eventLocation={event.location}
              rsvpDeadline={new Date(event.rsvpDeadline).toLocaleDateString()}
              className="invitation-section"
            />
            
            <div className="rsvp-form-section">
              <div className="registration-info">
              {isEditMode ? (
                <>
                  <h2>Welcome back, {existingGuest?.name}!</h2>
                  <p>We found your information. You can update your RSVP details below.</p>
                  <div className="existing-guest-notice">
                    <p><strong>Current Status:</strong> {existingGuest?.rsvpStatus}</p>
                    <p><strong>Phone:</strong> {phoneNumber}</p>
                  </div>
                </>
              ) : (
                <>
                  <h2>New Guest Registration</h2>
                  <p>We didn't find your phone number in our guest list. Please fill out the form below to register.</p>
                  <div className="new-guest-notice">
                    <p><strong>Phone:</strong> {phoneNumber}</p>
                  </div>
                </>
              )}
              
              <button 
                onClick={() => setPhoneCheckStep(true)} 
                className="back-button"
              >
                ← Use Different Phone Number
              </button>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label required">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label required">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
                required
                placeholder="60123456789"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address (Optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="relationship" className="form-label required">
                Relationship
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select relationship</option>
                <option value="Family">Family</option>
                <option value="Friend">Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Classmate">Classmate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Connection</label>
              <div className="radio-group horizontal">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="bride"
                    checked={side === 'bride'}
                    onChange={(e) => setSide(e.target.value as 'bride' | 'groom')}
                  />
                  Bride's Side
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="groom"
                    checked={side === 'groom'}
                    onChange={(e) => setSide(e.target.value as 'bride' | 'groom')}
                  />
                  Groom's Side
                </label>
              </div>
            </div>
          </div>

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
              <div className="form-row">
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
                  <label htmlFor="additionalGuests" className="form-label">
                    Additional Guests
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
                  <small className="form-help">How many additional guests will you bring?</small>
                </div>
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
              {submitting ? 'Submitting...' : isEditMode ? 'Update RSVP' : 'Submit RSVP'}
            </button>
          </div>
        </form>

            <div className="rsvp-deadline">
              <p><strong>RSVP Deadline:</strong> {new Date(event.rsvpDeadline).toLocaleDateString()}</p>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicRSVPRegistration;