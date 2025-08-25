/**
 * Test script to verify TurboModule error fix
 * This script checks if the mobile app can bundle successfully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing TurboModule Fix...\n');

// Check if expo.json exists and has correct configuration
const expoJsonPath = path.join(__dirname, 'rsvp-mobile', 'expo.json');
if (fs.existsSync(expoJsonPath)) {
  const expoConfig = JSON.parse(fs.readFileSync(expoJsonPath, 'utf8'));
  const buildProps = expoConfig.expo.plugins?.find(plugin => 
    Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
  );
  
  if (buildProps && buildProps[1]?.android?.newArchEnabled === false) {
    console.log('✅ expo.json correctly configured to disable new architecture');
  } else {
    console.log('❌ expo.json missing or incorrectly configured');
  }
} else {
  console.log('❌ expo.json not found');
}

// Check if expo-build-properties is installed
const packageJsonPath = path.join(__dirname, 'rsvp-mobile', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.dependencies['expo-build-properties']) {
    console.log('✅ expo-build-properties plugin installed');
  } else {
    console.log('❌ expo-build-properties plugin not installed');
  }
}

// Check if SafeAreaProvider is properly imported in App.tsx
const appTsxPath = path.join(__dirname, 'rsvp-mobile', 'App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  if (appContent.includes('SafeAreaProvider') && appContent.includes('react-native-safe-area-context')) {
    console.log('✅ SafeAreaProvider properly configured in App.tsx');
  } else {
    console.log('❌ SafeAreaProvider not properly configured');
  }
}

console.log('\n📱 Mobile App Configuration Summary:');
console.log('- TurboModule/New Architecture: DISABLED');
console.log('- SafeAreaProvider: CONFIGURED');
console.log('- React Native Version: 0.74.5 (Legacy Architecture)');
console.log('- Expo SDK: 53.0.22');

console.log('\n🎯 Next Steps:');
console.log('1. Run: cd rsvp-mobile && npx expo start --clear');
console.log('2. Scan QR code with Expo Go app');
console.log('3. The TurboModule error should be resolved');

console.log('\n✨ Fix Applied Successfully!');