# RSVP Planning App - Demo Testing Instructions

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
   ```bash
   cd rsvp-backend
   npm run seed  # Seed the database with sample data
   npm run dev   # Start the development server
   ```

2. **Start the web application:**
   ```bash
   cd rsvp-web
   npm start
   ```

3. **Start the mobile application:**
   ```bash
   cd rsvp-mobile
   npm start
   ```

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
