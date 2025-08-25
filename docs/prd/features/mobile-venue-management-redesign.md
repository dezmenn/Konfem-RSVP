# User Stories for Mobile Venue Management Redesign

Here's a draft of user stories for the mobile venue management redesign, categorized by functionality for easier planning and development.

## 1. Interactive Canvas & Layout Management

*   **Story**: As an Event Planner, I want to `pan across the venue canvas` using a two-finger drag gesture so that I can easily navigate large layouts without losing context.
    *   **Acceptance Criteria**:
        *   User can drag two fingers anywhere on the canvas to move the view.
        *   Canvas moves smoothly in response to gestures.
        *   The gesture does not interfere with single-tap selections.

*   **Story**: As an Event Planner, I want to `zoom in and out of the venue canvas` using pinch gestures and dedicated zoom buttons (+/-) so that I can view intricate details or see the entire floor plan.
    *   **Acceptance Criteria**:
        *   Pinch-to-zoom gestures accurately scale the canvas.
        *   Zoom buttons increase/decrease zoom level in predefined increments.
        *   Zoom level is visually indicated (e.g., percentage).
        *   Elements and tables scale correctly without distortion.

*   **Story**: As an Event Planner, I want to `drag and drop tables and venue elements` precisely on the canvas so that I can arrange my floor plan visually and efficiently.
    *   **Acceptance Criteria**:
        *   Selected tables/elements can be moved by single-finger drag.
        *   Visual feedback (e.g., shadow, border) indicates the item being dragged.
        *   Item snaps to a grid or provides smooth positioning.
        *   New position is saved upon release.

*   **Story**: As an Event Planner, I want to `select a table or element` by tapping on it so that I can view or edit its properties.
    *   **Acceptance Criteria**:
        *   Single tap on a table/element highlights it.
        *   Tapping outside a selected item deselects it.
        *   Selecting an item opens the Properties Panel.

*   **Story**: As an Event Planner, I want to `resize venue elements` (e.g., stage, dance floor) using intuitive drag handles so that I can customize their dimensions to fit my venue.
    *   **Acceptance Criteria**:
        *   Resize handles appear on selected venue elements (not tables).
        *   Dragging handles changes the element's width and height.
        *   Element resizes smoothly and proportionally (or independently, if designed).
        *   New dimensions are saved.

## 2. Table & Guest Management

*   **Story**: As an Event Planner, I want to `see the current occupancy and total capacity displayed on each table icon` so that I can quickly assess seating availability at a glance.
    *   **Acceptance Criteria**:
        *   Each rendered table shows "X/Y" where X is current guests and Y is total capacity.
        *   Visual indication (e.g., color change) when a table is over capacity.

*   **Story**: As an Event Planner, I want to `see a clear visual indicator for locked tables` so that I know which tables are fixed in position and cannot be moved or changed.
    *   **Acceptance Criteria**:
        *   Locked tables display a distinct icon (e.g., padlock) or styling.
        *   Attempting to drag a locked table provides feedback (e.g., a "locked" message).

*   **Story**: As an Event Planner, I want to `see visual highlighting on a table when I drag a guest over it` so that I know it's a valid drop target for guest assignment.
    *   **Acceptance Criteria**:
        *   When a `DraggableGuest` is moved over a `DraggableTable`, the table's border or background changes.
        *   Highlighting disappears when the guest is moved away or dropped.

*   **Story**: As an Event Planner, I want to `drag guests from the "Unassigned" list onto tables on the canvas` so that I can easily assign them seats.
    *   **Acceptance Criteria**:
        *   Guests in the `GuestAssignmentPanel` are draggable.
        *   Dropping a guest on a table assigns them to that table.
        *   Table capacity updates visually after assignment.

*   **Story**: As an Event Planner, I want to `reassign a guest by dragging them from one table to another` so that I can easily adjust seating arrangements.
    *   **Acceptance Criteria**:
        *   Guests already assigned to a table are draggable from the "Table Details" view or "Table Capacity Panel".
        *   Dropping a guest on a new table updates their assignment and table capacities.

*   **Story**: As an Event Planner, I want to `unassign guests directly from the Guest Assignment Panel or Table Capacity Panel` so that I can quickly remove them from a table.
    *   **Acceptance Criteria**:
        *   Each assigned guest entry has an "unassign" action (e.g., an 'X' button).
        *   Tapping "unassign" removes the guest from the table and updates capacities.

## 3. New Panels and Modals

*   **Story**: As an Event Planner, I want to `select and add venue elements from an "Element Library Panel"` so that I can quickly build my floor plan from predefined objects.
    *   **Acceptance Criteria**:
        *   A dedicated panel displays a list of draggable venue elements.
        *   Dragging an element from the panel and dropping it on the canvas creates a new instance of that element.

*   **Story**: As an Event Planner, I want to `edit properties of selected elements and tables in a "Properties Panel"` so that I can fine-tune attributes like name, position, and capacity.
    *   **Acceptance Criteria**:
        *   The Properties Panel appears when an element or table is selected.
        *   Editable fields for relevant properties (name, x/y position, capacity for tables, dimensions for elements).
        *   Changes made in the panel are immediately reflected on the canvas.

*   **Story**: As an Event Planner, I want to `switch between "Layout Design" and "Table Management" modes using a top Toolbar` so that I can focus on specific tasks without clutter.
    *   **Acceptance Criteria**:
        *   A toolbar with distinct mode buttons is visible at the top.
        *   Switching modes changes the available panels (e.g., Element Library in Layout mode, Table Capacity in Table mode).

*   **Story**: As an Event Planner, I want to `view detailed table capacity information and assigned guests in a "Table Capacity Panel"` when in Table Management mode so that I have a clear overview of my seating arrangements.
    *   **Acceptance Criteria**:
        *   The panel lists all tables with current/max capacity.
        *   Each table can be expanded to show its assigned guests.
        *   Guests listed in this panel are also draggable for reassignment.

*   **Story**: As an Event Planner, I want to `see validation errors and warnings in a "Validation Results Modal"` after validating my layout so that I can identify and fix potential issues.
    *   **Acceptance Criteria**:
        *   Tapping a "Validate Layout" button triggers the validation process.
        *   A modal appears displaying a summary of issues (errors, warnings).
        *   The modal clearly lists each issue with descriptive messages.

## 4. State Management (Undo/Redo/Reset)

*   **Story**: As an Event Planner, I want to `undo my last action` (e.g., moving a table, assigning a guest) so that I can easily correct mistakes without manually reverting changes.
    *   **Acceptance Criteria**:
        *   An "Undo" button is available.
        *   Clicking "Undo" reverts the canvas and data to the previous state.
        *   Multiple undo steps are supported.

*   **Story**: As an Event Planner, I want to `redo an action that I just undid` so that I can restore a change if I decide it was correct.
    *   **Acceptance Criteria**:
        *   A "Redo" button is available (becomes active after an Undo).
        *   Clicking "Redo" reapplies the previously undone action.

*   **Story**: As an Event Planner, I want to `reset all guest assignments` so that I can quickly clear seating arrangements and start fresh.
    *   **Acceptance Criteria**:
        *   A "Reset All" button is available.
        *   A confirmation dialog appears before resetting.
        *   Upon confirmation, all guests are unassigned from tables.

## 5. Cross-Platform Synchronization

*   **Story**: As an Event Planner, I want `changes made on the mobile app to instantly reflect on the web version` so that my collaborators always see the latest layout, regardless of the platform used for editing.
    *   **Acceptance Criteria**:
        *   Moving a table on mobile updates its position on the web in real-time.
        *   Assigning a guest on mobile updates the guest list on the web in real-time.

*   **Story**: As an Event Planner, I want `changes made on the web version to instantly reflect on my mobile app` so that I can work seamlessly across devices and always have the most up-to-date information.
    *   **Acceptance Criteria**:
        *   Moving a table on the web updates its position on mobile in real-time.
        *   Assigning a guest on the web updates the guest list on mobile in real-time.