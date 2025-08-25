# Communication & Data Flow

The application uses a combination of RESTful API calls and WebSockets to facilitate communication between the clients (web and mobile) and the backend.

## RESTful API

The backend provides a comprehensive RESTful API that is used for standard CRUD (Create, Read, Update, Delete) operations. The API is defined in the `rsvp-backend/src/routes` directory, and it provides endpoints for managing all of the application's core entities, such as guests, events, and tables.

## WebSockets

WebSockets are used for real-time communication between the clients and the server. The `WebSocketService` on the backend and the `WebSocketClient` on the frontend work together to provide a persistent, bidirectional communication channel. This is used for features like:

*   **Live Dashboard Updates**: When a guest RSVPs, the dashboard is updated in real time to reflect the new data.
*   **Cross-Platform Synchronization**: When a user makes a change on one device, the change is instantly propagated to all other devices that are connected to the same event.

## Offline Synchronization

The application provides a robust offline synchronization mechanism that allows users to continue working even when they are not connected to the internet. The `SyncService` on the client-side is responsible for queuing any operations that are performed while the application is offline. When the application comes back online, the `SyncService` sends the queued operations to the backend's `/api/sync/operations` endpoint to be processed.