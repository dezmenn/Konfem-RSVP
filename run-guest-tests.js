#!/usr/bin/env node

/**
 * Simple test runner for guest management functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Guest Management Tests...\n');

try {
  // Run backend tests
  console.log('📋 Running backend guest service tests...');
  execSync('npm test -- --testPathPattern=GuestService', { 
    cwd: path.join(__dirname, 'rsvp-backend'),
    stdio: 'inherit' 
  });

  // Run web component tests
  console.log('\n🌐 Running web component tests...');
  execSync('npm test -- --testPathPattern=Guest --watchAll=false', { 
    cwd: path.join(__dirname, 'rsvp-web'),
    stdio: 'inherit' 
  });

  console.log('\n✅ All tests passed! Guest management functionality is ready for user testing.');
  
} catch (error) {
  console.error('\n❌ Some tests failed. Please fix issues before proceeding with user testing.');
  process.exit(1);
}
