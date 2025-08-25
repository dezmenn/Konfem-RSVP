#!/usr/bin/env node

/**
 * Test runner for invitations and messaging functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Invitations and Messaging Tests...\n');

try {
  // Run RSVP service tests
  console.log('📋 Running RSVP service tests...');
  execSync('npm test -- --testPathPattern=RSVPService', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run messaging service tests
  console.log('\n📱 Running messaging service tests...');
  execSync('npm test -- --testPathPattern=MessagingService', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run WhatsApp mock service tests
  console.log('\n💬 Running WhatsApp mock service tests...');
  execSync('npm test -- --testPathPattern=WhatsAppMockService', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run integration tests
  console.log('\n🔗 Running messaging integration tests...');
  execSync('npm test -- --testPathPattern=MessagingIntegration', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  console.log('\n✅ All tests passed! Invitations and messaging functionality is ready for user testing.');
  console.log('\n📋 Next steps:');
  console.log('1. Start the applications (backend, web, mobile)');
  console.log('2. Follow the testing checklist in demo-data/INVITATIONS_MESSAGING_DEMO.md');
  console.log('3. Use the demo data and links provided in demo-data/DEMO_SUMMARY.md');
  console.log('4. Collect user feedback and iterate as needed');
  
} catch (error) {
  console.error('\n❌ Some tests failed. Please fix issues before proceeding with user testing.');
  console.error('Error:', error.message);
  process.exit(1);
}
