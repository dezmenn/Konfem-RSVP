#!/usr/bin/env node

/**
 * Demo Setup Script for RSVP Planning App
 * 
 * This script sets up a complete demo environment for testing guest management functionality.
 * It includes:
 * - Sample event data
 * - Diverse guest list with various relationship types and dietary restrictions
 * - Sample CSV file for import testing
 * - Mock contact data for mobile testing
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up RSVP Planning App Demo Environment...\n');

// Create sample CSV file for testing CSV import
const sampleCSVContent = `name,phone_number,dietary_restrictions,additional_guest_count,relationship_type,bride_or_groom_side,special_requests
"Jennifer Martinez","+1555123456","Vegetarian,Gluten-free",1,"Friend","bride","Please seat near the dance floor"
"Thomas Anderson","+1555123457","",0,"Colleague","groom",""
"Maria Rodriguez","+1555123458","Vegan",2,"Cousin","bride","Wheelchair accessible seating"
"James Wilson","+1555123459","",1,"Uncle","groom","No special requests"
"Sarah Thompson","+1555123460","Lactose-free",0,"Friend","bride","Prefers quiet seating"
"Daniel Kim","+1555123461","",3,"Sibling","groom","Table near family"
"Amanda Johnson","+1555123462","Vegetarian",1,"Aunt","bride","Close to restrooms please"
"Christopher Lee","+1555123463","",0,"Friend","groom","No dietary restrictions"
"Jessica Brown","+1555123464","Gluten-free,Nut allergy",2,"Cousin","bride","Emergency contact: +1555999999"
"Michael Davis","+1555123465","",1,"Colleague","groom","Prefers corner table"`;

// Create demo-data directory if it doesn't exist
const demoDataDir = path.join(__dirname, 'demo-data');
if (!fs.existsSync(demoDataDir)) {
  fs.mkdirSync(demoDataDir);
}

// Write sample CSV file
const csvFilePath = path.join(demoDataDir, 'sample-guests.csv');
fs.writeFileSync(csvFilePath, sampleCSVContent);
console.log('✅ Created sample CSV file:', csvFilePath);

// Create sample contact data for mobile testing
const sampleContactData = [
  {
    id: 'contact-1',
    name: 'Alex Johnson',
    phoneNumbers: ['+1555987654']
  },
  {
    id: 'contact-2', 
    name: 'Emma Wilson',
    phoneNumbers: ['+1555987655', '+1555987656']
  },
  {
    id: 'contact-3',
    name: 'Ryan Chen',
    phoneNumbers: ['+1555987657']
  },
  {
    id: 'contact-4',
    name: 'Olivia Garcia',
    phoneNumbers: ['+1555987658']
  },
  {
    id: 'contact-5',
    name: 'Noah Martinez',
    phoneNumbers: ['+1555987659']
  }
];

const contactDataPath = path.join(demoDataDir, 'sample-contacts.json');
fs.writeFileSync(contactDataPath, JSON.stringify(sampleContactData, null, 2));
console.log('✅ Created sample contact data:', contactDataPath);

// Create demo instructions
const demoInstructions = `# RSVP Planning App - Demo Testing Instructions

## Guest Management Testing Checklist

### 1. Set up Demo Environment with Sample Data
- [x] Sample CSV file created: demo-data/sample-guests.csv
- [x] Sample contact data created: demo-data/sample-contacts.json
- [ ] Database seeded with sample event and initial guests

### 2. Test Guest Creation, Editing, and Deletion

#### Manual Guest Creation:
- [ ] Add a new guest with all required fields
- [ ] Add a guest with dietary restrictions
- [ ] Add a guest with additional guest count > 0
- [ ] Try to add a guest with missing required fields (should show validation errors)
- [ ] Add guests from both bride and groom sides
- [ ] Test different relationship types (Uncle, Aunt, Friend, Colleague, etc.)

#### Guest Editing:
- [ ] Edit an existing guest's name
- [ ] Change dietary restrictions
- [ ] Update relationship type and bride/groom side
- [ ] Modify additional guest count
- [ ] Add/edit special requests

#### Guest Deletion:
- [ ] Delete a guest (should show confirmation dialog)
- [ ] Verify guest is removed from the list
- [ ] Try to delete a guest that doesn't exist

### 3. Test CSV Import Functionality (Web)

#### Valid CSV Import:
- [ ] Upload the sample CSV file (demo-data/sample-guests.csv)
- [ ] Verify preview shows correct data parsing
- [ ] Complete the import and verify all guests are added
- [ ] Check that dietary restrictions are properly parsed
- [ ] Verify relationship types and bride/groom sides are correct

#### Invalid CSV Testing:
- [ ] Upload CSV with missing required fields
- [ ] Upload CSV with invalid relationship types
- [ ] Upload CSV with invalid bride/groom side values
- [ ] Upload CSV with invalid additional guest counts
- [ ] Verify error messages are clear and helpful

#### CSV Format Testing:
- [ ] Test CSV with different header formats (spaces, case variations)
- [ ] Test CSV with empty rows
- [ ] Test CSV with special characters in names
- [ ] Test CSV with international phone number formats

### 4. Test Contact Picker Functionality (Mobile)

#### Contact Selection:
- [ ] Open contact picker
- [ ] Select individual contacts
- [ ] Select multiple contacts at once
- [ ] Verify contact names and phone numbers are imported correctly
- [ ] Test with contacts that have multiple phone numbers

#### Contact Import Validation:
- [ ] Import contacts without phone numbers (should show error)
- [ ] Import contacts with duplicate phone numbers
- [ ] Verify default values are set (relationship type, bride/groom side)

### 5. Test Search and Filtering Capabilities

#### Search Functionality:
- [ ] Search guests by name (partial matches)
- [ ] Search by phone number
- [ ] Test case-insensitive search
- [ ] Test search with special characters

#### Filtering Options:
- [ ] Filter by RSVP status (pending, accepted, declined, no response)
- [ ] Filter by dietary restrictions
- [ ] Filter by relationship type
- [ ] Filter by bride/groom side
- [ ] Test multiple filters combined
- [ ] Clear filters and verify all guests show

#### Advanced Filtering:
- [ ] Filter guests with additional guests > 0
- [ ] Filter guests with special requests
- [ ] Filter guests assigned to tables vs unassigned

### 6. User Experience Testing

#### Web Interface:
- [ ] Test responsive design on different screen sizes
- [ ] Verify all buttons and forms are accessible
- [ ] Test keyboard navigation
- [ ] Check loading states during operations
- [ ] Verify error messages are user-friendly

#### Mobile Interface:
- [ ] Test touch interactions
- [ ] Verify forms work well on mobile keyboards
- [ ] Test scrolling and list performance
- [ ] Check that modals and overlays work properly
- [ ] Test landscape and portrait orientations

### 7. Data Validation and Error Handling

#### Input Validation:
- [ ] Test phone number format validation
- [ ] Test name length limits
- [ ] Test special request character limits
- [ ] Verify required field validation

#### Error Scenarios:
- [ ] Test network connectivity issues
- [ ] Test server error responses
- [ ] Verify graceful error handling
- [ ] Check that user data is preserved during errors

### 8. Performance Testing

#### Large Dataset Testing:
- [ ] Import large CSV file (100+ guests)
- [ ] Test search performance with many guests
- [ ] Test filtering performance
- [ ] Verify UI remains responsive

### Expected Results:
- All guest CRUD operations should work smoothly
- CSV import should handle various formats and show clear error messages
- Mobile contact picker should integrate seamlessly
- Search and filtering should be fast and accurate
- UI should be responsive and user-friendly
- Error handling should be graceful and informative

### Demo Data Available:
- Sample Event: "Sarah & John's Wedding" (August 15, 2025)
- 5 initial sample guests with diverse data
- 10 additional guests in CSV file for import testing
- 5 sample contacts for mobile import testing

## Running the Demo:

1. **Start the backend server:**
   \`\`\`bash
   cd rsvp-backend
   npm run seed  # Seed the database with sample data
   npm run dev   # Start the development server
   \`\`\`

2. **Start the web application:**
   \`\`\`bash
   cd rsvp-web
   npm start
   \`\`\`

3. **Start the mobile application:**
   \`\`\`bash
   cd rsvp-mobile
   npm start
   \`\`\`

4. **Access the applications:**
   - Web: http://localhost:3000
   - Mobile: Use Expo Go app to scan QR code
   - Backend API: http://localhost:5000

## Feedback Collection:
After testing each section, document:
- What worked well
- What was confusing or difficult
- Any bugs or issues encountered
- Suggestions for improvement
- Missing features or functionality

This feedback will be used to iterate and improve the guest management system before proceeding to the next features.
`;

const instructionsPath = path.join(demoDataDir, 'DEMO_INSTRUCTIONS.md');
fs.writeFileSync(instructionsPath, demoInstructions);
console.log('✅ Created demo instructions:', instructionsPath);

// Create a simple test runner script
const testRunnerScript = `#!/usr/bin/env node

/**
 * Simple test runner for guest management functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Guest Management Tests...\\n');

try {
  // Run backend tests
  console.log('📋 Running backend guest service tests...');
  execSync('npm test -- --testPathPattern=GuestService', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run web component tests
  console.log('\\n🌐 Running web component tests...');
  execSync('npm test -- --testPathPattern=Guest --watchAll=false', { 
    cwd: path.join(__dirname, 'rsvp-web'),
    stdio: 'inherit' 
  });

  console.log('\\n✅ All tests passed! Guest management functionality is ready for user testing.');
  
} catch (error) {
  console.error('\\n❌ Some tests failed. Please fix issues before proceeding with user testing.');
  process.exit(1);
}
`;

const testRunnerPath = path.join(__dirname, 'run-guest-tests.js');
fs.writeFileSync(testRunnerPath, testRunnerScript);
console.log('✅ Created test runner script:', testRunnerPath);

console.log('\n🎉 Demo environment setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run seed (in rsvp-backend directory) to populate database');
console.log('2. Run: node run-guest-tests.js to verify functionality');
console.log('3. Start the applications and follow demo-data/DEMO_INSTRUCTIONS.md');
console.log('4. Collect user feedback and iterate as needed');
console.log('\n📁 Demo files created:');
console.log('  - demo-data/sample-guests.csv (CSV import testing)');
console.log('  - demo-data/sample-contacts.json (Mobile contact testing)');
console.log('  - demo-data/DEMO_INSTRUCTIONS.md (Testing checklist)');
console.log('  - run-guest-tests.js (Automated test runner)');