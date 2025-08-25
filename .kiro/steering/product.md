# Product Overview

The RSVP Planning App is a comprehensive event management system designed for wedding planning and similar events. It provides both web and mobile interfaces for managing guest lists, sending WhatsApp invitations, tracking RSVPs, and arranging table seating with venue layout management.

## Core Features

- **Guest Management**: Add, edit, and organize guest lists with contact information, dietary restrictions, and relationship tracking
- **WhatsApp Integration**: Send invitations and reminders via WhatsApp with mock service for development
- **RSVP System**: Public RSVP response pages with token-based authentication
- **Invitation Templates**: Visual template editor for creating custom invitation designs
- **Reminder Scheduling**: Automated reminder system for follow-ups
- **Real-time Updates**: WebSocket-based synchronization across all clients
- **Cross-platform**: Web dashboard for organizers, mobile app for on-the-go management

## Target Users

- **Event Organizers**: Primary users managing the entire event through web dashboard
- **Guests**: Receive invitations and respond via public RSVP pages
- **Mobile Users**: Event staff using mobile app for real-time guest management

## Demo Mode

The application supports a demo mode (`SKIP_DB_SETUP=true`) that uses mock services and in-memory data for testing and demonstrations without requiring database setup.