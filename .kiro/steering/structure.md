# Project Structure

## Root Directory Organization
```
rsvp-planning-app/
├── rsvp-backend/          # Node.js/Express API server
├── rsvp-web/              # React.js web application  
├── rsvp-mobile/           # React Native mobile app (Expo)
├── shared/                # Shared types and utilities
├── demo-data/             # Demo data and testing files
├── .kiro/specs/           # Project specifications and tasks
└── test-*.js              # Integration test scripts
```

## Backend Structure (rsvp-backend/)
```
src/
├── models/                # Data models with validation
├── repositories/          # Database access layer
├── services/              # Business logic layer
├── routes/                # Express route handlers
├── middleware/            # Express middleware
├── config/                # Database, Redis configuration
├── utils/                 # Utility functions
├── demo/                  # Demo and testing utilities
├── scripts/               # Database seeding scripts
└── __tests__/             # Test files
    ├── models/            # Model tests
    ├── services/          # Service tests
    └── integration/       # Integration tests
```

## Frontend Structure (rsvp-web/)
```
src/
├── components/            # React components
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── App.tsx               # Main application component
```

## Mobile Structure (rsvp-mobile/)
```
components/                # React Native components
App.tsx                   # Main mobile application
```

## Shared Library (shared/)
```
src/
├── types/                 # Common TypeScript interfaces
└── index.ts              # Main export file
```

## Architecture Patterns

### Backend Patterns
- **Repository Pattern**: Data access abstraction with `BaseRepository` class
- **Service Layer**: Business logic in dedicated service classes
- **Mock Services**: Demo mode implementations (e.g., `MockGuestService`)
- **Dependency Injection**: Services receive repositories via constructor
- **Route Organization**: Feature-based route modules (`/api/guests`, `/api/rsvp`)

### Frontend Patterns
- **Component-per-file**: Each React component in its own file
- **CSS Co-location**: Component styles in same directory (`Component.css`)
- **Type Safety**: Shared types imported from `shared/` package
- **Admin Layout**: Wrapper component for admin navigation

### File Naming Conventions
- **Backend**: PascalCase for classes (`GuestService.ts`, `GuestRepository.ts`)
- **Frontend**: PascalCase for components (`GuestManagement.tsx`)
- **Types**: Descriptive interfaces in shared package
- **Tests**: `.test.ts` suffix, organized by feature
- **Mock Services**: `Mock` prefix for demo implementations

### Import Patterns
- **Shared Types**: `import { Guest } from '../../../shared/src/types'`
- **CSS Imports**: `import './Component.css'` (not CSS modules)
- **Relative Imports**: Use relative paths within same package
- **Repository Exports**: Centralized in `repositories/index.ts`

### Demo/Testing Structure
- **Demo Data**: JSON files in `demo-data/` directory
- **Test Scripts**: Root-level `test-*.js` files for integration testing
- **Mock Repositories**: In-memory implementations for demo mode
- **Demo Service**: Singleton pattern for managing demo data