import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import GuestManagement from './components/GuestManagement';
import { InvitationTemplateList } from './components/InvitationTemplateList';
import InvitationManagement from './components/InvitationManagement';
import VenueManager from './components/VenueManager';
import ExportManager from './components/ExportManager';
import EventDashboard from './components/EventDashboard';
import PublicRSVPResponse from './components/PublicRSVPResponse';
import PublicRSVPRegistration from './components/PublicRSVPRegistration';
import RSVPConfirmation from './components/RSVPConfirmation';
import './App.css';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <>
      <header className="App-header">
        <h1>RSVP Planning App</h1>
        <h2>Sarah & John's Wedding</h2>
      </header>
      <nav className="admin-nav" aria-label="Main navigation">
        <Link
          to="/admin/dashboard"
          className={location.pathname === '/admin/dashboard' ? 'active' : ''}
          aria-current={location.pathname === '/admin/dashboard' ? 'page' : undefined}
        >
          Dashboard
        </Link>
        <Link
          to="/admin/guests"
          className={location.pathname === '/admin/guests' ? 'active' : ''}
          aria-current={location.pathname === '/admin/guests' ? 'page' : undefined}
        >
          Guest Management
        </Link>
        <Link
          to="/admin/invitations"
          className={location.pathname === '/admin/invitations' ? 'active' : ''}
          aria-current={location.pathname === '/admin/invitations' ? 'page' : undefined}
        >
          Invitation Templates
        </Link>
        <Link
          to="/admin/invitations-mgmt"
          className={location.pathname === '/admin/invitations-mgmt' ? 'active' : ''}
          aria-current={location.pathname === '/admin/invitations-mgmt' ? 'page' : undefined}
        >
          Invitation Management
        </Link>
        <Link
          to="/admin/venue"
          className={location.pathname === '/admin/venue' ? 'active' : ''}
          aria-current={location.pathname === '/admin/venue' ? 'page' : undefined}
        >
          Venue & Tables
        </Link>
        <Link
          to="/admin/exports"
          className={location.pathname === '/admin/exports' ? 'active' : ''}
          aria-current={location.pathname === '/admin/exports' ? 'page' : undefined}
        >
          Export & Reports
        </Link>
      </nav>
      <main className="App-main">
        {children}
      </main>
    </>
  );
};

function App() {
  // Using demo event ID from our mock data
  const demoEventId = 'demo-event-1';

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin/Management Routes */}
          <Route path="/admin/dashboard" element={
            <AdminLayout>
              <EventDashboard eventId={demoEventId} />
            </AdminLayout>
          } />
          
          <Route path="/admin/guests" element={
            <AdminLayout>
              <GuestManagement eventId={demoEventId} />
            </AdminLayout>
          } />
          
          <Route path="/admin/invitations" element={
            <AdminLayout>
              <InvitationTemplateList eventId={demoEventId} />
            </AdminLayout>
          } />
          
          <Route path="/admin/invitations-mgmt" element={
            <AdminLayout>
              <InvitationManagement eventId={demoEventId} />
            </AdminLayout>
          } />
          
          <Route path="/admin/venue" element={
            <AdminLayout>
              <VenueManager eventId={demoEventId} />
            </AdminLayout>
          } />
          
          <Route path="/admin/exports" element={
            <AdminLayout>
              <ExportManager eventId={demoEventId} />
            </AdminLayout>
          } />
          
          {/* Public RSVP Routes */}
          <Route path="/rsvp/:token" element={<PublicRSVPResponse />} />
          <Route path="/rsvp/confirmation/:token" element={<RSVPConfirmation />} />
          <Route path="/public/:eventId" element={<PublicRSVPRegistration />} />
          <Route path="/public/confirmation/:eventId" element={<RSVPConfirmation />} />
          
          {/* Default redirects */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
