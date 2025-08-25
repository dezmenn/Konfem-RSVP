# Architecture

This document outlines the architecture of the RSVP application, which is a full-stack project composed of a backend, a mobile application, and a web application.

## High-Level Overview

The project is a monorepo containing three main packages:

*   `rsvp-backend`: A Node.js application that serves as the API for the mobile and web clients.
*   `rsvp-mobile`: A React Native application for mobile devices.
*   `rsvp-web`: A React application for web browsers.

There is also a `shared` package that contains code and types used across all three applications.

## Components

### Backend (`rsvp-backend`)

The backend is a Node.js application written in TypeScript. It follows a standard Model-View-Controller (MVC) like pattern, with the following directory structure:

*   `src/`: The main source code directory.
    *   `config/`: Application configuration.
    *   `models/`: Database models (e.g., Mongoose schemas).
    *   `repositories/`: Data access layer, responsible for database interactions.
    *   `routes/`: API route definitions.
    *   `services/`: Business logic.
    *   `middleware/`: Express middleware.
    *   `utils/`: Utility functions.
    *   `server.ts`: The main application entry point.

### Mobile (`rsvp-mobile`)

The mobile application is built with React Native and Expo, and it is also written in TypeScript. The structure is as follows:

*   `components/`: Reusable React components.
*   `services/`: Services for interacting with the backend API.
*   `types/`: TypeScript type definitions.
*   `App.tsx`: The main application component.

## Technology Stack

This section outlines the key technologies and libraries used in each component of the application.

### Backend (`rsvp-backend`)

*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: PostgreSQL (with `pg`)
*   **Real-time Communication**: Socket.IO
*   **Testing**: Jest, Supertest
*   **Other Key Libraries**:
*   `jsonwebtoken` for authentication
*   `bcryptjs` for password hashing
*   `winston` for logging
*   `pdfkit`, `csv-parser`, `xlsx` for file generation

### Mobile (`rsvp-mobile`)

*   **Framework**: React Native with Expo
*   **Language**: TypeScript
*   **Real-time Communication**: Socket.IO Client
*   **Key Libraries**:
*   `@react-native-async-storage/async-storage` for local storage
*   `react-native-gesture-handler` and `react-native-reanimated` for animations and gestures

### Web (`rsvp-web`)

*   **Framework**: React (with Create React App)
*   **Language**: TypeScript
*   **Routing**: React Router
*   **Real-time Communication**: Socket.IO Client
*   **Testing**: React Testing Library

## Data Flow

The application employs a sophisticated offline-first data synchronization strategy to ensure a seamless user experience, even with intermittent network connectivity. This is orchestrated by a `SyncService` on the client-side and a corresponding `SyncQueueService` on the backend.

### Client-Side (`rsvp-mobile` and `rsvp-web`)

1.  **Offline Operation Queue**: When a user performs an action (e.g., creating a guest, updating a table), the operation is added to a local queue of offline operations. This queue is persisted in the browser's local storage or the mobile device's async storage.
2.  **Immediate Sync Attempt**: If the application is online, it immediately attempts to sync the operation with the backend by sending a `POST` request to the `/api/sync/operations` endpoint.
3.  **Real-Time Updates**: The client also maintains a WebSocket connection to the server. This is used to receive real-time updates from the server, such as changes made by other users or the results of sync operations.
4.  **Conflict Resolution**: If a sync operation results in a conflict, the client is notified and can choose a resolution strategy (e.g., "client wins," "server wins").

### Backend (`rsvp-backend`)

1.  **Sync Queue**: The backend maintains a queue of all incoming sync operations in a `SyncQueueService`. This service is responsible for processing each operation and updating the database accordingly.
2.  **Conflict Detection**: The `SyncQueueService` can detect conflicts between operations (e.g., two users trying to update the same record).
3.  **WebSocket Broadcasting**: When a change is made to the data, the backend broadcasts a sync event to all connected clients via WebSockets. This ensures that all clients are kept up-to-date in real time.

## Getting Started

To set up and run the project locally, please refer to the main [README.md](../README.md) file for detailed instructions. A summary of the steps is provided below:

1.  **Prerequisites**: Ensure you have Node.js, npm, PostgreSQL, and Redis installed.
2.  **Install Dependencies**: Run `npm install:all` in the root directory to install all dependencies for the backend, mobile, and web applications.
3.  **Configure Environment**: Copy the `.env.example` file in the `rsvp-backend` directory to `.env` and update it with your database credentials.
4.  **Start the Application**: Run `npm run dev` to start the backend server and the web application.
5.  **Start the Mobile App**: Run `npm run dev:mobile` to start the mobile application in the Expo development environment.
*   `App-*.tsx`: Multiple entry points, possibly for different build configurations or feature flags.

### Web (`rsvp-web`)

The web application is a standard React application, likely created with Create React App. It is written in TypeScript and has a similar structure to the mobile app:

*   `src/`: The main source code directory.
    *   `components/`: Reusable React components.
    *   `hooks/`: Custom React hooks.
    *   `services/`: Services for interacting with the backend API.
    *   `types/`: TypeScript type definitions.
    *   `App.tsx`: The main application component.