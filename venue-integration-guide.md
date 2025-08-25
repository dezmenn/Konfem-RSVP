# Venue Management Integration Guide

## 🎯 Component Integration

The venue management system consists of three main components:

### 1. VenueLayoutManager
- **Purpose**: Manages venue elements (stage, bar, decorations, etc.)
- **Features**: Drag-and-drop, resizing, element library
- **Usage**: Standalone venue design

### 2. TableManagement  
- **Purpose**: Manages table creation and positioning
- **Features**: Table creation, capacity management, locking
- **Usage**: Standalone table arrangement

### 3. IntegratedVenueManager
- **Purpose**: Combined venue and table management
- **Features**: Unified interface with mode switching
- **Usage**: Complete venue design workflow

## 🔧 Integration Steps

### Step 1: Import Components
```tsx
import IntegratedVenueManager from './components/IntegratedVenueManager';
// OR individual components:
import VenueLayoutManager from './components/VenueLayoutManager';
import TableManagement from './components/TableManagement';
```

### Step 2: Add to App Component
```tsx
function App() {
  return (
    <div className="App">
      <h1>RSVP Planning App</h1>
      
      {/* Integrated venue management */}
      <IntegratedVenueManager 
        eventId="demo-event-1"
        onElementSelect={(element) => console.log('Selected element:', element)}
        onTableSelect={(table) => console.log('Selected table:', table)}
        onLayoutChange={(elements, tables) => console.log('Layout changed')}
      />
      
      {/* OR separate components */}
      <VenueLayoutManager eventId="demo-event-1" />
      <TableManagement eventId="demo-event-1" />
    </div>
  );
}
```

### Step 3: Add Routing (Optional)
```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/venue" element={
          <IntegratedVenueManager eventId="demo-event-1" />
        } />
      </Routes>
    </Router>
  );
}
```

## 📱 Component Props

### IntegratedVenueManager Props
```tsx
interface IntegratedVenueManagerProps {
  eventId: string;                    // Required: Event identifier
  onElementSelect?: (element: VenueElement | null) => void;
  onTableSelect?: (table: Table | null) => void;
  onLayoutChange?: (elements: VenueElement[], tables: Table[]) => void;
}
```

### VenueLayoutManager Props
```tsx
interface VenueLayoutManagerProps {
  eventId: string;                    // Required: Event identifier
  onElementSelect?: (element: VenueElement | null) => void;
  onLayoutChange?: (elements: VenueElement[]) => void;
}
```

### TableManagement Props
```tsx
interface TableManagementProps {
  eventId: string;                    // Required: Event identifier
  onTableSelect?: (table: Table | null) => void;
  onTableChange?: (tables: Table[]) => void;
}
```

## 🎨 Styling

Each component has its own CSS file:
- `VenueLayoutManager.css`
- `TableManagement.css`
- `IntegratedVenueManager.css`

The CSS is automatically imported by the components.

## 🔌 API Dependencies

Components require these API endpoints to be available:
- `/api/venue-layout/*` - Venue element management
- `/api/tables/*` - Table management
- Backend server running on http://localhost:5000

## 🧪 Testing Integration

1. **Start Backend**: `npm run dev:backend`
2. **Start Frontend**: `npm run dev:web`
3. **Load Demo Data**: `node test-venue-table-management.js`
4. **Open Browser**: http://localhost:3000
5. **Navigate to Venue Section**

## 🐛 Troubleshooting

### Component Not Rendering
- Check console for import errors
- Verify backend API is running
- Check network requests in DevTools

### Drag-and-Drop Not Working
- Verify mouse event handlers are attached
- Check CSS for pointer-events: none
- Test with different browsers

### API Errors
- Check backend server is running on port 5000
- Verify SKIP_DB_SETUP=true for demo mode
- Check network connectivity

## 📋 Integration Checklist

- [ ] Components imported correctly
- [ ] Props passed with valid eventId
- [ ] CSS styles loading properly
- [ ] Backend API accessible
- [ ] Demo data loaded
- [ ] Drag-and-drop working
- [ ] Validation working
- [ ] Error handling working
