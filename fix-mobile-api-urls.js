#!/usr/bin/env node

/**
 * Fix Mobile API URLs
 * Updates mobile configuration to use correct network addresses
 */

const fs = require('fs');
const path = require('path');

class MobileAPIFixer {
  constructor() {
    this.configPath = 'rsvp-mobile/config.ts';
    this.backupPath = 'rsvp-mobile/config.ts.backup';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  backupCurrentConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const currentConfig = fs.readFileSync(this.configPath, 'utf8');
        fs.writeFileSync(this.backupPath, currentConfig);
        this.log(`✓ Current config backed up to: ${this.backupPath}`);
        return true;
      } else {
        this.log(`⚠ Config file not found: ${this.configPath}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`✗ Failed to backup config: ${error.message}`, 'error');
      return false;
    }
  }

  updateMobileConfig() {
    const updatedConfig = `/**
 * Mobile App Configuration - Fixed for Network Connectivity
 * Updated: ${new Date().toISOString()}
 */

import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android emulator: use 10.0.2.2 (maps to host machine's localhost)
      // For Android physical device: use your computer's WiFi IP
      return 'http://10.0.2.2:5000'; // Works for Android emulator
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:5000';
    } else {
      // Web/Expo web
      return 'http://localhost:5000';
    }
  } else {
    // Production mode
    return 'https://your-production-api.com';
  }
};

export const API_BASE_URL = getApiBaseUrl();

export const config = {
  apiBaseUrl: API_BASE_URL,
  eventId: 'demo-event-1',
  wsUrl: API_BASE_URL.replace('http', 'ws'),
  
  // Network settings
  timeout: 15000, // 15 second timeout for mobile networks
  retries: 3,     // Retry failed requests
};

// Debug logging
console.log('📱 Mobile App Config:', {
  platform: Platform.OS,
  apiBaseUrl: config.apiBaseUrl,
  isDev: __DEV__,
  timestamp: new Date().toISOString()
});

export default config;`;

    try {
      fs.writeFileSync(this.configPath, updatedConfig);
      this.log(`✓ Mobile configuration updated: ${this.configPath}`);
      return true;
    } catch (error) {
      this.log(`✗ Failed to update config: ${error.message}`, 'error');
      return false;
    }
  }

  generateTroubleshootingGuide() {
    const guide = `# Mobile Network Troubleshooting Guide

## Issue: "Network request failed" in mobile app

### Root Cause
The mobile app cannot connect to the backend API server.

### Solutions (try in order):

## 1. 🚀 Start the Backend Server
\`\`\`bash
# In the root directory, start the backend
npm run dev:backend

# OR if that doesn't work:
cd rsvp-backend
npm start
\`\`\`

## 2. 📱 For Android Emulator
The configuration has been updated to use \`10.0.2.2:5000\` which maps to your host machine's localhost.

**Restart your Expo development server:**
\`\`\`bash
# Stop current Expo server (Ctrl+C)
# Then restart:
npm run dev:mobile
# OR
cd rsvp-mobile
npx expo start
\`\`\`

## 3. 📱 For Physical Android Device
If using a physical Android device, you need your computer's WiFi IP:

1. Find your WiFi IP address:
   - Windows: \`ipconfig\` (look for WiFi adapter)
   - Mac/Linux: \`ifconfig\` (look for en0 or wlan0)

2. Update the config manually in \`rsvp-mobile/config.ts\`:
   \`\`\`typescript
   return 'http://YOUR_WIFI_IP:5000'; // e.g., http://192.168.1.100:5000
   \`\`\`

## 4. 🍎 For iOS Simulator
Should work with localhost. If not, try:
\`\`\`typescript
return 'http://127.0.0.1:5000';
\`\`\`

## 5. 🌐 Test API Connectivity
Before testing the app, verify the API works:

1. **In your browser:** Visit \`http://localhost:5000/api/health\`
2. **Should return:** \`{"status":"ok"}\` or similar

## 6. 🔧 Additional Troubleshooting

### Clear Expo Cache
\`\`\`bash
cd rsvp-mobile
npx expo start --clear
\`\`\`

### Check Firewall
- Ensure Windows Firewall allows Node.js
- Disable antivirus temporarily to test

### Network Issues
- Ensure mobile device and computer are on same WiFi network
- Try disabling VPN if active
- Check if corporate firewall is blocking connections

## 7. 🧪 Test the Fix

1. Start backend server: \`npm run dev:backend\`
2. Verify API works: Visit \`http://localhost:5000/api/guests/events/demo-event-1\`
3. Start mobile app: \`npm run dev:mobile\`
4. Check mobile app logs for successful API calls

## 8. 📞 Still Having Issues?

If you're still getting "Network request failed":

1. Check the Expo console for detailed error messages
2. Try the API URL directly in your mobile browser
3. Verify the backend server is actually running and accessible
4. Check if any security software is blocking the connection

---
Generated: ${new Date().toISOString()}
`;

    const guidePath = 'MOBILE_NETWORK_TROUBLESHOOTING.md';
    try {
      fs.writeFileSync(guidePath, guide);
      this.log(`✓ Troubleshooting guide created: ${guidePath}`);
      return true;
    } catch (error) {
      this.log(`⚠ Could not create guide: ${error.message}`, 'warning');
      return false;
    }
  }

  async fixMobileNetworkIssues() {
    this.log('🔧 Starting Mobile Network Fix');
    this.log('');

    // Step 1: Backup current config
    this.log('1. Backing up current configuration...');
    const backupSuccess = this.backupCurrentConfig();

    // Step 2: Update mobile config
    this.log('2. Updating mobile configuration...');
    const updateSuccess = this.updateMobileConfig();

    // Step 3: Generate troubleshooting guide
    this.log('3. Generating troubleshooting guide...');
    const guideSuccess = this.generateTroubleshootingGuide();

    // Summary
    this.log('');
    this.log('='.repeat(60));
    this.log('📋 MOBILE NETWORK FIX SUMMARY');
    this.log('='.repeat(60));

    if (updateSuccess) {
      this.log('✅ Mobile configuration updated successfully');
      this.log('✅ Android emulator will now use 10.0.2.2:5000');
      this.log('✅ iOS simulator will use localhost:5000');
    } else {
      this.log('❌ Failed to update mobile configuration');
    }

    if (guideSuccess) {
      this.log('✅ Troubleshooting guide created');
    }

    this.log('');
    this.log('🚀 NEXT STEPS:');
    this.log('1. Start your backend server: npm run dev:backend');
    this.log('2. Restart your Expo development server');
    this.log('3. Test the mobile app - network errors should be resolved');
    this.log('');
    this.log('📖 For detailed troubleshooting: See MOBILE_NETWORK_TROUBLESHOOTING.md');

    return updateSuccess;
  }
}

// Run fix if called directly
if (require.main === module) {
  const fixer = new MobileAPIFixer();
  fixer.fixMobileNetworkIssues()
    .then(success => {
      console.log(`\\n🏁 Mobile network fix completed: ${success ? 'SUCCESS' : 'PARTIAL'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Mobile network fix failed:', error);
      process.exit(1);
    });
}

module.exports = MobileAPIFixer;