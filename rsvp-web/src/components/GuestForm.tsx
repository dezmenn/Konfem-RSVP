import React, { useState, useEffect } from 'react';
import { Guest, RelationshipType } from '../types';
import './GuestForm.css';

interface GuestFormProps {
  eventId: string;
  guest?: Guest | null;
  onSave: (guest: Guest) => void;
  onCancel: () => void;
}

interface GuestFormData {
  name: string;
  phoneNumber: string;
  dietaryRestrictions: string[];
  additionalGuestCount: number;
  relationshipType: RelationshipType;
  brideOrGroomSide: 'bride' | 'groom';
  rsvpStatus: 'not_invited' | 'pending' | 'accepted' | 'declined' | 'no_response';
  specialRequests: string;
}

const GuestForm: React.FC<GuestFormProps> = ({
  eventId,
  guest,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    phoneNumber: '',
    dietaryRestrictions: [],
    additionalGuestCount: 0,
    relationshipType: RelationshipType.FRIEND,
    brideOrGroomSide: 'bride',
    rsvpStatus: 'not_invited',
    specialRequests: ''
  });

  const [dietaryInput, setDietaryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        phoneNumber: guest.phoneNumber,
        dietaryRestrictions: [...guest.dietaryRestrictions],
        additionalGuestCount: guest.additionalGuestCount,
        relationshipType: guest.relationshipType,
        brideOrGroomSide: guest.brideOrGroomSide,
        rsvpStatus: guest.rsvpStatus,
        specialRequests: guest.specialRequests
      });
    }
  }, [guest]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (formData.additionalGuestCount < 0) {
      newErrors.additionalGuestCount = 'Additional guest count cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GuestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addDietaryRestriction = () => {
    if (dietaryInput.trim() && !formData.dietaryRestrictions.includes(dietaryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, dietaryInput.trim()]
      }));
      setDietaryInput('');
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const url = guest ? `/api/guests/${guest.id}` : '/api/guests';
      const method = guest ? 'PUT' : 'POST';
      
      const payload = guest 
        ? formData // For updates, send only the form data
        : { ...formData, eventId }; // For creation, include eventId

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.data);
      } else {
        if (data.errors) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((error: string) => {
            if (error.includes('Name')) errorMap.name = error;
            else if (error.includes('Phone')) errorMap.phoneNumber = error;
            else if (error.includes('Additional guest')) errorMap.additionalGuestCount = error;
            else errorMap.general = error;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: 'Failed to save guest' });
        }
      }
    } catch (error) {
      console.error('Error saving guest:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-form-overlay">
      <div className="guest-form-container">
        <div className="guest-form-header">
          <h2>{guest ? 'Edit Guest' : 'Add New Guest'}</h2>
          <button onClick={onCancel} className="close-button" aria-label="Close form">×</button>
        </div>

        <form onSubmit={handleSubmit} className="guest-form">
          {errors.general && (
            <div className="error-message" role="alert">{errors.general}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
                placeholder="Enter guest name"
                required
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="field-error" role="alert">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={errors.phoneNumber ? 'error' : ''}
                placeholder="+1234567890"
                required
                aria-required="true"
                aria-invalid={!!errors.phoneNumber}
                aria-describedby={errors.phoneNumber ? 'phone-error' : undefined}
              />
              {errors.phoneNumber && <span id="phone-error" className="field-error" role="alert">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="relationshipType">Relationship</label>
              <select
                id="relationshipType"
                value={formData.relationshipType}
                onChange={(e) => handleInputChange('relationshipType', e.target.value as RelationshipType)}
              >
                {Object.values(RelationshipType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="brideOrGroomSide">Side</label>
              <select
                id="brideOrGroomSide"
                value={formData.brideOrGroomSide}
                onChange={(e) => handleInputChange('brideOrGroomSide', e.target.value as 'bride' | 'groom')}
              >
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rsvpStatus">RSVP Status</label>
              <select
                id="rsvpStatus"
                value={formData.rsvpStatus}
                onChange={(e) => handleInputChange('rsvpStatus', e.target.value)}
              >
                <option value="not_invited">Not Invited</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="no_response">No Response</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="additionalGuestCount">Additional Guests</label>
              <input
                type="number"
                id="additionalGuestCount"
                min="0"
                value={formData.additionalGuestCount}
                onChange={(e) => handleInputChange('additionalGuestCount', parseInt(e.target.value) || 0)}
                className={errors.additionalGuestCount ? 'error' : ''}
                aria-invalid={!!errors.additionalGuestCount}
                aria-describedby={errors.additionalGuestCount ? 'guest-count-error' : undefined}
              />
              {errors.additionalGuestCount && <span id="guest-count-error" className="field-error" role="alert">{errors.additionalGuestCount}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dietary-input">Dietary Restrictions</label>
            <div className="dietary-input-container">
              <input
                type="text"
                id="dietary-input"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                placeholder="Add dietary restriction"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietaryRestriction())}
              />
              <button type="button" onClick={addDietaryRestriction} className="add-button">
                Add
              </button>
            </div>
            {formData.dietaryRestrictions.length > 0 && (
              <div className="dietary-tags">
                {formData.dietaryRestrictions.map((restriction, index) => (
                  <span key={index} className="dietary-tag">
                    {restriction}
                    <button
                      type="button"
                      onClick={() => removeDietaryRestriction(restriction)}
                      className="remove-tag"
                      aria-label={`Remove ${restriction}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="specialRequests">Special Requests</label>
            <textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : (guest ? 'Update Guest' : 'Add Guest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestForm;