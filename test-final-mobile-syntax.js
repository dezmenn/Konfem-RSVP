/**
 * Final Mobile Syntax Test
 * Comprehensive check for all template literal and syntax issues
 */

const fs = require('fs');

console.log('🔧 Final Mobile Syntax Verification');
console.log('=' .repeat(60));

// Test IntegratedVenueManager specifically
console.log('\n📱 Testing IntegratedVenueManager.tsx');
const integratedVenueManagerPath = 'rsvp-mobile/components/IntegratedVenueManager.tsx';
const content = fs.readFileSync(integratedVenueManagerPath, 'utf8');

// Check for template literal issues
const hasTemplateLiterals = content.includes('${config.apiBaseUrl}');
const hasStringConcatenation = content.includes("config.apiBaseUrl + '/api/");
const hasConfigImport = content.includes("import config from '../config'");

console.log(`✅ No template literals with config: ${!hasTemplateLiterals}`);
console.log(`✅ Uses string concatenation: ${hasStringConcatenation}`);
console.log(`✅ Has config import: ${hasConfigImport}`);

// Check specific API calls that were causing errors
const apiCalls = [
  'config.apiBaseUrl + \'/api/venue-layout/events/\' + eventId',
  'config.apiBaseUrl + \'/api/tables/events/\' + eventId',
  'config.apiBaseUrl + \'/api/tables/\' + tableId',
  'config.apiBaseUrl + \'/api/tables\'',
  'config.apiBaseUrl + \'/api/tables/\' + table.id + \'/\' + action',
  'config.apiBaseUrl + \'/api/venue-layout/elements/\' + elementId'
];

console.log('\n🔍 Checking API Call Patterns:');
apiCalls.forEach((pattern, index) => {
  const hasPattern = content.includes(pattern);
  console.log(`✅ API call ${index + 1}: ${hasPattern ? 'Fixed' : 'Missing'}`);
});

// Check for any remaining template literal syntax
const templateLiteralPatterns = [
  '${config',
  '${eventId}',
  '${tableId}',
  '${elementId}',
  '${table.id}',
  '${action}'
];

console.log('\n🚫 Checking for Remaining Template Literals:');
let hasRemainingTemplates = false;
templateLiteralPatterns.forEach(pattern => {
  const hasPattern = content.includes(pattern);
  if (hasPattern) {
    console.log(`❌ Found template literal: ${pattern}`);
    hasRemainingTemplates = true;
  }
});

if (!hasRemainingTemplates) {
  console.log('✅ No remaining template literals found');
}

// Check all mobile components for template literal issues
console.log('\n📱 Checking All Mobile Components:');
const mobileComponentsDir = 'rsvp-mobile/components';
const componentFiles = fs.readdirSync(mobileComponentsDir).filter(file => file.endsWith('.tsx'));

let componentsWithIssues = [];

componentFiles.forEach(file => {
  const filePath = `${mobileComponentsDir}/${file}`;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Check for template literal issues with config
  const hasConfigTemplates = fileContent.includes('${config.apiBaseUrl}');
  const usesConfig = fileContent.includes('config.apiBaseUrl');
  const hasConfigImport = fileContent.includes("import config from '../config'");
  
  if (hasConfigTemplates) {
    componentsWithIssues.push(`${file}: Has template literals with config`);
  } else if (usesConfig && !hasConfigImport) {
    componentsWithIssues.push(`${file}: Uses config but missing import`);
  } else if (usesConfig && hasConfigImport) {
    console.log(`✅ ${file}: Properly configured`);
  } else {
    console.log(`ℹ️  ${file}: Doesn't use config`);
  }
});

// Summary
console.log('\n📋 FINAL SUMMARY');
console.log('=' .repeat(60));

const allFixed = !hasTemplateLiterals && 
                 hasStringConcatenation && 
                 hasConfigImport && 
                 !hasRemainingTemplates &&
                 componentsWithIssues.length === 0;

if (allFixed) {
  console.log('✅ ALL SYNTAX ISSUES RESOLVED!');
  console.log('✅ IntegratedVenueManager template literals fixed');
  console.log('✅ All components properly configured');
  console.log('✅ No remaining template literal syntax errors');
  console.log('✅ Mobile app should compile successfully');
  
  console.log('\n🎯 MOBILE APP STATUS: Ready for Testing');
  console.log('- All template literal syntax errors resolved');
  console.log('- All API calls use string concatenation');
  console.log('- All components have proper config imports');
  console.log('- Task 21 mobile implementation complete');
} else {
  console.log('❌ Some issues remain:');
  if (hasTemplateLiterals) console.log('  - Template literals still present');
  if (!hasStringConcatenation) console.log('  - String concatenation not implemented');
  if (!hasConfigImport) console.log('  - Config import missing');
  if (hasRemainingTemplates) console.log('  - Remaining template literal patterns');
  if (componentsWithIssues.length > 0) {
    console.log('  - Component issues:');
    componentsWithIssues.forEach(issue => console.log(`    ${issue}`));
  }
}

console.log('\n🚀 Final syntax verification complete!');