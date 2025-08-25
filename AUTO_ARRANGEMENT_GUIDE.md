# Auto Table Arrangement Feature Guide

## Overview

The Auto Table Arrangement feature provides an intelligent and user-friendly way to automatically assign guests to tables while also allowing manual drag-and-drop adjustments. This feature is designed to make table planning intuitive and efficient for event organizers.

## Key Features

### 🤖 Intelligent Auto-Arrangement
- **Family Grouping**: Keeps families and related guests together at the same table
- **Relationship Respect**: Groups guests by relationship type (family, friends, colleagues)
- **Bride/Groom Side Balance**: Optionally balances guests from bride and groom sides
- **Dietary Considerations**: Can consider dietary restrictions when grouping guests
- **Capacity Management**: Respects table capacity limits and prevents over-assignment

### 🖱️ Drag-and-Drop Interface
- **Intuitive Guest Assignment**: Drag guests from unseated list to specific tables
- **Easy Reassignment**: Move guests between tables with simple drag-and-drop
- **Visual Feedback**: Clear visual indicators for drag operations and table capacity
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 📊 Smart Guest Management
- **Seated/Unseated Lists**: Clear categorization of assigned and unassigned guests
- **Real-time Updates**: Instant updates when guests are assigned or moved
- **Capacity Indicators**: Visual display of table occupancy and available spots
- **Guest Information**: Shows guest details like relationship type and bride/groom side

## User Interface Components

### Web Interface (`rsvp-web/src/components/AutoTableArrangement.tsx`)

#### Main Sections:
1. **Header Controls**
   - Auto Arrange button with loading state
   - Refresh button to reload data
   - Real-time arrangement status

2. **Auto-Arrangement Options Panel**
   - Respect Relationships checkbox
   - Balance Bride/Groom Sides checkbox
   - Consider Dietary Restrictions checkbox
   - Keep Families Together checkbox
   - Max Guests Per Table input (4-12 range)

3. **Guest Lists**
   - **Unseated Guests**: List of guests not assigned to any table
   - **Seated Guests**: List of guests already assigned to tables
   - Drag-and-drop enabled for both lists

4. **Table Layout Grid**
   - Visual representation of all tables
   - Shows table name, capacity, and current occupancy
   - Drop zones for guest assignment
   - Color-coded indicators:
     - Normal: Blue border
     - Over-capacity: Red border and background
     - Locked: Gray border and background

5. **Statistics Panel**
   - Total guests count
   - Seated vs unseated breakdown
   - Number of tables available

### Mobile Interface (`rsvp-mobile/components/AutoTableArrangement.tsx`)

#### Mobile-Optimized Features:
- Touch-friendly interface with larger touch targets
- Alert-based table selection for guest assignment
- Scrollable lists with nested scrolling support
- Responsive layout that adapts to different screen sizes
- Native mobile styling with React Native StyleSheet

## Backend Implementation

### API Endpoints

#### Auto-Arrangement Endpoint
```
POST /api/tables/events/:eventId/auto-arrange
```

**Request Body:**
```json
{
  "respectRelationships": true,
  "balanceBrideGroomSides": true,
  "considerDietaryRestrictions": false,
  "keepFamiliesTogether": true,
  "maxGuestsPerTable": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully arranged 24 guests across 3 tables",
  "arrangedGuests": 24
}
```

### Service Layer

#### TableService (`rsvp-backend/src/services/TableService.ts`)
- `autoArrangeGuests()`: Main auto-arrangement algorithm
- `groupGuestsForArrangement()`: Groups guests based on relationships and preferences
- Handles both production database and demo mode

#### MockTableService (`rsvp-backend/src/services/MockTableService.ts`)
- Demo mode implementation with in-memory data
- Same interface as production service
- Perfect for testing and demonstrations

## Auto-Arrangement Algorithm

### Step-by-Step Process:

1. **Data Collection**
   - Retrieve all guests for the event
   - Get available (unlocked) tables
   - Validate that tables are available

2. **Guest Unassignment**
   - Clear all existing table assignments
   - Prepare for fresh arrangement

3. **Guest Grouping**
   - Group by family relationships if enabled
   - Consider bride/groom side preferences
   - Respect dietary restrictions if enabled
   - Split large groups that exceed table capacity

4. **Table Assignment**
   - Assign guest groups to tables sequentially
   - Respect table capacity limits
   - Move to next table when current is full
   - Handle overflow gracefully

5. **Result Reporting**
   - Return success/failure status
   - Provide detailed message about arrangement
   - Report number of guests successfully arranged

### Grouping Logic:

```typescript
// Family key generation
const familyKey = `${guest.brideOrGroomSide}-${guest.relationshipType}`;

// Examples:
// "bride-Parent" - Parents of the bride
// "groom-Sibling" - Siblings of the groom  
// "bride-Friend" - Friends of the bride
```

## Integration with Venue Management

### IntegratedVenueManager Integration
The auto-arrangement feature is seamlessly integrated into the existing venue management system:

1. **Mode Selection**: Added "Auto Arrangement" tab alongside "Venue Elements" and "Tables"
2. **Data Synchronization**: Shares table data with other venue management modes
3. **Real-time Updates**: Changes reflect immediately across all modes
4. **Consistent UI**: Maintains the same design language and user experience

## Usage Instructions

### For Event Organizers:

1. **Access the Feature**
   - Navigate to Venue Management
   - Click on "Auto Arrangement" tab

2. **Configure Options**
   - Check desired arrangement preferences
   - Set maximum guests per table (typically 6-10)
   - Consider your event's specific needs

3. **Run Auto-Arrangement**
   - Click "Auto Arrange" button
   - Wait for completion (usually 1-3 seconds)
   - Review the automatic assignments

4. **Manual Adjustments**
   - Drag guests between tables as needed
   - Move guests to unseated list if necessary
   - Fine-tune the arrangement to your preferences

5. **Validation**
   - Check table capacity indicators
   - Ensure no tables are over-capacity
   - Verify guest satisfaction with seating

### Best Practices:

1. **Start with Auto-Arrangement**
   - Use auto-arrangement as a starting point
   - Let the algorithm handle the bulk assignment
   - Make manual adjustments afterward

2. **Consider Relationships**
   - Enable "Keep Families Together" for family events
   - Use "Respect Relationships" for mixed events
   - Balance bride/groom sides for weddings

3. **Table Capacity Planning**
   - Set realistic maximum guests per table
   - Consider table size and comfort
   - Leave some buffer for last-minute additions

4. **Lock Important Tables**
   - Lock VIP tables or special arrangements
   - Prevent auto-arrangement from changing critical assignments
   - Use locked tables for head table, family tables, etc.

## Technical Architecture

### Frontend Architecture:
```
AutoTableArrangement Component
├── State Management (React hooks)
├── Guest Categorization Logic
├── Drag & Drop Handlers
├── API Integration
└── Responsive UI Components
```

### Backend Architecture:
```
Auto-Arrangement API
├── Route Handler (/api/tables/events/:eventId/auto-arrange)
├── TableService.autoArrangeGuests()
├── Guest Grouping Algorithm
├── Table Assignment Logic
└── Result Validation
```

### Data Flow:
1. User configures options in UI
2. Frontend sends POST request to backend
3. Backend processes auto-arrangement
4. Algorithm groups and assigns guests
5. Backend returns results
6. Frontend refreshes guest lists
7. UI updates with new assignments

## Testing

### Automated Testing:
- Component existence verification
- API endpoint validation
- Algorithm logic testing
- UI interaction testing

### Manual Testing Checklist:
- [ ] Auto-arrangement completes successfully
- [ ] Drag and drop works smoothly
- [ ] Table capacity is respected
- [ ] Guest grouping follows preferences
- [ ] Mobile interface is responsive
- [ ] Error handling works properly
- [ ] Data persists correctly

## Troubleshooting

### Common Issues:

1. **Auto-arrangement fails**
   - Check if tables are available and unlocked
   - Verify guest data is loaded properly
   - Ensure backend service is running

2. **Drag and drop not working**
   - Check browser compatibility
   - Verify touch events on mobile
   - Ensure proper event handlers are attached

3. **Table over-capacity**
   - Review auto-arrangement options
   - Check if table capacities are set correctly
   - Manually reassign guests if needed

4. **Performance issues**
   - Optimize for large guest lists (100+ guests)
   - Consider pagination for very large events
   - Monitor API response times

## Future Enhancements

### Potential Improvements:
1. **Advanced Algorithms**
   - Machine learning for optimal seating
   - Conflict detection and resolution
   - Guest preference integration

2. **Enhanced UI**
   - Visual table layout editor
   - Undo/redo functionality
   - Bulk guest operations

3. **Integration Features**
   - Import from external systems
   - Export seating charts
   - Print-friendly layouts

4. **Analytics**
   - Seating arrangement analytics
   - Guest satisfaction metrics
   - Optimization suggestions

## Conclusion

The Auto Table Arrangement feature provides a comprehensive solution for event seating management, combining intelligent automation with intuitive manual control. It significantly reduces the time and effort required for table planning while ensuring guest satisfaction and event success.

The feature is designed to be user-friendly, efficient, and flexible, making it suitable for events of all sizes and types. With its responsive design and cross-platform compatibility, event organizers can manage seating arrangements from any device, anywhere.