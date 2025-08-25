---
inclusion: always
---

# Behavior Guidelines

## Development Workflow

### Terminal Management
- User runs frontend and backend in (http://localhost:5000) on separate terminals
- **Do not run the backend unless explicitly necessary**
- User prefers to manage their own development servers
- Focus on code changes rather than server management
- use windows powershell syntax

### Demo Mode Requirements
- **All tasks before Task 24 should use mock data and demo mode**
- Set `SKIP_DB_SETUP=true` for demo mode
- Use mock services and in-memory data
- No database or Redis setup required for early tasks

### Learning and Documentation
- Always learn from our conversations and interactions
- **Prompt to write down learnings to this steering file**, especially:
  - Duplications encountered and how to avoid them
  - Debugging approaches that worked or didn't work
  - Patterns that emerged during development
  - Common mistakes and their solutions

## Learnings from Development Sessions

### Debugging Approaches
- **Frontend Display Filtering**: When guests appear in both unseated and table sections, check if the frontend is filtering by RSVP status. Only guests with `rsvpStatus === 'accepted'` should be visible in auto-arrangement UI.
- **Data vs Display Inconsistency**: Distinguish between data-level duplicates (guest appears in multiple table.assignedGuests arrays) and display-level duplicates (frontend shows same guest in multiple places due to missing filters).
- **Single Source of Truth**: Always use `table.assignedGuests` array as the primary source for table assignments, not `guest.tableAssignment` field.

### Common Duplications to Avoid
- **Guest Table Assignment Duplicates**: Ensure consistency between `guest.tableAssignment` field and `table.assignedGuests` array. Use table's `assignedGuests` as single source of truth.
- **RSVP Status Filtering**: Only guests with `rsvpStatus === 'accepted'` should appear in auto-arrangement. Pending/declined guests should remain unseated.
- **Multiple Table Assignments**: A guest should never appear in multiple tables' `assignedGuests` arrays simultaneously.

### Effective Development Patterns
- **Additional Guests Handling**: Always account for `guest.additionalGuestCount` in capacity calculations. Total seats needed = 1 + additionalGuestCount per guest.
- **Capacity Display**: Show both guest count and total seats when they differ (e.g., "4/8 (2 guests)" means 2 guests taking 4 seats).
- **Drag & Drop Validation**: Check if available seats >= guest's total seat requirement before allowing table assignment.
- **Backend-Frontend Consistency**: Ensure both backend auto-arrangement and frontend display use the same capacity calculation logic.

### Mistakes and Solutions
- **Method Signature Mismatches**: When adding parameters to methods, ensure all calling sites are updated. Use TypeScript compiler errors to identify missing parameters.
- **Backend Service Parameter Passing**: When modifying service methods to accept additional data (like `allGuests`), update all method calls in the chain consistently.
- **Capacity Calculation Bugs**: Always account for `additionalGuestCount` in both required seats calculation AND currently occupied seats calculation.
- **Frontend-Backend Consistency**: Ensure both frontend display logic and backend auto-arrangement use identical capacity calculation formulas.
- **Tab Switching Auto-Refresh**: When components need fresh data on tab activation, use useEffect with tab state dependencies to trigger data loading automatically.
- **Parent-Child Data Flow**: Parent components should load and pass data to child components when tabs become active, child components should refresh their own data when receiving new props.
- **Drag & Drop Implementation**: Make both unseated and table guests draggable, validate capacity and lock status before allowing drops, provide clear visual feedback for all interactions.
- **Table Locking**: Use separate lock/unlock API endpoints, prevent drops on locked tables, show visual lock indicators, preserve locked table arrangements during auto-arrangement.
- **Data Synchronization**: When moving guests between tables, ensure bidirectional updates - remove from old table's assignedGuests array AND add to new table's assignedGuests array, plus update guest's tableAssignment field.
- **API Endpoint Consistency**: Frontend must use correct backend endpoints (PUT /api/guests/:id/table for assign, DELETE /api/guests/:id/table for unassign) and refresh data after operations.
- **React State Management**: Remove setTimeout calls from data refresh operations. Trust React's useEffect hooks to automatically trigger UI updates when state changes. Let useEffect([guests, tables]) handle categorizeGuests() calls.
- **Immediate UI Updates**: After drag & drop operations, call loadGuests() and loadTables() to update state, then let React's built-in state management trigger UI updates automatically without manual timing delays.