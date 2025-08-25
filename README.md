# RSVP Planning App

A comprehensive event management system with mobile and web interfaces for managing guest lists, sending WhatsApp invitations, and arranging table seating with venue layout management.

## Project Structure

```
rsvp-planning-app/
├── rsvp-backend/          # Node.js/Express API server
├── rsvp-web/              # React.js web application
├── rsvp-mobile/           # React Native mobile app (Expo)
├── shared/                # Shared types and utilities
└── .kiro/specs/           # Project specifications and tasks
```

## Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 12+
- Redis 6+
- Expo CLI (for mobile development)

## Quick Start

1. **Install dependencies for all projects:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp rsvp-backend/.env.example rsvp-backend/.env
   # Edit rsvp-backend/.env with your database and Redis credentials
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:5000
   - Web application on http://localhost:3000
   - Shared library in watch mode

4. **Start mobile development:**
   ```bash
   npm run dev:mobile
   ```

## Development

### Backend (rsvp-backend/)
- **Framework:** Node.js with Express.js and TypeScript
- **Database:** PostgreSQL with connection pooling
- **Cache:** Redis for sessions and caching
- **Real-time:** Socket.io for live updates
- **API:** RESTful API with WebSocket support

### Web App (rsvp-web/)
- **Framework:** React.js with TypeScript
- **Styling:** CSS Modules (to be configured)
- **State Management:** React Context (to be implemented)
- **Build Tool:** Create React App

### Mobile App (rsvp-mobile/)
- **Framework:** React Native with Expo and TypeScript
- **Navigation:** React Navigation (to be configured)
- **State Management:** React Context (to be implemented)
- **Platform:** iOS and Android

### Shared Library (shared/)
- **Purpose:** Common types, utilities, and business logic
- **Build:** TypeScript compilation to dist/
- **Usage:** Imported by web, mobile, and backend projects

## Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all projects for production
- `npm run test` - Run tests for all projects
- `npm run install:all` - Install dependencies for all projects

## Database Setup

The backend automatically creates the required database tables on startup. Ensure PostgreSQL is running and the connection details in `.env` are correct.

### Required Tables:
- `events` - Event information
- `guests` - Guest list and RSVP data
- `tables` - Table arrangements
- `venue_elements` - Venue layout elements
- `messages` - WhatsApp message tracking

## Features

- ✅ Cross-platform (Web + Mobile)
- ✅ Real-time synchronization
- ✅ PostgreSQL database with migrations
- ✅ Redis caching and sessions
- ✅ TypeScript throughout
- ✅ Hot reloading for development
- 🚧 Guest list management
- 🚧 WhatsApp integration
- 🚧 Table arrangement system
- 🚧 Venue layout designer

## Next Steps

1. Implement guest management functionality (Task 2)
2. Add WhatsApp mock service for development (Task 6)
3. Build RSVP invitation system (Task 7)
4. Create venue layout management (Task 11)

## Contributing

This project follows the spec-driven development methodology. See `.kiro/specs/rsvp-planning-app/` for detailed requirements, design, and implementation tasks.