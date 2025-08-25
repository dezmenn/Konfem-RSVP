import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import './RSVPConfirmation.css';

interface LocationState {
  status: 'accepted' | 'declined';
  guestName: string;
  eventName: string;
  isUpdate?: boolean;
  registrationId?: string;
}

const RSVPConfirmation: React.FC = () => {
  const location = useLocation();
  const { token, eventId } = useParams<{ token?: string; eventId?: string }>();
  const state = location.state as LocationState;

  if (!state) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="error-message">
            <h2>Invalid Access</h2>
            <p>This confirmation page cannot be accessed directly.</p>
            <Link to="/" className="home-button">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const { status, guestName, eventName, isUpdate, registrationId } = state;
  const isAccepted = status === 'accepted';
  const isPublicRegistration = !!registrationId;

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className={`confirmation-header ${isAccepted ? 'accepted' : 'declined'}`}>
          <div className="confirmation-icon">
            {isAccepted ? '🎉' : '😔'}
          </div>
          <h1>
            {isAccepted ? 'RSVP Confirmed!' : 'RSVP Received'}
          </h1>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-message">
            <h2>Thank you, {guestName}!</h2>
            
            {isUpdate ? (
              <p>
                Your RSVP response for <strong>{eventName}</strong> has been successfully updated.
              </p>
            ) : (
              <p>
                Your RSVP for <strong>{eventName}</strong> has been successfully {isAccepted ? 'confirmed' : 'received'}.
              </p>
            )}

            {isAccepted ? (
              <div className="accepted-message">
                <p>We're excited to celebrate with you! 🎊</p>
                <div className="next-steps">
                  <h3>What's Next?</h3>
                  <ul>
                    <li>You'll receive a confirmation email shortly</li>
                    <li>Keep an eye out for event updates and reminders</li>
                    <li>If you need to make changes, you can update your RSVP using the same link</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="declined-message">
                <p>We're sorry you can't make it, but we understand.</p>
                <p>Thank you for letting us know. You'll be missed! 💙</p>
              </div>
            )}

            {isPublicRegistration && (
              <div className="registration-notice">
                <p><strong>Registration ID:</strong> {registrationId}</p>
                <p>Your information has been added to the guest list.</p>
              </div>
            )}
          </div>

          <div className="confirmation-actions">
            {token && (
              <Link 
                to={`/rsvp/${token}`} 
                className="update-button"
              >
                Update My RSVP
              </Link>
            )}
            
            {eventId && !token && (
              <Link 
                to={`/public/${eventId}`} 
                className="update-button"
              >
                Submit Another RSVP
              </Link>
            )}

            <button 
              onClick={() => window.print()} 
              className="print-button"
            >
              Print Confirmation
            </button>
          </div>
        </div>

        <div className="confirmation-footer">
          <p>
            If you have any questions or need assistance, please contact the event organizer.
          </p>
          <div className="contact-info">
            <p>Event organized with ❤️ by RSVP Planning App</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPConfirmation;