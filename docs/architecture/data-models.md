# Data Models & Database

The application uses a PostgreSQL database to store its data. The `rsvp-backend/src/models` directory contains the definitions for the following core data models:

*   **`Event`**: Represents an event, including its title, date, location, and other details.
*   **`Guest`**: Represents a guest, including their name, contact information, RSVP status, and dietary restrictions.
*   **`Table`**: Represents a table at the event, including its capacity and assigned guests.
*   **`VenueElement`**: Represents a non-table element in the venue layout, such as a stage or dance floor.
*   **`InvitationTemplate`**: Represents a template for an RSVP invitation.
*   **`Message`**: Represents a message that has been sent to a guest, such as an invitation or a reminder.
*   **`RSVPResponse`**: Represents a guest's response to an RSVP invitation.

These models are all interconnected, forming a comprehensive and well-structured database schema that is designed to support the application's features and functionality.