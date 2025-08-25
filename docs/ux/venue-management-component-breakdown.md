# Venue Management Component Breakdown - Mobile Redesign

This document outlines the component-based architecture for the redesigned mobile venue management interface, ensuring feature parity with the web version.

## 1. Core Components

### 1.1. `InteractiveVenueCanvas`

This will be the main component, replacing the existing `MobileVenueLayoutManager`. It will be responsible for:

*   Rendering the venue elements and tables.
*   Handling pan, zoom, and drag-and-drop gestures.
*   Managing the state of the venue layout.

**Props:**

*   `eventId`: The ID of the current event.
*   `elements`: An array of venue elements.
*   `tables`: An array of tables.
*   `onLayoutChange`: A callback function to handle layout updates.

### 1.2. `DraggableTable`

A component representing a single table on the canvas.

*   **State:** Manages its own position and selected state.
*   **Gestures:** Implements `PanResponder` for drag-and-drop functionality.
*   **Props:** `table`, `onDrop`, `onSelect`.

### 1.3. `GuestAssignmentPanel`

A bottom sheet panel for managing guest assignments.

*   **Tabs:** Switches between "Unassigned" and "Assigned" guest lists.
*   **Guest List:** Renders a list of draggable guest items.
*   **Props:** `guests`, `tables`, `onAssignGuest`.

### 1.4. `DraggableGuest`

A component representing a single guest in the `GuestAssignmentPanel`.

*   **Gestures:** Implements `PanResponder` for dragging guests onto tables.
*   **Props:** `guest`, `onDrop`.

### 1.5. `AutoArrangementModal`

A modal for configuring and triggering the auto-arrangement feature.

*   **State:** Manages the arrangement options (e.g., `keepFamiliesTogether`).
*   **Props:** `isVisible`, `onClose`, `onRunArrangement`.

## 2. Data Flow

1.  The `InteractiveVenueCanvas` fetches the initial venue layout and tables from the API.
2.  When a user drags and drops a table, the `DraggableTable` component calls the `onDrop` callback with the new position.
3.  The `InteractiveVenueCanvas` updates the layout state and sends the changes to the API.
4.  When a user drags a guest from the `GuestAssignmentPanel` and drops them on a `DraggableTable`, the `DraggableGuest`'s `onDrop` callback is triggered.
5.  The `InteractiveVenueCanvas` handles the guest assignment logic and updates the relevant table's guest list.
6.  When the user triggers the auto-arrangement, the `InteractiveVenueCanvas` displays the `AutoArrangementModal`.
7.  Upon confirming the options, the `InteractiveVenueCanvas` will call the auto-arrangement service, which will return the updated table assignments.

## 3. Existing Component Modifications

*   **`IntegratedVenueManager.tsx`:** This component will be refactored to use the new `InteractiveVenueCanvas` as its primary view, removing the old tabbed lists. It will also include the new action buttons for Undo, Redo, and Reset.
*   **`TableManagement.tsx`:** This component will be deprecated and its functionality absorbed into the new interactive canvas.
*   **`AutoTableArrangement.tsx`:** The core logic of this component will be extracted into a service that can be called from the `InteractiveVenueCanvas`. The UI will be replaced by the new `AutoArrangementModal`.

## 4. State Management for Undo/Redo

The `InteractiveVenueCanvas` will need to implement a state management system to handle the undo and redo functionality.

*   **Action History:** An array of past states will be maintained. Each time a user performs an action (e.g., moves a table, assigns a guest), the new state is pushed to this array.
*   **Undo:** Moves the current state back one step in the history.
*   **Redo:** Moves the current state forward one step in the history.
*   **Reset All:** This action will clear all assignments from the current state and push it to the history.
## 5. Additional Features for Web Parity

To ensure the mobile version has feature parity with the web version, the following additional components and functionalities need to be implemented:

### 5.1. Enhanced `InteractiveVenueCanvas` Features

The `InteractiveVenueCanvas` component needs additional functionality to match the web version:

*   **Zoom Controls:** Implement pinch-to-zoom and zoom buttons for precise canvas control
*   **Panning:** Allow users to pan around the canvas when zoomed in
*   **Element Resizing:** Enable resizing of venue elements (not tables) with drag handles
*   **Selection Management:** Implement visual selection states for elements and tables
*   **Property Panel Integration:** Connect with a property panel to edit element attributes
*   **Validation System:** Integrate layout validation to check for issues like overlapping elements

### 5.2. New Components for Feature Parity

Additional components needed to match web functionality:

#### 5.2.1. `ElementLibraryPanel`

A panel for selecting and adding venue elements from a predefined library:

*   **Props:** `onElementSelect`
*   **Functionality:** Displays draggable venue elements (Stage, Dance Floor, Bar, etc.) that can be added to the canvas

#### 5.2.2. `PropertiesPanel`

A side panel for editing selected element properties:

*   **Props:** `selectedElement`, `onElementUpdate`, `onElementDelete`
*   **Functionality:** Shows editable fields for element properties (name, position, dimensions, capacity, etc.)

#### 5.2.3. `Toolbar`

A top toolbar with action buttons and mode selectors:

*   **Props:** `mode`, `onModeChange`, `onValidate`, `onRefresh`, `zoomLevel`, `onZoomChange`
*   **Functionality:** Provides access to different modes (Layout Design, Table Management) and actions (Validate, Refresh)

#### 5.2.4. `TableCapacityPanel`

A panel for viewing and managing table capacities and guest assignments:

*   **Props:** `tables`, `guests`, `onGuestReassign`, `onGuestUnassign`
*   **Functionality:** Shows table capacity information and allows expanding to view assigned guests

#### 5.2.5. `ValidationResultsModal`

A modal for displaying layout validation results:

*   **Props:** `isVisible`, `results`, `onClose`
*   **Functionality:** Shows validation errors and warnings when the layout is checked

### 5.3. Enhanced Existing Components

Existing components need enhancement to match web functionality:

#### 5.3.1. `DraggableTable`

Additional features needed:
*   **Visual Capacity Display:** Show current capacity vs. maximum capacity
*   **Lock Status Indicator:** Visual indicator for locked tables
*   **Drop Target Highlighting:** Visual feedback when a guest is being dragged over the table
*   **Selection State:** Visual indication when a table is selected

#### 5.3.2. `GuestAssignmentPanel`

Additional features needed:
*   **Guest Rendering:** Implement actual rendering of `DraggableGuest` components
*   **Guest Details:** Display guest relationship and side information
*   **Drag and Drop:** Implement proper drag and drop functionality with drop target detection
*   **Guest Actions:** Add ability to unassign guests directly from the panel

#### 5.3. `DraggableGuest`

Additional features needed:
*   **Drop Target Detection:** Implement logic to determine which table a guest was dropped on
*   **Visual Feedback:** Show visual feedback during dragging
*   **Guest Information:** Display guest relationship and side information