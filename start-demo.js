#!/usr/bin/env node

/**
 * Demo Startup Script for RSVP Planning App
 * Starts all required services for the invitations and messaging demo
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting RSVP Planning App Demo Environment...\n');

// Function to start a service
function startService(name, command, args, cwd) {
  console.log(`📱 Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: 'inherit',
    shell: true
  });

  process.on('error', (error) => {
    console.error(`❌ Failed to start ${name}:`, error.message);
  });

  process.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} exited with code ${code}`);
    }
  });

  return process;
}

console.log('🔧 Demo Environment Configuration:');
console.log('  - Backend: Mock services (no database required)');
console.log('  - WhatsApp: Mock service with console logging');
console.log('  - Demo Data: 15 guests, 3 templates, sample messages');
console.log('');

console.log('📋 Starting Services:');

// Start backend server
const backend = startService(
  'Backend Server',
  'npm',
  ['run', 'dev'],
  path.join(__dirname, 'rsvp-backend')
);

// Wait a moment for backend to start
setTimeout(() => {
  console.log('');
  console.log('🌐 Access Points (after all services start):');
  console.log('  📱 Admin Dashboard: http://localhost:3000/admin');
  console.log('  💬 WhatsApp Admin: http://localhost:5000/api/whatsapp-admin/dashboard');
  console.log('  🌐 Public RSVP: http://localhost:3000/public/demo-event-1');
  console.log('  🔍 Health Check: http://localhost:5000/health');
  console.log('');
  console.log('🎫 Sample RSVP Links for Testing:');
  console.log('  👤 Emily Davis: http://localhost:3000/rsvp/rsvp-token-emily-davis-def456');
  console.log('  👤 David Brown: http://localhost:3000/rsvp/rsvp-token-david-brown-mno345');
  console.log('  👤 Jennifer Martinez: http://localhost:3000/rsvp/rsvp-token-jennifer-martinez-pqr678');
  console.log('');
  console.log('📖 Next Steps:');
  console.log('  1. Wait for backend to fully start (watch for "Server running on port 5000")');
  console.log('  2. In new terminals, start:');
  console.log('     cd rsvp-web && npm start');
  console.log('     cd rsvp-mobile && npm start  (optional)');
  console.log('  3. Follow testing guide: demo-data/INVITATIONS_MESSAGING_USER_TESTING.md');
  console.log('');
  console.log('⚠️  Press Ctrl+C to stop all services');
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down demo environment...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down demo environment...');
  backend.kill('SIGTERM');
  process.exit(0);
});