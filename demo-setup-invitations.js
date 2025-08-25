#!/usr/bin/env node

/**
 * Demo Setup Script for RSVP Planning App - Invitations and Messaging Testing
 * 
 * This script sets up a comprehensive demo environment for testing invitation and messaging functionality.
 * It includes:
 * - Enhanced event data with invitation templates
 * - Expanded guest list (15 guests) with diverse RSVP statuses
 * - RSVP tokens for all guests
 * - Mock WhatsApp message data with various delivery statuses
 * - Public RSVP registrations
 * - Comprehensive analytics data
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up RSVP Planning App - Invitations and Messaging Demo Environment...\n');

// Create demo-data directory if it doesn't exist
const demoDataDir = path.join(__dirname, 'demo-data');
if (!fs.existsSync(demoDataDir)) {
  fs.mkdirSync(demoDataDir);
}

// Read the comprehensive mock data
const mockDataPath = path.join(demoDataDir, 'mock-demo-data.json');
let mockData;
try {
  mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
  console.log('✅ Loaded comprehensive demo data from mock-demo-data.json');
} catch (error) {
  console.error('❌ Error loading mock data:', error.message);
  process.exit(1);
}

// Create a summary of the demo environment
const demoSummary = `# RSVP Planning App - Invitations and Messaging Demo Summary

## Demo Environment Overview

### Event Details
- **Event**: ${mockData.event.title}
- **Date**: ${new Date(mockData.event.date).toLocaleDateString()}
- **Location**: ${mockData.event.location}
- **RSVP Deadline**: ${new Date(mockData.event.rsvpDeadline).toLocaleDateString()}
- **Public RSVP**: ${mockData.event.publicRSVPEnabled ? 'Enabled' : 'Disabled'}

### Guest List Statistics
- **Total Invited Guests**: ${mockData.analytics.totalInvitedGuests}
- **Public Registrations**: ${mockData.analytics.totalPublicRegistrations}
- **RSVP Status Breakdown**:
  - Accepted: ${mockData.analytics.rsvpStatusCounts.accepted}
  - Pending: ${mockData.analytics.rsvpStatusCounts.pending}
  - Declined: ${mockData.analytics.rsvpStatusCounts.declined}
  - No Response: ${mockData.analytics.rsvpStatusCounts.no_response}

### Invitation Templates Available
${mockData.invitationTemplates.map(template => 
  `- **${template.name}** (${template.isActive ? 'Active' : 'Inactive'}): ${template.template.headerText}`
).join('\n')}

### WhatsApp Messaging Statistics
- **Total Messages Sent**: ${mockData.analytics.messagingStats.totalMessagesSent}
- **Delivered**: ${mockData.analytics.messagingStats.deliveredMessages}
- **Failed**: ${mockData.analytics.messagingStats.failedMessages}
- **Pending**: ${mockData.analytics.messagingStats.pendingMessages}
- **Delivery Rate**: ${mockData.analytics.messagingStats.deliveryRate}%

### RSVP Token Statistics
- **Total Tokens Generated**: ${mockData.analytics.rsvpTokenStats.totalTokensGenerated}
- **Tokens Used**: ${mockData.analytics.rsvpTokenStats.tokensUsed}
- **Token Usage Rate**: ${mockData.analytics.rsvpTokenStats.tokenUsageRate}%

## Test Data Available

### Sample RSVP Links for Testing
${mockData.rsvpTokens.filter(token => !token.isUsed).slice(0, 5).map(token => {
  const guest = mockData.guests.find(g => g.id === token.guestId);
  return `- **${guest.name}**: http://localhost:3000/rsvp/${token.token}`;
}).join('\n')}

### Public RSVP Link
- **Public Registration**: ${mockData.event.publicRSVPLink}

### WhatsApp Admin Interface
- **Message Dashboard**: http://localhost:5000/admin/whatsapp
- **View sent messages, delivery status, and retry failed messages**

### Sample Message Content
\`\`\`
${mockData.messages[0].content}
\`\`\`

## Quick Start Testing Guide

### 1. Start the Applications
\`\`\`bash
# Terminal 1 - Backend
cd rsvp-backend
npm run seed
npm run dev

# Terminal 2 - Web App
cd rsvp-web
npm start

# Terminal 3 - Mobile App (optional)
cd rsvp-mobile
npm start
\`\`\`

### 2. Access Points
- **Admin Dashboard**: http://localhost:3000/admin
- **Guest RSVP**: Use links above
- **Public RSVP**: ${mockData.event.publicRSVPLink}
- **WhatsApp Admin**: http://localhost:5000/admin/whatsapp

### 3. Test Scenarios Ready
- ✅ Invitation template customization
- ✅ Bulk WhatsApp sending simulation
- ✅ RSVP response workflows
- ✅ Public guest registration
- ✅ Message delivery tracking
- ✅ Failed message retry testing

## Demo Data Highlights

### Diverse Guest Scenarios
- Guests with various dietary restrictions
- Different relationship types and bride/groom sides
- Mixed RSVP statuses for realistic testing
- Some guests with additional guest counts
- Special requests and accessibility needs

### Messaging Scenarios
- Successfully delivered messages
- Failed delivery (phone not reachable)
- Pending delivery status
- Different message templates used

### RSVP Token Scenarios
- Used tokens (guests who already responded)
- Unused tokens (available for testing)
- Expired tokens (for deadline testing)

This demo environment provides comprehensive test coverage for all invitation and messaging functionality implemented in tasks 6-8.
`;

const summaryPath = path.join(demoDataDir, 'DEMO_SUMMARY.md');
fs.writeFileSync(summaryPath, demoSummary);
console.log('✅ Created demo summary:', summaryPath);

// Create a test runner script for invitations and messaging
const testRunnerScript = `#!/usr/bin/env node

/**
 * Test runner for invitations and messaging functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Invitations and Messaging Tests...\\n');

try {
  // Run RSVP service tests
  console.log('📋 Running RSVP service tests...');
  execSync('npm test -- --testPathPattern=RSVPService --run', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run messaging service tests
  console.log('\\n📱 Running messaging service tests...');
  execSync('npm test -- --testPathPattern=MessagingService --run', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run WhatsApp mock service tests
  console.log('\\n💬 Running WhatsApp mock service tests...');
  execSync('npm test -- --testPathPattern=WhatsAppMockService --run', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run integration tests
  console.log('\\n🔗 Running messaging integration tests...');
  execSync('npm test -- --testPathPattern=MessagingIntegration --run', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  console.log('\\n✅ All tests passed! Invitations and messaging functionality is ready for user testing.');
  console.log('\\n📋 Next steps:');
  console.log('1. Start the applications (backend, web, mobile)');
  console.log('2. Follow the testing checklist in demo-data/INVITATIONS_MESSAGING_DEMO.md');
  console.log('3. Use the demo data and links provided in demo-data/DEMO_SUMMARY.md');
  console.log('4. Collect user feedback and iterate as needed');
  
} catch (error) {
  console.error('\\n❌ Some tests failed. Please fix issues before proceeding with user testing.');
  console.error('Error:', error.message);
  process.exit(1);
}
`;

const testRunnerPath = path.join(__dirname, 'run-invitations-tests.js');
fs.writeFileSync(testRunnerPath, testRunnerScript);
console.log('✅ Created invitations test runner script:', testRunnerPath);

// Create a user testing summary template
const userTestingSummary = `# User Testing Summary - Invitations and Messaging

## Testing Session Information
- **Date**: ${new Date().toLocaleDateString()}
- **Tester**: [Name]
- **Duration**: [Time]
- **Environment**: Demo setup with ${mockData.analytics.totalInvitedGuests} guests

## Testing Results

### 1. Invitation Template Customization
- [ ] **Template Selection**: Easy to browse and select templates
- [ ] **Color Customization**: Intuitive color picker and preview
- [ ] **Text Editing**: Clear text editing interface
- [ ] **Preview Functionality**: Accurate preview of final invitation
- [ ] **Save/Load**: Templates save and load correctly

**Issues Found:**
- 

**Suggestions:**
- 

### 2. Bulk WhatsApp Invitation Sending
- [ ] **Guest Selection**: Easy to select recipients
- [ ] **Progress Tracking**: Clear progress indicators during sending
- [ ] **Mock Service**: WhatsApp mock service works as expected
- [ ] **Personalization**: Messages properly personalized for each guest
- [ ] **Error Handling**: Failed messages handled gracefully

**Issues Found:**
- 

**Suggestions:**
- 

### 3. RSVP Response Workflow
- [ ] **Link Access**: RSVP links work correctly
- [ ] **Form Usability**: RSVP form is user-friendly
- [ ] **Data Validation**: Form validation works properly
- [ ] **Confirmation**: Clear confirmation after submission
- [ ] **Status Updates**: Admin dashboard updates correctly

**Issues Found:**
- 

**Suggestions:**
- 

### 4. Public RSVP Functionality
- [ ] **Public Link Access**: Public RSVP link works
- [ ] **Registration Form**: Public registration form is clear
- [ ] **Guest Integration**: Public guests integrate with main guest list
- [ ] **Admin Management**: Public guests manageable by admin

**Issues Found:**
- 

**Suggestions:**
- 

### 5. Message Delivery Tracking
- [ ] **Admin Interface**: WhatsApp admin interface is useful
- [ ] **Status Updates**: Delivery status updates correctly
- [ ] **Failed Message Handling**: Failed messages clearly identified
- [ ] **Retry Functionality**: Message retry works as expected

**Issues Found:**
- 

**Suggestions:**
- 

## Overall Assessment

### What Worked Well
- 

### Major Issues
- 

### Priority Improvements
1. 
2. 
3. 

### Nice-to-Have Features
- 

## Recommendation
- [ ] **Ready for next phase** - All critical functionality works well
- [ ] **Needs minor fixes** - Small issues to address before proceeding
- [ ] **Needs major work** - Significant issues require attention

## Additional Notes
`;

const userTestingPath = path.join(demoDataDir, 'USER_TESTING_SUMMARY.md');
fs.writeFileSync(userTestingPath, userTestingSummary);
console.log('✅ Created user testing summary template:', userTestingPath);

console.log('\n🎉 Invitations and Messaging Demo environment setup complete!');
console.log('\n📋 Demo Environment Includes:');
console.log(`  - ${mockData.analytics.totalInvitedGuests} invited guests with diverse data`);
console.log(`  - ${mockData.invitationTemplates.length} invitation templates`);
console.log(`  - ${mockData.analytics.messagingStats.totalMessagesSent} sample WhatsApp messages`);
console.log(`  - ${mockData.analytics.rsvpTokenStats.totalTokensGenerated} RSVP tokens for testing`);
console.log(`  - ${mockData.analytics.totalPublicRegistrations} public RSVP registrations`);
console.log('  - Mock WhatsApp service with delivery simulation');

console.log('\n📁 Files Created/Updated:');
console.log('  - demo-data/mock-demo-data.json (comprehensive test data)');
console.log('  - demo-data/INVITATIONS_MESSAGING_DEMO.md (detailed testing checklist)');
console.log('  - demo-data/DEMO_SUMMARY.md (quick reference guide)');
console.log('  - demo-data/USER_TESTING_SUMMARY.md (feedback collection template)');
console.log('  - run-invitations-tests.js (automated test runner)');

console.log('\n🚀 Next Steps:');
console.log('1. Run: node run-invitations-tests.js (verify functionality)');
console.log('2. Start applications: backend, web, and mobile');
console.log('3. Follow testing checklist in INVITATIONS_MESSAGING_DEMO.md');
console.log('4. Use demo data and links from DEMO_SUMMARY.md');
console.log('5. Document feedback in USER_TESTING_SUMMARY.md');

console.log('\n🔗 Quick Access Links (after starting apps):');
console.log('  - Admin Dashboard: http://localhost:3000/admin');
console.log('  - WhatsApp Admin: http://localhost:5000/admin/whatsapp');
console.log('  - Public RSVP: http://localhost:3000/public/demo-event-1');
console.log('  - Sample RSVP: http://localhost:3000/rsvp/rsvp-token-emily-davis-def456');