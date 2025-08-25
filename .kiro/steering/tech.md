# Technology Stack

## Architecture
- **Monorepo**: npm workspaces with shared libraries
- **Backend**: Node.js + Express.js + TypeScript
- **Web Frontend**: React.js + TypeScript + Create React App
- **Mobile**: React Native + Expo + TypeScript
- **Shared**: Common types and utilities library

## Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 12+ with connection pooling
- **Cache**: Redis 6+ for sessions and caching
- **Real-time**: Socket.io for WebSocket connections
- **Security**: Helmet, CORS, bcryptjs, JWT
- **File Upload**: Multer
- **Logging**: Winston
- **Testing**: Jest + Supertest

## Frontend Stack
- **Web**: React 19+ with TypeScript, React Router DOM
- **Mobile**: React Native with Expo SDK ~53.0
- **Styling**: CSS files (not CSS modules) - import './Component.css' pattern
- **State**: React Context (planned, not yet implemented)
- **Testing**: React Testing Library + Jest

## Development Tools
- **Build**: TypeScript compiler, Create React App
- **Dev Server**: Nodemon for backend, React Scripts for web
- **Package Manager**: npm 8+
- **Concurrency**: concurrently for running multiple dev servers

## Common Commands

### Setup
```bash
npm run install:all          # Install all dependencies
cp rsvp-backend/.env.example rsvp-backend/.env  # Setup environment
```

### Development
```bash
npm run dev                  # Start backend + web + shared
npm run dev:mobile          # Start mobile app separately
npm run dev:backend         # Backend only
npm run dev:web             # Web only
npm run dev:shared          # Shared library in watch mode
```

### Building
```bash
npm run build               # Build all projects
npm run build:backend       # Backend only
npm run build:web          # Web only
npm run build:shared       # Shared library only
```

### Testing
```bash
npm run test               # Run all tests
npm run test:backend       # Backend tests only
npm run test:web          # Web tests only
```

## Environment Variables
- Backend uses `.env` file in `rsvp-backend/` directory
- `SKIP_DB_SETUP=true` enables demo mode with mock services
- `NODE_ENV` for environment detection
- Database and Redis connection strings required for production

## TypeScript Configuration
- **Backend**: CommonJS modules, ES2020 target, strict mode
- **Web**: ESNext modules, ES5 target, React JSX
- **Mobile**: Extends Expo base config with strict mode
- **Shared**: ESNext modules, generates declarations for distribution