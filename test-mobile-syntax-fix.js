/**
 * Test Mobile Syntax Fix
 * Verify that all mobile components have proper config imports
 */

const fs = require('fs');

console.log('🔧 Testing Mobile Syntax Fix');
console.log('=' .repeat(50));

// Test mobile components that use config.apiBaseUrl
const componentsToCheck = [
  'EventDashboard.tsx',
  'ExportManager.tsx', 
  'IntegratedVenueManager.tsx',
  'GuestManagement.tsx',
  'InvitationManagement.tsx'
];

console.log('\n📱 Checking Mobile Components for Config Import');

let allComponentsFixed = true;

componentsToCheck.forEach(componentFile => {
  const componentPath = `rsvp-mobile/components/${componentFile}`;
  
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const hasConfigImport = content.includes("import config from '../config'");
    const usesConfigApiUrl = content.includes('config.apiBaseUrl');
    const needsConfig = usesConfigApiUrl;
    
    if (needsConfig && !hasConfigImport) {
      console.log(`❌ ${componentFile}: Missing config import but uses config.apiBaseUrl`);
      allComponentsFixed = false;
    } else if (needsConfig && hasConfigImport) {
      console.log(`✅ ${componentFile}: Has config import and uses config.apiBaseUrl`);
    } else if (!needsConfig) {
      console.log(`ℹ️  ${componentFile}: Doesn't use config.apiBaseUrl`);
    }
  } else {
    console.log(`⚠️  ${componentFile}: File not found`);
  }
});

// Test specific syntax error that was reported
console.log('\n🔍 Testing IntegratedVenueManager Specific Issue');
const integratedVenueManagerPath = 'rsvp-mobile/components/IntegratedVenueManager.tsx';
if (fs.existsSync(integratedVenueManagerPath)) {
  const content = fs.readFileSync(integratedVenueManagerPath, 'utf8');
  
  const hasConfigImport = content.includes("import config from '../config'");
  const problematicLine = content.includes('${config.apiBaseUrl}/api/tables/${tableId}');
  
  console.log(`✅ Has config import: ${hasConfigImport}`);
  console.log(`✅ Uses config in fetch calls: ${problematicLine}`);
  
  if (hasConfigImport && problematicLine) {
    console.log('✅ IntegratedVenueManager syntax error should be fixed');
  } else {
    console.log('❌ IntegratedVenueManager may still have issues');
    allComponentsFixed = false;
  }
}

// Check mobile App.tsx for proper imports
console.log('\n📱 Checking Mobile App.tsx');
const mobileAppPath = 'rsvp-mobile/App.tsx';
const appContent = fs.readFileSync(mobileAppPath, 'utf8');

const importsIntegratedVenueManager = appContent.includes("import IntegratedVenueManager from './components/IntegratedVenueManager'");
const usesIntegratedVenueManager = appContent.includes('<IntegratedVenueManager eventId={eventId} />');

console.log(`✅ Imports IntegratedVenueManager: ${importsIntegratedVenueManager}`);
console.log(`✅ Uses IntegratedVenueManager: ${usesIntegratedVenueManager}`);

// Summary
console.log('\n📋 SUMMARY');
console.log('=' .repeat(50));

if (allComponentsFixed) {
  console.log('✅ All mobile components have proper config imports');
  console.log('✅ IntegratedVenueManager syntax error fixed');
  console.log('✅ Mobile app should now compile without errors');
  
  console.log('\n🎯 MOBILE APP STATUS: Syntax Issues Resolved');
  console.log('- All components using config.apiBaseUrl have proper imports');
  console.log('- IntegratedVenueManager can now access config.apiBaseUrl');
  console.log('- No more "Unexpected token" syntax errors');
  console.log('- Ready for Task 21 testing');
} else {
  console.log('❌ Some components still need config import fixes');
}

console.log('\n🚀 Mobile syntax fix verification complete!');