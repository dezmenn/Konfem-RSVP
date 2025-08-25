# Venue Management Wireframes - Mobile Redesign

This document provides wireframes for the redesigned mobile venue management interface, illustrating the key screens and components, while ensuring feature parity with the web version.

## 1. Main Venue View

This is the primary screen for the redesigned Venue tab. It features an interactive canvas and a bottom panel for managing guests and elements.

```
+--------------------------------------------------+
| [Venue Name]              [Validate] [Refresh]    |
|--------------------------------------------------|
| [Layout Design] [Table Management]    [100% + -]  |
|--------------------------------------------------|
|                                                  |
|   +-------+        +-------+                     |
|   | Table1|        | Table2| (Draggable)         |
|   +-------+        +-------+                     |
|                                                  |
|   +-----------+                                  |
|   | Stage     |                                  |
|   +-----------+                                  |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|--------------------------------------------------|
| [Undo] [Redo] [Reset]                            |
|--------------------------------------------------|
| [Guests] [Tables] [Elements] [Auto-Arrange]      |
+--------------------------------------------------+
```

**Components:**

*   **Toolbar:** Contains mode selectors (Layout Design/Table Management) and action buttons (Validate, Refresh).
*   **Zoom Controls:** Buttons and display for controlling canvas zoom level.
*   **Canvas:** A pannable and zoomable area displaying the venue layout.
*   **Tables:** Draggable objects representing seating tables. Each table displays its name and capacity.
*   **Venue Elements:** Non-interactive elements like the stage, dance floor, etc.
*   **Bottom Panel:** A tabbed panel for switching between guest lists, table management, and venue element libraries.

## 2. Guest Management Panel

When the "Guests" tab is selected in the bottom panel, it expands to show a list of all guests, which can be filtered by "Unassigned" and "Assigned".

```
+--------------------------------------------------+
| Canvas View (Tables are visible above)           |
|--------------------------------------------------|
| [Guests] [Tables] [Elements] [Auto-Arrange]      |
|--------------------------------------------------|
| [Unassigned (5)] [Assigned (7)]    [+ Add Guest] |
|--------------------------------------------------|
| [B] John Doe (Family) (Draggable)                |
| [G] Jane Smith (Friend) (Draggable)              |
| - ...                                            |
+--------------------------------------------------+
```

**Components:**

*   **Guest List:** A scrollable list of guests.
*   **Draggable Guests:** Users can drag guests from the "Unassigned" list and drop them onto tables in the canvas. Each guest item will display:
    *   **Side Indicator:** A color-coded icon or letter (e.g., 'B' for Bride, 'G' for Groom).
    *   **Relationship:** The guest's relationship to the couple (e.g., "Family," "Friend").
*   **Tabs:** Allows switching between unassigned and assigned guest lists.

## 3. Table Details & Guest Reassignment View

Tapping on a table opens a modal or expands a panel, showing the guests assigned to that table. Guests in this view are draggable.

```
+--------------------------------------------------+
| Table 1 (Capacity: 8/10)                         |
|--------------------------------------------------|
| [B] Guest A (Family) (Draggable)                 |
| [G] Guest B (Friend) (Draggable)                 |
| - ...                                            |
|--------------------------------------------------|
| [Edit Table] [Lock Table] [Close]                |
+--------------------------------------------------+
```

**Components:**

*   **Assigned Guest List:** Shows all guests currently seated at the selected table.
*   **Draggable Guests:** Users can drag a guest from this list and drop them onto another table in the main canvas to reassign them.
*   **Action Buttons:** Provides table-specific actions and a way to close the view.

## 4. Auto-Arrangement Modal

This modal is displayed when the user taps the "Auto-Arrange" button. It allows the user to configure the arrangement options before running the algorithm.

```
+--------------------------------------------------+
| Auto-Arrange Guests                              |
|--------------------------------------------------|
|                                                  |
| [x] Keep Families Together                       |
| [x] Respect Relationships                        |
|                                                  |
|--------------------------------------------------|
| [Run Arrangement] [Cancel]                       |
+--------------------------------------------------+
```

**Components:**

*   **Options:** Checkboxes for configuring the arrangement algorithm.
*   **Action Buttons:** Buttons to run the arrangement or cancel the operation.

## 5. Add Table/Element Views

When the user taps the "Tables" or "Elements" tab in the bottom panel, they will see a list of existing items and a button to add a new one.

### Add Table View
```
+--------------------------------------------------+
| Canvas View (Tables are visible above)           |
|--------------------------------------------------|
| [Guests] [Tables] [Elements] [Auto-Arrange]      |
|--------------------------------------------------|
| Table 1                                          |
| Table 2                                          |
|--------------------------------------------------|
| [+ Add Table]                                    |
+--------------------------------------------------+
```

### Add Element View
```
+--------------------------------------------------+
| Canvas View (Elements are visible above)         |
|--------------------------------------------------|
| [Guests] [Tables] [Elements] [Auto-Arrange]      |
|--------------------------------------------------|
| Stage                                            |
| Dance Floor                                      |
|--------------------------------------------------|
| [+ Add Element from Library]                     |
+--------------------------------------------------+
```
## 6. Element Library Panel

This panel is displayed when the user is in "Layout Design" mode and wants to add new venue elements.

```
+--------------------------------------------------+
| Canvas View (Elements are visible above)         |
|--------------------------------------------------|
| [Layout Design] [Table Management]    [100% + -] |
|--------------------------------------------------|
| Element Library                                  |
|--------------------------------------------------|
| [🎭] Stage                                       |
| [💃] Dance Floor                                 |
| [🍸] Bar                                         |
| [🚪] Entrance                                     |
| [🛤️] Walkway                                      |
| [🌸] Decoration                                   |
+--------------------------------------------------+
```

**Components:**

*   **Element List:** A scrollable list of available venue elements.
*   **Draggable Elements:** Each element can be dragged onto the canvas to add it to the layout.

## 7. Properties Panel

This panel appears when a venue element or table is selected, allowing the user to edit its properties.

```
+--------------------------------------------------+
| Canvas View (Selected element visible above)     |
|--------------------------------------------------|
| [Layout Design] [Table Management]    [100% + -] |
|--------------------------------------------------|
| Properties                                       |
|--------------------------------------------------|
| Name: [Table 1           ]                       |
| Capacity: [8             ] (if Table)           |
| X Position: [100        ]                       |
| Y Position: [200        ]                       |
|                                                  |
| [Lock Table] [Delete]                            |
+--------------------------------------------------+
```

**Components:**

*   **Editable Fields:** Input fields for name, capacity (for tables), and position (X, Y).
*   **Action Buttons:** Buttons to lock/unlock tables and delete elements.

## 8. Table Capacity Panel

This panel is displayed when the user is in "Table Management" mode, showing detailed information about tables and their guest assignments.

```
+--------------------------------------------------+
| Canvas View (Tables are visible above)           |
|--------------------------------------------------|
| [Layout Design] [Table Management]    [100% + -] |
|--------------------------------------------------|
| Table Capacity                                   |
|--------------------------------------------------|
| Table 1 (8/10) [▶]                               |
|   - [B] Guest A (Family) [X]                     |
|   - [G] Guest B (Friend) [X]                     |
| Table 2 (5/8) [▶]                                |
|   - ...                                          |
+--------------------------------------------------+
```

**Components:**

*   **Table List:** Displays each table with its current and maximum capacity.
*   **Expandable Guest List:** Tapping on a table expands to show assigned guests.
*   **Guest Items:** Each guest item shows name, side, relationship, and an "unassign" button.

## 9. Validation Results Modal

This modal appears when the user taps the "Validate Layout" button, showing any issues with the current layout.

```
+--------------------------------------------------+
| Auto-Arrange Guests                              |
|--------------------------------------------------|
| Layout Validation Results                        |
|--------------------------------------------------|
| [✅] Layout is valid / [❌] Layout has issues   |
|                                                  |
| Errors:                                          |
| - Table 1 overlaps with Stage                    |
| - Guest C is not assigned                        |
|                                                  |
| Warnings:                                        |
| - Table 3 is too close to Table 4                |
|                                                  |
| [Close]                                          |
+--------------------------------------------------+
```

**Components:**

*   **Status Indicator:** Shows if the layout is valid or has issues.
*   **Error/Warning Lists:** Lists specific validation errors and warnings.
*   **Close Button:** To dismiss the modal.

## 10. Element Resizing

This illustrates how resize handles appear when a venue element is selected, allowing for direct manipulation of its dimensions.

```
+--------------------------------------------------+
| Canvas View                                      |
|--------------------------------------------------|
|                                                  |
|   +---------------------------------------+      |
|   | NW Resize                     NE Resize |    |
|   |                                       |      |
|   |   +-----------+                       |      |
|   |   | Stage     | (Selected, Resizable) |      |
|   |   +-----------+                       |      |
|   |                                       |      |
|   | SW Resize                     SE Resize |    |
|   +---------------------------------------+      |
|                                                  |
|                                                  |
|--------------------------------------------------|
| [Undo] [Redo] [Reset]                            |
|--------------------------------------------------|
| [Guests] [Tables] [Elements] [Auto-Arrange]      |
+--------------------------------------------------+
```

**Components:**

*   **Resize Handles:** Small draggable squares at the corners of a selected element.
*   **Selected Element:** The element currently being resized.