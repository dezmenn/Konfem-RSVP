# Guest-Table Linking Implementation Guide

## Overview

This guide documents the implementation of the guest-table linking functionality in the RSVP Planning App. The system provides seamless integration between the guest list and table arrangement layout, allowing users to easily assign guests to tables and visualize the connections.

## Features Implemented

### 1. Enhanced Guest List Interface

#### Table Assignment Column
- **Visual Indicators**: Each guest row shows their current table assignment or "Unassigned" status
- **Interactive Buttons**: 
  - 📍 **View Table**: Navigate to table layout and highlight the specific table
  - ✕ **Unassign**: Remove guest from their current table
  - + **Assign**: Open table selection modal for unassigned guests

#### Responsive Design
- Mobile-friendly button layout
- Hover effects and visual feedback
- Consistent styling with the existing design system

### 2. Table Assignment Modal

#### Guest Information Display
- Shows guest details (name, phone, side, relationship)
- Displays current table assignment if any
- Clear visual hierarchy for easy scanning

#### Table Selection Grid
- **Visual Table Cards**: Each table shows name, capacity, and current occupancy
- **Status Indicators**:
  - Available spots highlighted in green
  - Over-capacity tables marked with warning (red)
  - Locked tables shown as disabled
  - Current table highlighted differently

#### Smart Capacity Management
- Prevents assignment to full tables
- Shows real-time availability
- Warns about over-capacity situations

### 3. Bidirectional Data Synchronization

#### Guest → Table Linking
- Guest records store `tableAssignment` field
- Automatic updates when assignments change
- Real-time refresh of guest list

#### Table → Guest Linking
- Table records maintain `assignedGuests` array
- Synchronized with guest assignments
- Ensures data consistency across both directions

### 4. API Integration

#### Assignment Endpoints
```javascript
POST /api/guests/{guestId}/assign-table
Body: { tableId: string }

POST /api/guests/{guestId}/unassign-table
```

#### Data Retrieval
```javascript
GET /api/guests/events/{eventId}
GET /api/tables/events/{eventId}
GET /api/tables/events/{eventId}/capacity
```

## Technical Implementation

### Frontend Components

#### GuestList.tsx Enhancements
```typescript
interface GuestListProps {
  // ... existing props
  onViewTableLayout?: (tableName: string) => void;
  onAssignGuestToTable?: (guest: Guest) => void;
}
```

**New Features:**
- Table assignment container with action buttons
- Handler functions for assignment operations
- Integration with parent component callbacks

#### GuestManagement.tsx Updates
```typescript
const [tables, setTables] = useState<Table[]>([]);
const [showTableAssignment, setShowTableAssignment] = useState(false);
const [guestToAssign, setGuestToAssign] = useState<Guest | null>(null);
```

**New Features:**
- Table data management
- Assignment modal state
- Integration handlers for guest list callbacks

### Backend Services

#### Enhanced Table Service
- Bidirectional assignment/unassignment methods
- Capacity calculation and validation
- Real-time data synchronization

#### Guest Service Integration
- Table assignment field management
- Automatic cleanup on table deletion
- Consistency checks and validation

### CSS Styling

#### Table Assignment Buttons
```css
.table-assignment-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view-table, .btn-unassign, .btn-assign {
  /* Consistent button styling with hover effects */
}
```

#### Assignment Modal
```css
.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.table-option {
  /* Interactive table cards with status indicators */
}
```

## User Experience Flow

### 1. Viewing Current Assignments
1. User opens guest list
2. Table assignments are clearly visible in dedicated column
3. Visual indicators show assignment status for each guest

### 2. Assigning Unassigned Guest
1. User clicks "+" button next to unassigned guest
2. Modal opens showing guest information
3. Available tables displayed in grid format
4. User clicks on desired table
5. Assignment is processed and guest list refreshes

### 3. Viewing Table Layout
1. User clicks "📍" button next to assigned guest
2. System shows table information (capacity, occupancy)
3. Future enhancement: Navigate to visual table layout

### 4. Unassigning Guest
1. User clicks "✕" button next to assigned guest
2. Confirmation dialog appears
3. Guest is removed from table and list refreshes

## Data Flow Architecture

```
Guest List Component
    ↓ (user action)
Guest Management Component
    ↓ (API call)
Backend Services
    ↓ (database update)
Data Synchronization
    ↓ (response)
Frontend State Update
    ↓ (re-render)
Updated UI Display
```

## Integration Points

### 1. Auto Table Arrangement
- Links with existing auto-arrangement algorithm
- Respects manual assignments when auto-arranging
- Provides feedback on arrangement results

### 2. Venue Layout Manager
- Future integration for visual table highlighting
- Drag-and-drop between guest list and table layout
- Real-time capacity updates in venue view

### 3. Real-time Updates
- WebSocket integration for multi-user scenarios
- Automatic refresh when other users make changes
- Conflict resolution for simultaneous assignments

## Testing Strategy

### 1. Unit Tests
- Component rendering with different assignment states
- Handler function behavior
- Data synchronization logic

### 2. Integration Tests
- API endpoint functionality
- Database consistency checks
- Cross-component communication

### 3. User Experience Tests
- Modal interaction flow
- Responsive design validation
- Error handling scenarios

## Performance Considerations

### 1. Data Loading
- Efficient guest and table data fetching
- Minimal API calls during assignment operations
- Optimistic UI updates with rollback on failure

### 2. State Management
- Local state for UI interactions
- Server state synchronization
- Debounced updates for rapid changes

### 3. Rendering Optimization
- Memoized components for large guest lists
- Virtual scrolling for extensive data sets
- Efficient re-rendering on assignment changes

## Future Enhancements

### 1. Visual Integration
- Drag-and-drop from guest list to table layout
- Real-time highlighting of tables and guests
- Visual connection lines between related guests

### 2. Advanced Features
- Bulk assignment operations
- Assignment history and undo functionality
- Smart suggestions based on guest relationships

### 3. Mobile Experience
- Touch-optimized assignment interface
- Swipe gestures for quick actions
- Simplified modal design for small screens

## Troubleshooting

### Common Issues

#### Assignment Not Persisting
- Check API endpoint responses
- Verify database connection
- Ensure proper error handling

#### UI Not Updating
- Confirm state management flow
- Check component re-rendering triggers
- Verify data refresh mechanisms

#### Capacity Calculations Wrong
- Validate assignedGuests array synchronization
- Check for orphaned assignments
- Ensure proper cleanup on deletions

### Debug Tools

#### Browser Console
- Network tab for API call monitoring
- React DevTools for component state
- Console logs for data flow tracking

#### Backend Logs
- Database query logging
- Service method execution
- Error tracking and reporting

## Conclusion

The guest-table linking implementation provides a comprehensive solution for managing guest assignments in the RSVP Planning App. The system maintains data consistency, provides an intuitive user interface, and integrates seamlessly with existing functionality.

The bidirectional synchronization ensures that changes are reflected across all views, while the responsive design provides a consistent experience across devices. The modular architecture allows for future enhancements and easy maintenance.