#!/usr/bin/env node

/**
 * USER TESTING CHECKPOINT: Venue and Table Management
 * 
 * This script sets up a comprehensive demo environment for testing venue layout
 * and table management functionality. It creates sample venue elements, tables,
 * and provides guided testing scenarios.
 */

const fs = require('fs');
const path = require('path');

// Demo configuration
const DEMO_EVENT_ID = 'demo-event-1';
const BASE_URL = 'http://localhost:5000/api';

// Test data for venue elements
const DEMO_VENUE_ELEMENTS = [
  {
    type: 'stage',
    name: 'Main Stage',
    position: { x: 400, y: 50 },
    dimensions: { width: 200, height: 100 },
    color: '#8B4513'
  },
  {
    type: 'dance_floor',
    name: 'Dance Floor',
    position: { x: 350, y: 200 },
    dimensions: { width: 150, height: 150 },
    color: '#FFD700'
  },
  {
    type: 'bar',
    name: 'Main Bar',
    position: { x: 100, y: 100 },
    dimensions: { width: 120, height: 60 },
    color: '#654321'
  },
  {
    type: 'bar',
    name: 'Side Bar',
    position: { x: 700, y: 300 },
    dimensions: { width: 100, height: 50 },
    color: '#654321'
  },
  {
    type: 'entrance',
    name: 'Main Entrance',
    position: { x: 50, y: 400 },
    dimensions: { width: 80, height: 40 },
    color: '#228B22'
  },
  {
    type: 'walkway',
    name: 'Center Aisle',
    position: { x: 300, y: 400 },
    dimensions: { width: 200, height: 40 },
    color: '#D3D3D3'
  },
  {
    type: 'decoration',
    name: 'Flower Arrangement 1',
    position: { x: 150, y: 250 },
    dimensions: { width: 60, height: 60 },
    color: '#FF69B4'
  },
  {
    type: 'decoration',
    name: 'Flower Arrangement 2',
    position: { x: 650, y: 150 },
    dimensions: { width: 60, height: 60 },
    color: '#FF69B4'
  }
];

// Test data for tables
const DEMO_TABLES = [
  { name: 'Table 1', capacity: 8, position: { x: 200, y: 300 } },
  { name: 'Table 2', capacity: 8, position: { x: 300, y: 300 } },
  { name: 'Table 3', capacity: 6, position: { x: 400, y: 300 } },
  { name: 'Table 4', capacity: 8, position: { x: 500, y: 300 } },
  { name: 'Table 5', capacity: 10, position: { x: 600, y: 300 } },
  { name: 'VIP Table', capacity: 6, position: { x: 250, y: 180 } },
  { name: 'Family Table', capacity: 12, position: { x: 550, y: 180 } },
  { name: 'Kids Table', capacity: 6, position: { x: 150, y: 350 } }
];

// Utility functions
async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
}

async function setupDemoVenueElements() {
  console.log('\n🏛️  Setting up demo venue elements...');
  
  const createdElements = [];
  
  for (const element of DEMO_VENUE_ELEMENTS) {
    try {
      const created = await makeRequest(`${BASE_URL}/venue-layout/events/${DEMO_EVENT_ID}/elements`, {
        method: 'POST',
        body: JSON.stringify({
          ...element,
          eventId: DEMO_EVENT_ID
        })
      });
      
      createdElements.push(created);
      console.log(`   ✓ Created ${element.name} (${element.type})`);
    } catch (error) {
      console.log(`   ⚠️  Failed to create ${element.name}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Created ${createdElements.length}/${DEMO_VENUE_ELEMENTS.length} venue elements`);
  return createdElements;
}

async function setupDemoTables() {
  console.log('\n🪑  Setting up demo tables...');
  
  const createdTables = [];
  
  for (const table of DEMO_TABLES) {
    try {
      const created = await makeRequest(`${BASE_URL}/tables`, {
        method: 'POST',
        body: JSON.stringify({
          ...table,
          eventId: DEMO_EVENT_ID
        })
      });
      
      createdTables.push(created);
      console.log(`   ✓ Created ${table.name} (capacity: ${table.capacity})`);
    } catch (error) {
      console.log(`   ⚠️  Failed to create ${table.name}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Created ${createdTables.length}/${DEMO_TABLES.length} tables`);
  return createdTables;
}

async function lockSampleTables(tables) {
  console.log('\n🔒 Locking sample tables for testing...');
  
  // Lock the VIP table and Family table
  const tablesToLock = tables.filter(t => 
    t.name === 'VIP Table' || t.name === 'Family Table'
  );
  
  for (const table of tablesToLock) {
    try {
      await makeRequest(`${BASE_URL}/tables/${table.id}/lock`, {
        method: 'POST'
      });
      console.log(`   🔒 Locked ${table.name}`);
    } catch (error) {
      console.log(`   ⚠️  Failed to lock ${table.name}: ${error.message}`);
    }
  }
}

async function validateLayout() {
  console.log('\n✅ Validating venue layout and table arrangement...');
  
  try {
    // Validate venue layout
    const venueValidation = await makeRequest(`${BASE_URL}/venue-layout/events/${DEMO_EVENT_ID}/validate`);
    console.log('   🏛️  Venue Layout Validation:');
    console.log(`      Status: ${venueValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (venueValidation.errors.length > 0) {
      console.log('      Errors:');
      venueValidation.errors.forEach(error => console.log(`        - ${error}`));
    }
    
    if (venueValidation.warnings.length > 0) {
      console.log('      Warnings:');
      venueValidation.warnings.forEach(warning => console.log(`        - ${warning}`));
    }
    
    if (venueValidation.overlappingElements.length > 0) {
      console.log(`      Overlapping Elements: ${venueValidation.overlappingElements.length} pairs`);
    }
    
    // Validate table arrangement
    const tableValidation = await makeRequest(`${BASE_URL}/tables/events/${DEMO_EVENT_ID}/validate`);
    console.log('   🪑  Table Arrangement Validation:');
    console.log(`      Status: ${tableValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (tableValidation.errors.length > 0) {
      console.log('      Errors:');
      tableValidation.errors.forEach(error => console.log(`        - ${error}`));
    }
    
    if (tableValidation.warnings.length > 0) {
      console.log('      Warnings:');
      tableValidation.warnings.forEach(warning => console.log(`        - ${warning}`));
    }
    
  } catch (error) {
    console.log(`   ⚠️  Validation failed: ${error.message}`);
  }
}

async function displayCapacityInfo() {
  console.log('\n📊 Table capacity information:');
  
  try {
    const capacityInfo = await makeRequest(`${BASE_URL}/tables/events/${DEMO_EVENT_ID}/capacity`);
    
    capacityInfo.forEach(info => {
      const status = info.isOverCapacity ? '⚠️  OVER' : 
                    info.occupied === info.capacity ? '🔴 FULL' :
                    info.occupied === 0 ? '⚪ EMPTY' : '🟢 AVAILABLE';
      
      console.log(`   ${status} ${info.name}: ${info.occupied}/${info.capacity} guests`);
    });
    
  } catch (error) {
    console.log(`   ⚠️  Failed to get capacity info: ${error.message}`);
  }
}

function displayTestingInstructions() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 USER TESTING INSTRUCTIONS: Venue and Table Management');
  console.log('='.repeat(80));
  
  console.log('\n📋 TESTING SCENARIOS:');
  
  console.log('\n1. 🏛️  VENUE ELEMENT TESTING:');
  console.log('   • Open the web application and navigate to venue management');
  console.log('   • Test drag-and-drop positioning of existing elements');
  console.log('   • Test resizing elements using corner handles');
  console.log('   • Add new elements from the element library');
  console.log('   • Test element selection and property editing');
  console.log('   • Test element duplication and deletion');
  console.log('   • Verify element validation and overlap detection');
  
  console.log('\n2. 🪑  TABLE MANAGEMENT TESTING:');
  console.log('   • Test table creation by double-clicking on canvas');
  console.log('   • Test drag-and-drop table positioning');
  console.log('   • Test table capacity editing and validation');
  console.log('   • Test table locking and unlocking (VIP and Family tables are pre-locked)');
  console.log('   • Test table duplication and deletion');
  console.log('   • Verify capacity information display');
  console.log('   • Test table arrangement validation');
  
  console.log('\n3. 🔄 INTEGRATED TESTING:');
  console.log('   • Switch between venue and table modes');
  console.log('   • Test combined layout with both elements and tables');
  console.log('   • Verify zoom controls work properly');
  console.log('   • Test validation of complete layout');
  console.log('   • Test responsive behavior on different screen sizes');
  
  console.log('\n4. 🎯 SPECIFIC TEST CASES:');
  console.log('   • Try to overlap elements and verify warnings');
  console.log('   • Try to delete a table with assigned guests (should fail)');
  console.log('   • Test locked table behavior during auto-arrangement');
  console.log('   • Test capacity validation when reducing table size');
  console.log('   • Test element library drag-and-drop functionality');
  
  console.log('\n5. 🐛 ERROR HANDLING TESTING:');
  console.log('   • Test invalid table positions (negative coordinates)');
  console.log('   • Test invalid capacity values (0 or negative)');
  console.log('   • Test network error scenarios (disconnect backend)');
  console.log('   • Test concurrent editing scenarios');
  
  console.log('\n📱 MOBILE TESTING (if applicable):');
  console.log('   • Test touch-based drag-and-drop');
  console.log('   • Test pinch-to-zoom functionality');
  console.log('   • Test responsive layout on mobile screens');
  console.log('   • Test touch-friendly controls and buttons');
  
  console.log('\n🔍 VALIDATION CHECKLIST:');
  console.log('   ✅ All venue elements can be created, moved, and resized');
  console.log('   ✅ All tables can be created, moved, and configured');
  console.log('   ✅ Locking/unlocking functionality works correctly');
  console.log('   ✅ Validation detects and reports issues appropriately');
  console.log('   ✅ Capacity information is accurate and updates in real-time');
  console.log('   ✅ Drag-and-drop is smooth and responsive');
  console.log('   ✅ UI is intuitive and user-friendly');
  console.log('   ✅ Error messages are clear and helpful');
  
  console.log('\n🚀 TO START TESTING:');
  console.log('   1. Ensure the backend server is running (npm run dev:backend)');
  console.log('   2. Ensure the web frontend is running (npm run dev:web)');
  console.log('   3. Open http://localhost:3000 in your browser');
  console.log('   4. Navigate to the venue/table management section');
  console.log('   5. Follow the testing scenarios above');
  
  console.log('\n📝 FEEDBACK COLLECTION:');
  console.log('   • Note any bugs or unexpected behavior');
  console.log('   • Rate the user experience (1-10)');
  console.log('   • Suggest improvements for usability');
  console.log('   • Test performance with large numbers of elements/tables');
  console.log('   • Verify all requirements from the spec are met');
  
  console.log('\n' + '='.repeat(80));
}

function displayDemoSummary(elements, tables) {
  console.log('\n📋 DEMO ENVIRONMENT SUMMARY:');
  console.log('='.repeat(50));
  
  console.log(`\n🏛️  Venue Elements (${elements.length}):`);
  elements.forEach(element => {
    console.log(`   • ${element.name} (${element.type}) at (${element.position.x}, ${element.position.y})`);
  });
  
  console.log(`\n🪑  Tables (${tables.length}):`);
  tables.forEach(table => {
    const lockStatus = table.isLocked ? '🔒' : '🔓';
    console.log(`   ${lockStatus} ${table.name} - Capacity: ${table.capacity} at (${table.position.x}, ${table.position.y})`);
  });
  
  console.log('\n🎯 Key Features to Test:');
  console.log('   • Drag-and-drop positioning');
  console.log('   • Element/table creation and deletion');
  console.log('   • Resizing and property editing');
  console.log('   • Locking/unlocking tables');
  console.log('   • Layout validation');
  console.log('   • Capacity management');
  console.log('   • Element library usage');
  
  console.log('\n🔗 Access Points:');
  console.log('   • Web App: http://localhost:3000');
  console.log('   • API Base: http://localhost:3001/api');
  console.log('   • Event ID: ' + DEMO_EVENT_ID);
}

async function createTestHTML() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Venue & Table Management Testing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
        }
        .test-scenario {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #dee2e6;
        }
        .checklist {
            list-style: none;
            padding: 0;
        }
        .checklist li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .checklist li:before {
            content: "☐ ";
            margin-right: 10px;
        }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .demo-data {
            background: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
        }
        .quick-links {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        .quick-links a {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .quick-links a:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Venue & Table Management Testing</h1>
        <p>User Testing Checkpoint - Task 13</p>
    </div>

    <div class="quick-links">
        <a href="http://localhost:3000" target="_blank">🌐 Open Web App</a>
        <a href="http://localhost:5000/api/venue-layout/events/${DEMO_EVENT_ID}" target="_blank">📊 Venue API</a>
        <a href="http://localhost:5000/api/tables/events/${DEMO_EVENT_ID}" target="_blank">🪑 Tables API</a>
    </div>

    <div class="section">
        <h2>🎯 Testing Objectives</h2>
        <p>This checkpoint validates the venue layout and table management functionality, including:</p>
        <ul>
            <li>Venue element creation, positioning, and management</li>
            <li>Table creation, capacity management, and positioning</li>
            <li>Drag-and-drop functionality for venue design</li>
            <li>Table locking and unlocking features</li>
            <li>Layout validation and conflict detection</li>
            <li>Integrated venue and table management interface</li>
        </ul>
    </div>

    <div class="section">
        <h2>🏛️ Venue Element Testing</h2>
        <div class="test-scenario">
            <h3>Scenario 1: Element Library Usage</h3>
            <ul class="checklist">
                <li>Open element library panel</li>
                <li>Drag elements from library to canvas</li>
                <li>Verify elements appear with correct default properties</li>
                <li>Test different element types (stage, bar, dance floor, etc.)</li>
            </ul>
        </div>
        
        <div class="test-scenario">
            <h3>Scenario 2: Element Manipulation</h3>
            <ul class="checklist">
                <li>Select existing elements by clicking</li>
                <li>Drag elements to new positions</li>
                <li>Resize elements using corner handles</li>
                <li>Edit element properties (name, color)</li>
                <li>Duplicate and delete elements</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>🪑 Table Management Testing</h2>
        <div class="test-scenario">
            <h3>Scenario 3: Table Creation and Configuration</h3>
            <ul class="checklist">
                <li>Double-click canvas to create new tables</li>
                <li>Edit table names and capacity</li>
                <li>Verify capacity validation (positive numbers only)</li>
                <li>Test table positioning via drag-and-drop</li>
            </ul>
        </div>
        
        <div class="test-scenario">
            <h3>Scenario 4: Table Locking Features</h3>
            <ul class="checklist">
                <li>Lock tables using the lock button</li>
                <li>Verify locked tables show lock indicator</li>
                <li>Test that locked tables resist auto-arrangement</li>
                <li>Unlock tables and verify functionality</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>🔄 Integrated Testing</h2>
        <div class="test-scenario">
            <h3>Scenario 5: Combined Layout Management</h3>
            <ul class="checklist">
                <li>Switch between venue and table modes</li>
                <li>Test zoom controls (+ / - buttons)</li>
                <li>Verify both elements and tables are visible</li>
                <li>Test layout validation for complete venue</li>
                <li>Check capacity information panel</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>📊 Demo Data Summary</h2>
        <div class="demo-data">
Event ID: ${DEMO_EVENT_ID}

Venue Elements: ${DEMO_VENUE_ELEMENTS.length}
- Main Stage (stage)
- Dance Floor (dance_floor) 
- Main Bar & Side Bar (bar)
- Main Entrance (entrance)
- Center Aisle (walkway)
- Flower Arrangements (decoration)

Tables: ${DEMO_TABLES.length}
- Regular tables (Table 1-5)
- VIP Table (pre-locked)
- Family Table (pre-locked)
- Kids Table

Locked Tables: 2 (VIP Table, Family Table)
        </div>
    </div>

    <div class="section">
        <h2>✅ Validation Checklist</h2>
        <ul class="checklist">
            <li>All venue elements can be created and manipulated</li>
            <li>All tables can be created and configured</li>
            <li>Drag-and-drop is smooth and responsive</li>
            <li>Locking/unlocking works correctly</li>
            <li>Validation detects overlaps and conflicts</li>
            <li>Capacity information is accurate</li>
            <li>UI is intuitive and user-friendly</li>
            <li>Error handling is appropriate</li>
            <li>Performance is acceptable with demo data</li>
            <li>All requirements from spec are met</li>
        </ul>
    </div>

    <div class="section">
        <h2>🐛 Known Issues to Test</h2>
        <ul>
            <li>Element overlap detection and warnings</li>
            <li>Table capacity validation edge cases</li>
            <li>Concurrent editing scenarios</li>
            <li>Network error handling</li>
            <li>Mobile responsiveness (if applicable)</li>
        </ul>
    </div>

    <div class="section">
        <h2>📝 Feedback Collection</h2>
        <p>After testing, please provide feedback on:</p>
        <ul>
            <li><strong>Usability:</strong> How intuitive is the interface?</li>
            <li><strong>Performance:</strong> Are operations smooth and responsive?</li>
            <li><strong>Functionality:</strong> Do all features work as expected?</li>
            <li><strong>Bugs:</strong> Any unexpected behavior or errors?</li>
            <li><strong>Improvements:</strong> What could be enhanced?</li>
        </ul>
    </div>

    <script>
        // Add click handlers for checklist items
        document.querySelectorAll('.checklist li').forEach(item => {
            item.addEventListener('click', function() {
                if (this.style.textDecoration === 'line-through') {
                    this.style.textDecoration = 'none';
                    this.style.color = 'inherit';
                    this.innerHTML = this.innerHTML.replace('☑', '☐');
                } else {
                    this.style.textDecoration = 'line-through';
                    this.style.color = '#28a745';
                    this.innerHTML = this.innerHTML.replace('☐', '☑');
                }
            });
        });

        // Auto-refresh demo data every 30 seconds
        setInterval(() => {
            const timestamp = new Date().toLocaleTimeString();
            console.log('Demo environment active at', timestamp);
        }, 30000);
    </script>
</body>
</html>`;

  fs.writeFileSync('test-venue-table-management.html', htmlContent);
  console.log('\n📄 Created test-venue-table-management.html for browser-based testing');
}

// Main execution
async function main() {
  console.log('🧪 USER TESTING CHECKPOINT: Venue and Table Management');
  console.log('=' .repeat(60));
  
  try {
    // Setup demo data
    const elements = await setupDemoVenueElements();
    const tables = await setupDemoTables();
    
    // Configure some tables as locked for testing
    await lockSampleTables(tables);
    
    // Validate the layout
    await validateLayout();
    
    // Display capacity information
    await displayCapacityInfo();
    
    // Create HTML test page
    await createTestHTML();
    
    // Display summary and instructions
    displayDemoSummary(elements, tables);
    displayTestingInstructions();
    
    console.log('\n🎉 Demo environment setup complete!');
    console.log('📄 Open test-venue-table-management.html in your browser for guided testing');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure backend server is running: npm run dev:backend');
    console.log('   • Check that SKIP_DB_SETUP=true is set for demo mode');
    console.log('   • Verify API endpoints are accessible');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupDemoVenueElements,
  setupDemoTables,
  validateLayout,
  displayCapacityInfo,
  DEMO_EVENT_ID
};