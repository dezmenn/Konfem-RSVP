# Backend Architecture (`rsvp-backend`)

The backend is a well-structured Node.js application built with Express.js and TypeScript. It follows a classic layered architecture pattern, separating concerns into distinct modules.

## Core Modules

*   **`models`**: Defines the data structures for the application, including `Guest`, `Event`, `Table`, `InvitationTemplate`, and `Message`. These models represent the core entities of the system.
*   **`repositories`**: Contains the data access layer, which is responsible for all interactions with the PostgreSQL database. The repositories provide an abstraction layer over the raw database queries, making the code more modular and easier to maintain.
*   **`services`**: Implements the business logic of the application. The services orchestrate the interactions between the models and repositories, and they contain the core functionality of the system, such as `GuestService`, `InvitationService`, and `TableService`.
*   **`routes`**: Defines the RESTful API endpoints for the application. Each route is responsible for handling incoming HTTP requests and calling the appropriate service to perform the requested action.
*   **`middleware`**: Contains Express middleware functions, such as the `errorHandler`, which is used to handle errors in a centralized way.
*   **`config`**: Holds the application's configuration files, including the database and Redis connection settings.

## Key Features & Functionality

*   **Real-time Communication**: The backend uses WebSockets (via `socket.io`) to provide real-time communication between the clients and the server. This is used for features like live dashboard updates and cross-platform synchronization.
*   **Offline Sync**: The `SyncQueueService` provides a robust mechanism for handling offline data synchronization. It allows clients to queue operations while they are offline and then sync them with the server when they come back online.
*   **Authentication & Authorization**: The backend uses JSON Web Tokens (JWT) for authentication, a standard for securing HTTP requests.
*   **File Exports**: The `ExportService` allows users to export data in various formats, including PDF, CSV, and XLSX.
*   **Comprehensive Testing**: The `__tests__` directory contains a comprehensive suite of unit and integration tests, ensuring the quality and reliability of the code.