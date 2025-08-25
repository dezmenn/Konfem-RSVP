#!/usr/bin/env node

/**
 * Test Mobile API Fix Verification
 * Verifies that mobile components are now using proper API URLs
 */

const fs = require('fs');

class MobileAPIFixVerifier {
  constructor() {
    this.componentsToCheck = [
      'rsvp-mobile/components/MobileVenueLayoutManager.tsx',
      'rsvp-mobile/components/VenueLayoutManager.tsx',
      'rsvp-mobile/components/TableManagement.tsx',
      'rsvp-mobile/components/IntegratedVenueManager.tsx',
      'rsvp-mobile/components/TouchOptimizedTableArrangement.tsx',
      'rsvp-mobile/components/EventDashboard.tsx'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }

  verifyComponent(filePath) {
    if (!fs.existsSync(filePath)) {
      return { exists: false, hasConfigImport: false, hasRelativeUrls: false, hasProperUrls: false };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for config import
    const hasConfigImport = content.includes("import { config }") || content.includes("import config");
    
    // Check for relative URLs (bad)
    const relativeUrlMatches = content.match(/fetch\(`\/api\//g) || content.match(/fetch\('\/api\//g) || [];
    const hasRelativeUrls = relativeUrlMatches.length > 0;
    
    // Check for proper URLs (good)
    const properUrlMatches = content.match(/fetch\(`\$\{config\.apiBaseUrl\}\/api\//g) || [];
    const hasProperUrls = properUrlMatches.length > 0;
    
    return {
      exists: true,
      hasConfigImport,
      hasRelativeUrls,
      hasProperUrls,
      relativeUrlCount: relativeUrlMatches.length,
      properUrlCount: properUrlMatches.length
    };
  }

  async runVerification() {
    this.log('🔍 Verifying Mobile API Fix');
    this.log('📱 Checking if components use proper API URLs...');
    this.log('');

    const results = [];
    let totalComponents = 0;
    let fixedComponents = 0;
    let issuesFound = 0;

    for (const componentPath of this.componentsToCheck) {
      const fileName = componentPath.split('/').pop();
      const verification = this.verifyComponent(componentPath);
      
      if (!verification.exists) {
        this.log(`⚠ ${fileName}: File not found`, 'warning');
        continue;
      }

      totalComponents++;
      
      if (verification.hasProperUrls && !verification.hasRelativeUrls) {
        fixedComponents++;
        this.log(`✅ ${fileName}: Fixed (${verification.properUrlCount} proper URLs)`);
      } else if (verification.hasRelativeUrls) {
        issuesFound++;
        this.log(`❌ ${fileName}: Still has ${verification.relativeUrlCount} relative URLs`, 'error');
      } else if (!verification.hasProperUrls) {
        this.log(`ℹ ${fileName}: No API calls found`);
      }

      if (!verification.hasConfigImport && verification.hasProperUrls) {
        this.log(`⚠ ${fileName}: Uses config but missing import`, 'warning');
      }

      results.push({ fileName, ...verification });
    }

    // Summary
    this.log('');
    this.log('='.repeat(60));
    this.log('📊 MOBILE API FIX VERIFICATION SUMMARY');
    this.log('='.repeat(60));
    
    this.log(`📱 Components checked: ${totalComponents}`);
    this.log(`✅ Components fixed: ${fixedComponents}`);
    this.log(`❌ Components with issues: ${issuesFound}`);
    
    const successRate = totalComponents > 0 ? (fixedComponents / totalComponents) * 100 : 0;
    this.log(`📈 Success rate: ${successRate.toFixed(1)}%`);

    // Detailed results
    this.log('');
    this.log('📋 Detailed Results:');
    results.forEach(result => {
      if (result.exists) {
        const status = result.hasProperUrls && !result.hasRelativeUrls ? '✅' : 
                     result.hasRelativeUrls ? '❌' : 'ℹ';
        this.log(`   ${status} ${result.fileName}:`);
        this.log(`      Config import: ${result.hasConfigImport ? '✅' : '❌'}`);
        this.log(`      Proper URLs: ${result.properUrlCount}`);
        this.log(`      Relative URLs: ${result.relativeUrlCount}`);
      }
    });

    // Instructions
    this.log('');
    if (issuesFound === 0) {
      this.log('🎉 SUCCESS: All mobile components are using proper API URLs!');
      this.log('');
      this.log('🚀 NEXT STEPS:');
      this.log('1. Restart your Expo development server:');
      this.log('   npm run dev:mobile');
      this.log('   OR');
      this.log('   cd rsvp-mobile && npx expo start --clear');
      this.log('');
      this.log('2. The network errors should now be resolved!');
      this.log('3. Check the mobile app console for successful API calls');
      this.log('4. Look for logs like: "📱 Mobile App Config: { apiBaseUrl: \'http://10.0.2.2:5000\' }"');
    } else {
      this.log('⚠ ISSUES FOUND: Some components still have problems');
      this.log('🔧 Manual fix may be required for components with relative URLs');
    }

    // Test component instructions
    this.log('');
    this.log('🧪 TESTING:');
    this.log('A NetworkTest component has been created at:');
    this.log('rsvp-mobile/components/NetworkTest.tsx');
    this.log('');
    this.log('Add it to your app temporarily to test API connectivity:');
    this.log('import NetworkTest from \'./components/NetworkTest\';');
    this.log('// Then use <NetworkTest /> in your app');

    return issuesFound === 0;
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new MobileAPIFixVerifier();
  verifier.runVerification()
    .then(success => {
      console.log(`\n🏁 Mobile API fix verification completed: ${success ? 'ALL GOOD' : 'ISSUES FOUND'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = MobileAPIFixVerifier;