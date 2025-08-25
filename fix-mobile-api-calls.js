#!/usr/bin/env node

/**
 * Fix Mobile API Calls
 * Updates mobile components to use proper API base URLs instead of relative paths
 */

const fs = require('fs');
const path = require('path');

class MobileAPICallsFixer {
  constructor() {
    this.componentsToFix = [
      'rsvp-mobile/components/MobileVenueLayoutManager.tsx',
      'rsvp-mobile/components/VenueLayoutManager.tsx',
      'rsvp-mobile/components/TableManagement.tsx',
      'rsvp-mobile/components/IntegratedVenueManager.tsx',
      'rsvp-mobile/components/TouchOptimizedTableArrangement.tsx',
      'rsvp-mobile/components/GuestList.tsx',
      'rsvp-mobile/components/EventDashboard.tsx'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  fixAPICallsInFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.log(`⚠ File not found: ${filePath}`, 'warning');
      return false;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Check if config import already exists
      const hasConfigImport = content.includes("import { config }") || content.includes("import config");
      
      if (!hasConfigImport) {
        // Add config import at the top
        const importMatch = content.match(/import.*from ['"]react-native['"];?\n/);
        if (importMatch) {
          const insertIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
          content = content.slice(0, insertIndex) + 
                   "import { config } from '../config';\n" + 
                   content.slice(insertIndex);
          modified = true;
        }
      }

      // Fix relative API calls
      const apiCallPatterns = [
        {
          pattern: /fetch\(`\/api\//g,
          replacement: "fetch(`${config.apiBaseUrl}/api/"
        },
        {
          pattern: /fetch\('\/api\//g,
          replacement: "fetch(`${config.apiBaseUrl}/api/"
        },
        {
          pattern: /fetch\("\/api\//g,
          replacement: "fetch(`${config.apiBaseUrl}/api/"
        }
      ];

      for (const { pattern, replacement } of apiCallPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, replacement);
          modified = true;
          this.log(`✓ Fixed ${matches.length} API call(s) in ${path.basename(filePath)}`);
        }
      }

      // Fix hardcoded localhost URLs
      const localhostPatterns = [
        {
          pattern: /fetch\(`http:\/\/localhost:5000\/api\//g,
          replacement: "fetch(`${config.apiBaseUrl}/api/"
        },
        {
          pattern: /fetch\('http:\/\/localhost:5000\/api\//g,
          replacement: "fetch(`${config.apiBaseUrl}/api/"
        }
      ];

      for (const { pattern, replacement } of localhostPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, replacement);
          modified = true;
          this.log(`✓ Fixed ${matches.length} hardcoded localhost URL(s) in ${path.basename(filePath)}`);
        }
      }

      if (modified) {
        // Create backup
        const backupPath = filePath + '.backup';
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
        }

        // Write fixed content
        fs.writeFileSync(filePath, content);
        this.log(`✅ Updated: ${filePath}`);
        return true;
      } else {
        this.log(`ℹ No changes needed: ${path.basename(filePath)}`);
        return false;
      }

    } catch (error) {
      this.log(`✗ Error fixing ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  async fixAllComponents() {
    this.log('🔧 Starting Mobile API Calls Fix');
    this.log('📱 Updating mobile components to use proper API base URLs...');
    this.log('');

    let fixedCount = 0;
    let totalCount = 0;

    for (const componentPath of this.componentsToFix) {
      this.log(`Checking: ${path.basename(componentPath)}`);
      const wasFixed = this.fixAPICallsInFile(componentPath);
      if (wasFixed) fixedCount++;
      totalCount++;
    }

    // Summary
    this.log('');
    this.log('='.repeat(60));
    this.log('📋 MOBILE API CALLS FIX SUMMARY');
    this.log('='.repeat(60));
    
    this.log(`✅ Components processed: ${totalCount}`);
    this.log(`🔧 Components updated: ${fixedCount}`);
    this.log(`ℹ Components unchanged: ${totalCount - fixedCount}`);

    if (fixedCount > 0) {
      this.log('');
      this.log('✅ SUCCESS: Mobile components updated to use proper API URLs');
      this.log('📱 Components will now use config.apiBaseUrl instead of relative paths');
      this.log('🔄 Restart your Expo development server to apply changes');
    } else {
      this.log('');
      this.log('ℹ INFO: No components needed updating');
      this.log('🔍 The issue might be elsewhere - check network connectivity');
    }

    // Next steps
    this.log('');
    this.log('🚀 NEXT STEPS:');
    this.log('1. Restart Expo development server: npm run dev:mobile');
    this.log('2. Clear Expo cache: npx expo start --clear');
    this.log('3. Check mobile app console for API URL being used');
    this.log('4. Verify backend server is running: npm run dev:backend');

    // Create a test component to verify the fix
    this.createTestComponent();

    return fixedCount > 0;
  }

  createTestComponent() {
    const testComponent = `import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { config } from '../config';

const NetworkTest = () => {
  useEffect(() => {
    console.log('🔍 Network Test - API Base URL:', config.apiBaseUrl);
    
    // Test API connectivity
    const testAPI = async () => {
      try {
        console.log('📡 Testing API connection...');
        const response = await fetch(\`\${config.apiBaseUrl}/api/tables/events/demo-event-1\`);
        console.log('📊 API Response Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Test Success - Data received:', data.length || 'N/A', 'items');
        } else {
          console.log('⚠ API Test Warning - HTTP', response.status);
        }
      } catch (error) {
        console.log('❌ API Test Failed:', error.message);
      }
    };
    
    testAPI();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Network Test Component</Text>
      <Text>Check console for API test results</Text>
      <Text>API URL: {config.apiBaseUrl}</Text>
    </View>
  );
};

export default NetworkTest;`;

    try {
      fs.writeFileSync('rsvp-mobile/components/NetworkTest.tsx', testComponent);
      this.log('');
      this.log('🧪 Created test component: rsvp-mobile/components/NetworkTest.tsx');
      this.log('   Use this component to test API connectivity in your app');
    } catch (error) {
      this.log(`⚠ Could not create test component: ${error.message}`, 'warning');
    }
  }
}

// Run fix if called directly
if (require.main === module) {
  const fixer = new MobileAPICallsFixer();
  fixer.fixAllComponents()
    .then(success => {
      console.log(`\n🏁 Mobile API calls fix completed: ${success ? 'COMPONENTS UPDATED' : 'NO CHANGES NEEDED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Mobile API calls fix failed:', error);
      process.exit(1);
    });
}

module.exports = MobileAPICallsFixer;