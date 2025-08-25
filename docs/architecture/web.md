# Web Application Architecture (`rsvp-web`)

The web application is a modern, component-based single-page application (SPA) built with React and TypeScript. It follows the standard Create React App project structure.

## Core Modules

*   **`components`**: This is the heart of the web application, containing a rich library of reusable React components. Each component is responsible for a specific piece of the user interface, such as `GuestList`, `InvitationTemplateEditor`, and `EventDashboard`.
*   **`services`**: Contains the services that are responsible for communicating with the backend API. The `SyncService` and `WebSocketClient` are key components in this module, providing the real-time and offline capabilities of the application.
*   **`hooks`**: This directory contains custom React hooks, such as `useSync`, which encapsulates the logic for interacting with the `SyncService`.

## Key Features & Functionality

*   **Component-Based Architecture**: The application is built with a modular, component-based architecture, which makes it easy to maintain and extend.
*   **Real-time Updates**: The web application uses WebSockets to receive real-time updates from the server, ensuring that the user is always seeing the most up-to-date information.
*   **Offline Support**: The `SyncService` provides robust offline support, allowing users to continue working even when they are not connected to the internet.
*   **Comprehensive Feature Set**: The application provides a wide range of features for event organizers, including guest management, invitation creation, table arrangement, and venue layout management.