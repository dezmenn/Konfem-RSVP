# Integrated Venue Management Guide

## Overview

The Integrated Venue Management system combines venue layout design with table management in a unified interface. This feature allows event organizers to visually design their venue layout while simultaneously managing table arrangements and guest seating.

## Key Features

### 🏢 Venue Layout Design
- **Visual Canvas**: Interactive drag-and-drop canvas for venue design
- **Element Library**: Pre-built venue elements (stage, dance floor, bar, entrance, etc.)
- **Custom Elements**: Create custom venue elements with configurable properties
- **Real-time Positioning**: Precise positioning with coordinate system
- **Zoom Controls**: Scale view from 50% to 200% for detailed work

### 🪑 Table Management
- **Table Placement**: Visual table positioning on venue canvas
- **Capacity Management**: Set and monitor table capacity limits
- **Guest Assignment**: Track assigned guests per table
- **Table Locking**: Lock tables to prevent auto-arrangement changes
- **Capacity Monitoring**: Real-time capacity tracking with overflow warnings

### 🔄 Integrated Features
- **Dual Mode Interface**: Switch between layout design and table management
- **Unified Validation**: Comprehensive layout and table arrangement validation
- **Cross-platform Support**: Consistent experience on web and mobile
- **Real-time Updates**: Live synchronization across all connected clients

## Web Interface Components

### Main Interface
```typescript
interface IntegratedVenueManagerProps {
  eventId: string;
}
```

### Key UI Elements
- **Mode Selector**: Toggle between 'layout' and 'tables' modes
- **Element Library**: Draggable venue elements with icons and descriptions
- **Venue Canvas**: Interactive design surface with grid background
- **Properties Panel**: Edit selected elements and tables
- **Capacity Panel**: Monitor table occupancy and capacity
- **Validation Results**: Display layout validation feedback

### Element Library Items
| Element | Icon | Default Size | Description |
|---------|------|--------------|-------------|
| Stage | 🎭 | 200×100 | Main stage or altar area |
| Dance Floor | 💃 | 150×150 | Dance floor area |
| Bar | 🍸 | 120×60 | Bar or beverage station |
| Entrance | 🚪 | 80×40 | Main entrance or doorway |
| Walkway | 🛤️ | 200×40 | Walkway or aisle |
| Decoration | 🌸 | 60×60 | Decorative element |

## Mobile Interface Components

### Features
- **Touch-Optimized**: Designed for mobile interaction patterns
- **List-Based Management**: Scrollable lists for elements and tables
- **Modal Editing**: Full-screen modals for creating and editing items
- **Validation Integration**: Mobile-friendly validation results
- **Action Panels**: Context-sensitive action buttons

### Mobile-Specific UI
- **Tab Navigation**: Switch between venue elements and tables
- **Card-Based Layout**: Touch-friendly item cards with status indicators
- **Modal Forms**: Full-screen forms for creating and editing
- **Alert Integration**: Native alert dialogs for confirmations

## API Endpoints

### Venue Layout Endpoints
```
POST   /api/venue-layout              # Create venue element
GET    /api/venue-layout/:eventId     # Get venue layout
PUT    /api/venue-layout/:id          # Update venue element
DELETE /api/venue-layout/:id          # Delete venue element
GET    /api/venue-layout/:eventId/validate # Validate layout
```

### Table Management Endpoints
```
POST   /api/tables                    # Create table
GET    /api/tables/event/:eventId     # Get event tables
PUT    /api/tables/:id                # Update table
DELETE /api/tables/:id                # Delete table
POST   /api/tables/:id/lock           # Lock table
POST   /api/tables/:id/unlock         # Unlock table
GET    /api/tables/event/:eventId/capacity # Get capacity info
GET    /api/tables/event/:eventId/validate # Validate tables
```

## Usage Workflow

### 1. Layout Design Mode
1. **Select Layout Mode**: Click "Layout Design" in mode selector
2. **Browse Element Library**: View available venue elements
3. **Drag & Drop Elements**: Drag elements from library to canvas
4. **Position Elements**: Click and drag to reposition elements
5. **Edit Properties**: Select elements to edit name, position, size
6. **Validate Layout**: Check for overlaps and layout issues

### 2. Table Management Mode
1. **Select Table Mode**: Click "Table Management" in mode selector
2. **Add Tables**: Click on canvas to create new tables
3. **Set Capacity**: Configure table seating capacity
4. **Monitor Occupancy**: View assigned guests per table
5. **Lock Tables**: Prevent auto-arrangement changes
6. **Validate Arrangement**: Check capacity and positioning

### 3. Integrated Workflow
1. **Design Venue**: Create overall venue layout with elements
2. **Place Tables**: Add tables within the designed space
3. **Validate Everything**: Run comprehensive validation
4. **Assign Guests**: Use table management for guest seating
5. **Final Review**: Ensure layout meets all requirements

## Validation System

### Layout Validation
- **Overlap Detection**: Identifies overlapping venue elements
- **Boundary Checking**: Ensures elements stay within venue bounds
- **Size Validation**: Warns about very small or large elements
- **Accessibility**: Checks for adequate walkways and access

### Table Validation
- **Capacity Checking**: Identifies over-capacity tables
- **Position Conflicts**: Detects overlapping table positions
- **Assignment Validation**: Ensures all guests have table assignments
- **Lock Status**: Respects locked table constraints

### Validation Results
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  overlappingElements?: OverlapInfo[];
  conflicts?: ConflictInfo[];
}
```

## Best Practices

### Layout Design
1. **Start with Major Elements**: Place stage, dance floor, and bar first
2. **Plan Traffic Flow**: Ensure clear walkways between areas
3. **Consider Sightlines**: Position elements for optimal viewing
4. **Leave Space**: Allow adequate space around each element
5. **Use Validation**: Regularly validate layout during design

### Table Management
1. **Standard Spacing**: Maintain consistent spacing between tables
2. **Capacity Planning**: Set realistic table capacities (6-10 guests)
3. **Lock Important Tables**: Lock VIP or family tables
4. **Monitor Occupancy**: Keep track of table assignments
5. **Plan for Accessibility**: Ensure wheelchair accessible paths

### Integration Tips
1. **Design First**: Complete venue layout before placing tables
2. **Validate Often**: Run validation after major changes
3. **Use Both Modes**: Switch between modes for comprehensive planning
4. **Save Frequently**: Changes are auto-saved but validate regularly
5. **Test on Mobile**: Verify layout works on mobile devices

## Troubleshooting

### Common Issues
1. **Elements Not Appearing**: Check if element is within canvas bounds
2. **Validation Errors**: Review overlap detection and spacing
3. **Table Capacity Issues**: Verify guest assignments and limits
4. **Mobile Display**: Ensure responsive design works on small screens
5. **Performance**: Large layouts may require optimization

### Error Messages
- **"Element overlaps with existing element"**: Adjust positioning
- **"Table is over capacity"**: Reduce assignments or increase capacity
- **"Layout validation failed"**: Review errors and warnings
- **"Cannot delete table with assigned guests"**: Reassign guests first

## Technical Implementation

### Frontend Architecture
- **React Components**: Modular component design
- **Canvas Rendering**: HTML5 canvas with SVG elements
- **State Management**: React hooks for local state
- **API Integration**: RESTful API calls for persistence
- **Responsive Design**: Mobile-first responsive layout

### Backend Services
- **VenueLayoutService**: Manages venue elements and validation
- **TableService**: Handles table operations and capacity
- **Repository Pattern**: Data access abstraction
- **Validation Engine**: Comprehensive layout validation
- **Mock Services**: Demo mode support

### Data Models
```typescript
interface VenueElement {
  id: string;
  type: 'stage' | 'walkway' | 'decoration' | 'entrance' | 'bar' | 'dance_floor' | 'custom';
  name: string;
  position: Position;
  dimensions: Dimensions;
  color: string;
  eventId: string;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  position: Position;
  isLocked: boolean;
  assignedGuests: string[];
  eventId: string;
}
```

## Future Enhancements

### Planned Features
1. **3D Visualization**: Three-dimensional venue preview
2. **Template Library**: Pre-designed venue templates
3. **Collaborative Editing**: Multi-user real-time editing
4. **Export Options**: PDF and image export capabilities
5. **Advanced Analytics**: Layout optimization suggestions

### Integration Opportunities
1. **Guest Management**: Direct guest assignment from venue view
2. **Catering Integration**: Link table arrangements to meal planning
3. **Vendor Coordination**: Share layouts with vendors and staff
4. **Timeline Integration**: Coordinate layout with event schedule
5. **Budget Planning**: Cost estimation based on layout complexity

## Testing

Run the integrated venue management tests:

```bash
node test-integrated-venue-management.js
```

This will test:
- Venue layout API functionality
- Table management integration
- Frontend component validation
- Element library operations
- Drag & drop simulation

## Support

For issues or questions about the Integrated Venue Management system:

1. **Check Validation**: Run layout validation for specific error messages
2. **Review Logs**: Check browser console for detailed error information
3. **Test API**: Verify backend services are running correctly
4. **Mobile Testing**: Test functionality on actual mobile devices
5. **Documentation**: Refer to this guide for usage instructions

The Integrated Venue Management system provides a comprehensive solution for event venue planning, combining visual design tools with practical table management in a unified, user-friendly interface.