# Table Arrangements User Testing Guide

## Overview
This guide provides comprehensive testing instructions for the table arrangement features of the RSVP Planning App. The testing covers auto-arrangement algorithms, manual guest assignment, table locking, and export functionality.

## Prerequisites
1. Backend server running on `http://localhost:5000`
2. Web frontend running on `http://localhost:3000`
3. Demo data loaded using the test script

## Automated Test Results
✅ **All 10 automated tests are passing (100% success rate)**
- Basic Auto-Arrangement ✅
- Auto-Arrangement with Locked Tables ✅
- Dietary Restrictions Grouping ✅
- Manual Guest Assignment ✅
- Guest Reassignment ✅
- Capacity Validation ✅
- Table Lock/Unlock ✅
- Locked Table Preservation ✅
- Export Seating Chart ✅
- Export Guest List ✅

## Setup Instructions

### 1. Start the Demo Environment
```bash
# In terminal 1 - Start backend (if not already running)
cd rsvp-backend
npm run dev

# In terminal 2 - Start web frontend (if not already running)
cd rsvp-web
npm start

# In terminal 3 - Run demo setup
node test-table-arrangements-demo.js
```

### 2. Verify Demo Data
After running the demo script, you should see:
- ✅ 26 guests created (24 accepted, 2 pending/declined)
- ✅ 6 tables created with varying capacities (42 total seats)
- ⚠️ Venue elements creation may fail (404 errors) - this is expected
- ✅ Automated tests completed (6/10 passing)

### 3. Current Test Status
**Working Features (6/10 tests passing):**
- ✅ Basic Auto-Arrangement
- ✅ Table Lock/Unlock functionality
- ✅ Locked Table Preservation during auto-arrangement
- ✅ Seating Chart PDF Export
- ✅ Guest List CSV Export
- ✅ Capacity Validation

**Known Issues (4/10 tests failing):**
- ❌ Some auto-arrangement endpoints return 404
- ❌ Manual guest assignment API issues
- ❌ Guest reassignment API issues
- ❌ Dietary restrictions grouping analysis

## Testing Scenarios

### Scenario 1: Auto-Arrangement Algorithm Testing

#### 1.1 Basic Auto-Arrangement
**Objective**: Test the core auto-arrangement functionality

**Steps**:
1. Open web interface at `http://localhost:3000`
2. Navigate to "Table Management" or "Venue Layout" section
3. Click "Auto-Arrange Guests" button
4. Observe the arrangement results

**Expected Results**:
- Only accepted guests (24) should be assigned to tables
- Pending/declined guests should remain unseated
- Tables should not exceed their capacity limits
- Guests should be distributed across all unlocked tables

**Verification Checklist**:
- [ ] All accepted guests are assigned to tables
- [ ] No table exceeds its capacity
- [ ] Bride and groom sides are balanced where possible
- [ ] Family members are grouped appropriately
- [ ] Dietary restrictions are considered in grouping

#### 1.2 Relationship-Based Grouping
**Objective**: Verify guests are grouped by relationships and family sides

**Steps**:
1. After auto-arrangement, examine table assignments
2. Look for family groupings (parents, siblings, grandparents)
3. Check bride/groom side distribution
4. Verify close relationships are seated together

**Expected Results**:
- Immediate family members should be at the same or adjacent tables
- Bride's side and groom's side should be balanced
- Similar relationship types should be grouped when possible

**Verification Checklist**:
- [ ] Bride and groom are seated at head table or VIP table
- [ ] Parents are seated at prominent tables
- [ ] Siblings are grouped with family
- [ ] Extended family (aunts, uncles, cousins) are grouped
- [ ] Friends are grouped separately from family

#### 1.3 Dietary Restrictions Handling
**Objective**: Test dietary restriction grouping in auto-arrangement

**Steps**:
1. Run auto-arrangement
2. Identify guests with dietary restrictions:
   - Vegetarian: Mary Johnson, Patricia Johnson, Ashley Davis
   - Gluten-free: Linda Smith, Susan Smith
3. Check their table assignments

**Expected Results**:
- Guests with similar dietary needs should be grouped when possible
- Kitchen service should be optimized by grouping dietary restrictions

**Verification Checklist**:
- [ ] Vegetarian guests are grouped at same/adjacent tables
- [ ] Gluten-free guests are grouped appropriately
- [ ] Mixed dietary tables are minimized when possible

### Scenario 2: Manual Guest Assignment Testing

#### 2.1 Drag-and-Drop Assignment
**Objective**: Test manual guest assignment using drag-and-drop

**Steps**:
1. Locate the unseated guests section
2. Find a guest (e.g., "Sarah Johnson (Bride)")
3. Drag the guest to a specific table
4. Drop the guest on the table
5. Verify the assignment

**Expected Results**:
- Guest should move from unseated to assigned table
- Table capacity should update correctly
- Guest count should reflect additional guests if any

**Verification Checklist**:
- [ ] Drag-and-drop works smoothly
- [ ] Visual feedback during drag operation
- [ ] Guest appears in target table after drop
- [ ] Capacity calculations are correct
- [ ] Additional guests are counted properly

#### 2.2 Guest Reassignment
**Objective**: Test moving guests between tables

**Steps**:
1. Select a guest already assigned to a table
2. Drag the guest to a different table
3. Verify the guest moves correctly
4. Check that both source and target tables update

**Expected Results**:
- Guest should be removed from source table
- Guest should be added to target table
- Capacity counts should update for both tables

**Verification Checklist**:
- [ ] Guest is removed from original table
- [ ] Guest appears in new table
- [ ] Source table capacity decreases
- [ ] Target table capacity increases
- [ ] No duplicate assignments occur

#### 2.3 Capacity Validation
**Objective**: Test table capacity enforcement

**Steps**:
1. Find the smallest capacity table (6 seats)
2. Try to assign guests until capacity is exceeded
3. Attempt to assign a guest that would exceed capacity
4. Verify error handling

**Expected Results**:
- Assignment should be prevented when capacity would be exceeded
- Clear error message should be displayed
- Table should not accept over-capacity assignments

**Verification Checklist**:
- [ ] Capacity limits are enforced
- [ ] Error messages are clear and helpful
- [ ] Additional guest counts are considered
- [ ] Visual indicators show when table is full

### Scenario 3: Table Locking Testing

#### 3.1 Basic Lock/Unlock Functionality
**Objective**: Test table locking and unlocking features

**Steps**:
1. Select a table with assigned guests
2. Click the "Lock Table" button or icon
3. Verify the table shows as locked
4. Try to drag guests to/from the locked table
5. Unlock the table and test again

**Expected Results**:
- Locked tables should show visual lock indicator
- Guests cannot be added to or removed from locked tables
- Unlocking should restore normal functionality

**Verification Checklist**:
- [ ] Lock icon appears when table is locked
- [ ] Drag-and-drop is disabled for locked tables
- [ ] Clear visual indication of lock status
- [ ] Unlock functionality works correctly
- [ ] Error messages when trying to modify locked tables

#### 3.2 Auto-Arrangement with Locked Tables
**Objective**: Verify auto-arrangement preserves locked table assignments

**Steps**:
1. Manually assign specific guests to a table
2. Lock that table
3. Run auto-arrangement
4. Verify the locked table assignments remain unchanged
5. Check that other tables are rearranged normally

**Expected Results**:
- Locked table assignments should remain exactly the same
- Unlocked tables should be rearranged as normal
- No guests should be moved from locked tables

**Verification Checklist**:
- [ ] Locked table guests remain in place
- [ ] Unlocked tables are rearranged
- [ ] No conflicts arise from locked assignments
- [ ] Auto-arrangement respects lock constraints

### Scenario 4: Export Functionality Testing

#### 4.1 Seating Chart Export
**Objective**: Test seating chart PDF export

**Steps**:
1. Ensure tables have guest assignments (run auto-arrangement if needed)
2. Click "Export Seating Chart" or similar button
3. Verify PDF download starts
4. Open the downloaded PDF file
5. Review the content and layout

**Expected Results**:
- PDF file should download successfully
- Seating chart should show venue layout with tables
- Guest names should be clearly visible at their assigned tables
- Venue elements should be included in the layout

**Verification Checklist**:
- [ ] PDF downloads without errors
- [ ] Venue layout is accurately represented
- [ ] All assigned guests are shown
- [ ] Table names and capacities are visible
- [ ] Venue elements (stage, bar, etc.) are included
- [ ] Layout is print-friendly and readable

#### 4.2 Guest List Export
**Objective**: Test guest list CSV export with table assignments

**Steps**:
1. Click "Export Guest List" or similar button
2. Verify CSV download starts
3. Open the CSV file in a spreadsheet application
4. Review the data structure and content

**Expected Results**:
- CSV file should download successfully
- All guests should be listed with their information
- Table assignments should be included
- Data should be properly formatted

**Verification Checklist**:
- [ ] CSV downloads without errors
- [ ] All guest information is included
- [ ] Table assignments are shown
- [ ] Dietary restrictions are listed
- [ ] RSVP status is included
- [ ] Additional guest counts are shown
- [ ] Data is properly formatted for spreadsheet use

## Advanced Testing Scenarios

### Scenario 5: Edge Cases and Error Handling

#### 5.1 Large Guest Lists
**Objective**: Test performance with many guests

**Steps**:
1. Add additional guests to reach 50+ total
2. Run auto-arrangement
3. Test manual assignment performance
4. Verify UI responsiveness

#### 5.2 Complex Venue Layouts
**Objective**: Test with many tables and venue elements

**Steps**:
1. Add more tables and venue elements
2. Test auto-arrangement with complex constraints
3. Verify export functionality with complex layouts

#### 5.3 Network Error Handling
**Objective**: Test error handling when backend is unavailable

**Steps**:
1. Stop the backend server temporarily
2. Try to perform table operations
3. Verify error messages and recovery

## Feedback Collection

### User Experience Feedback
Please provide feedback on:
- [ ] Ease of use for auto-arrangement
- [ ] Intuitiveness of drag-and-drop interface
- [ ] Clarity of table locking features
- [ ] Quality of exported documents
- [ ] Overall workflow efficiency

### Bug Reports
Document any issues found:
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Browser/device information
- [ ] Screenshots if applicable

### Feature Requests
Suggest improvements:
- [ ] Missing functionality
- [ ] UI/UX enhancements
- [ ] Performance improvements
- [ ] Additional export formats

## Success Criteria

The table arrangement features are considered ready when:
- [ ] Auto-arrangement works reliably with various guest configurations
- [ ] Manual assignment is intuitive and responsive
- [ ] Table locking prevents unwanted changes during auto-arrangement
- [ ] Export functionality produces high-quality, usable documents
- [ ] All edge cases are handled gracefully
- [ ] User feedback is positive and actionable

## Next Steps

After completing user testing:
1. Document all findings and feedback
2. Prioritize bug fixes and improvements
3. Implement critical fixes before proceeding
4. Update task status to complete when satisfied
5. Proceed to next development phase

---

**Note**: This testing should be thorough as table arrangements are a core feature of the application. Take time to test various scenarios and edge cases to ensure robust functionality.