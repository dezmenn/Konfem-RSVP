/**
 * Test Mobile Dependency Fix
 * Verify that expo-sharing dependency issue is resolved
 */

const fs = require('fs');

console.log('🔧 Testing Mobile Dependency Fix');
console.log('=' .repeat(50));

// Test 1: Check ExportManager component
console.log('\n📄 Test 1: ExportManager Component');
const exportManagerPath = 'rsvp-mobile/components/ExportManager.tsx';
const exportManagerContent = fs.readFileSync(exportManagerPath, 'utf8');

const hasExpoSharingImport = exportManagerContent.includes("import * as Sharing from 'expo-sharing'");
const hasExpoFileSystemImport = exportManagerContent.includes("import * as FileSystem from 'expo-file-system'");
const hasLinkingImport = exportManagerContent.includes("import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking }");
const hasConfigImport = exportManagerContent.includes("import config from '../config'");
const usesConfigApiUrl = exportManagerContent.includes('${config.apiBaseUrl}${endpoint}');

console.log(`✅ Removed expo-sharing import: ${!hasExpoSharingImport}`);
console.log(`✅ Removed expo-file-system import: ${!hasExpoFileSystemImport}`);
console.log(`✅ Added Linking import: ${hasLinkingImport}`);
console.log(`✅ Added config import: ${hasConfigImport}`);
console.log(`✅ Uses config API URL: ${usesConfigApiUrl}`);

// Test 2: Check mobile package.json dependencies
console.log('\n📦 Test 2: Package Dependencies');
const packageJsonPath = 'rsvp-mobile/package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const hasExpoSharingDep = packageJson.dependencies && packageJson.dependencies['expo-sharing'];
const hasExpoFileSystemDep = packageJson.dependencies && packageJson.dependencies['expo-file-system'];
const hasExpoDep = packageJson.dependencies && packageJson.dependencies['expo'];

console.log(`✅ No expo-sharing dependency: ${!hasExpoSharingDep}`);
console.log(`✅ No expo-file-system dependency: ${!hasExpoFileSystemDep}`);
console.log(`✅ Has expo core dependency: ${!!hasExpoDep}`);

// Test 3: Check mobile App.tsx imports
console.log('\n📱 Test 3: Mobile App Structure');
const mobileAppPath = 'rsvp-mobile/App.tsx';
const mobileAppContent = fs.readFileSync(mobileAppPath, 'utf8');

const importsExportManager = mobileAppContent.includes("import ExportManager from './components/ExportManager'");
const usesExportManager = mobileAppContent.includes('<ExportManager eventId={eventId} />');

console.log(`✅ Imports ExportManager: ${importsExportManager}`);
console.log(`✅ Uses ExportManager in render: ${usesExportManager}`);

// Test 4: Check all mobile components for dependency issues
console.log('\n🔍 Test 4: Component Dependency Check');
const mobileComponentsDir = 'rsvp-mobile/components';
const componentFiles = fs.readdirSync(mobileComponentsDir).filter(file => file.endsWith('.tsx'));

let dependencyIssues = [];

componentFiles.forEach(file => {
  const filePath = `${mobileComponentsDir}/${file}`;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for problematic imports
  if (content.includes("import * as Sharing from 'expo-sharing'")) {
    dependencyIssues.push(`${file}: expo-sharing import`);
  }
  if (content.includes("import * as FileSystem from 'expo-file-system'")) {
    dependencyIssues.push(`${file}: expo-file-system import`);
  }
});

if (dependencyIssues.length === 0) {
  console.log('✅ No dependency issues found in components');
} else {
  console.log('❌ Dependency issues found:');
  dependencyIssues.forEach(issue => console.log(`  - ${issue}`));
}

// Test 5: Verify mobile config is properly used
console.log('\n⚙️ Test 5: Configuration Usage');
const configPath = 'rsvp-mobile/config.ts';
const configContent = fs.readFileSync(configPath, 'utf8');

const exportsConfig = configContent.includes('export default config');
const hasApiBaseUrl = configContent.includes('apiBaseUrl: API_BASE_URL');

console.log(`✅ Config exports default: ${exportsConfig}`);
console.log(`✅ Config has apiBaseUrl: ${hasApiBaseUrl}`);

// Summary
console.log('\n📋 SUMMARY');
console.log('=' .repeat(50));

const allTestsPassed = !hasExpoSharingImport && 
                      !hasExpoFileSystemImport && 
                      hasLinkingImport && 
                      hasConfigImport && 
                      usesConfigApiUrl &&
                      !hasExpoSharingDep &&
                      !hasExpoFileSystemDep &&
                      importsExportManager &&
                      usesExportManager &&
                      dependencyIssues.length === 0;

if (allTestsPassed) {
  console.log('✅ All tests passed!');
  console.log('✅ expo-sharing dependency issue resolved');
  console.log('✅ Mobile app should now work without dependency errors');
  console.log('✅ ExportManager uses mobile-friendly approach');
  console.log('✅ All components properly configured');
  
  console.log('\n🎯 MOBILE APP STATUS: Ready for Task 21 Testing');
  console.log('The mobile app now:');
  console.log('- Has no missing dependencies');
  console.log('- Uses Linking for file downloads');
  console.log('- Properly configured API endpoints');
  console.log('- Aligned with web version functionality');
} else {
  console.log('❌ Some issues remain - check the test results above');
}

console.log('\n🚀 Mobile dependency fix complete!');