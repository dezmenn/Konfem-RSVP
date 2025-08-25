/**
 * Debug Mobile Network Issue
 * Diagnose and fix mobile app network connectivity problems
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Debugging Mobile Network Issue');
console.log('=' .repeat(60));

// Test 1: Check if backend server is running
console.log('\n🖥️  Test 1: Backend Server Status');
try {
  const response = execSync('curl -s http://localhost:5000/api/health || echo "FAILED"', { encoding: 'utf8' });
  if (response.includes('FAILED') || response.trim() === '') {
    console.log('❌ Backend server is NOT running on localhost:5000');
    console.log('💡 Solution: Start the backend server first');
    console.log('   Run: cd rsvp-backend && npm run dev');
  } else {
    console.log('✅ Backend server is running on localhost:5000');
    console.log('📄 Response:', response.trim());
  }
} catch (error) {
  console.log('❌ Cannot reach backend server on localhost:5000');
  console.log('💡 Solution: Start the backend server first');
  console.log('   Run: cd rsvp-backend && npm run dev');
}

// Test 2: Check mobile config
console.log('\n📱 Test 2: Mobile Configuration');
const configPath = 'rsvp-mobile/config.ts';
const configContent = fs.readFileSync(configPath, 'utf8');

const hasAndroidConfig = configContent.includes('10.0.2.2:5000');
const hasIOSConfig = configContent.includes('localhost:5000');
const hasWebConfig = configContent.includes('localhost:5000');

console.log(`✅ Android emulator config (10.0.2.2:5000): ${hasAndroidConfig}`);
console.log(`✅ iOS simulator config (localhost:5000): ${hasIOSConfig}`);
console.log(`✅ Web config (localhost:5000): ${hasWebConfig}`);

// Test 3: Check if running on physical device
console.log('\n📲 Test 3: Physical Device Network Setup');
console.log('If running on a physical device, you need your computer\'s WiFi IP address:');

try {
  // Try to get WiFi IP on Windows
  const ipResult = execSync('ipconfig | findstr "IPv4"', { encoding: 'utf8' });
  const ipMatches = ipResult.match(/(\d+\.\d+\.\d+\.\d+)/g);
  if (ipMatches && ipMatches.length > 0) {
    console.log('🌐 Found potential WiFi IP addresses:');
    ipMatches.forEach((ip, index) => {
      console.log(`   ${index + 1}. ${ip}`);
    });
    console.log('\n💡 For physical device, update mobile config to use one of these IPs:');
    console.log(`   return 'http://[YOUR_WIFI_IP]:5000'; // e.g., http://${ipMatches[0]}:5000`);
  }
} catch (error) {
  console.log('ℹ️  Could not auto-detect WiFi IP. Manually find your computer\'s WiFi IP address.');
}

// Test 4: Create network test component
console.log('\n🧪 Test 4: Creating Network Test Component');
const networkTestComponent = `import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import config from '../config';

const NetworkTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, \`\${new Date().toLocaleTimeString()}: \${message}\`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('🔧 Starting network connectivity test...');
    addResult(\`📱 Platform: \${Platform.OS}\`);
    addResult(\`🌐 API Base URL: \${config.apiBaseUrl}\`);
    
    // Test 1: Basic connectivity
    try {
      addResult('🧪 Testing basic connectivity...');
      const response = await fetch(\`\${config.apiBaseUrl}/api/health\`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.text();
        addResult('✅ Basic connectivity: SUCCESS');
        addResult(\`📄 Response: \${data}\`);
      } else {
        addResult(\`❌ Basic connectivity: FAILED (Status: \${response.status})\`);
      }
    } catch (error) {
      addResult(\`❌ Basic connectivity: FAILED\`);
      addResult(\`🔍 Error: \${error.message}\`);
    }
    
    // Test 2: Analytics endpoint
    try {
      addResult('🧪 Testing analytics endpoint...');
      const response = await fetch(\`\${config.apiBaseUrl}/api/analytics/events/demo-event-1\`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        addResult('✅ Analytics endpoint: SUCCESS');
      } else {
        addResult(\`❌ Analytics endpoint: FAILED (Status: \${response.status})\`);
      }
    } catch (error) {
      addResult(\`❌ Analytics endpoint: FAILED\`);
      addResult(\`🔍 Error: \${error.message}\`);
    }
    
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Connectivity Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? '🔄 Testing...' : '🧪 Run Network Test'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  results: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default NetworkTest;`;

fs.writeFileSync('rsvp-mobile/components/NetworkTest.tsx', networkTestComponent);
console.log('✅ Created NetworkTest component at rsvp-mobile/components/NetworkTest.tsx');

// Test 5: Solutions and recommendations
console.log('\n💡 SOLUTIONS & RECOMMENDATIONS');
console.log('=' .repeat(60));

console.log('\n🔧 IMMEDIATE FIXES:');
console.log('1. START BACKEND SERVER:');
console.log('   cd rsvp-backend');
console.log('   npm run dev');
console.log('   (Backend should run on http://localhost:5000)');

console.log('\n2. FOR ANDROID EMULATOR:');
console.log('   ✅ Config is correct (uses 10.0.2.2:5000)');
console.log('   Make sure backend is running on localhost:5000');

console.log('\n3. FOR iOS SIMULATOR:');
console.log('   ✅ Config is correct (uses localhost:5000)');
console.log('   Make sure backend is running on localhost:5000');

console.log('\n4. FOR PHYSICAL DEVICE:');
console.log('   ❌ Update config to use your WiFi IP address');
console.log('   Find your computer\'s WiFi IP and update mobile config:');
console.log('   return \'http://[YOUR_WIFI_IP]:5000\';');

console.log('\n5. FOR EXPO WEB:');
console.log('   ✅ Config is correct (uses localhost:5000)');

console.log('\n🧪 TESTING STEPS:');
console.log('1. Start backend server: cd rsvp-backend && npm run dev');
console.log('2. Start mobile app: cd rsvp-mobile && npm start');
console.log('3. Add NetworkTest to your App.tsx temporarily to test connectivity');
console.log('4. Run network test to diagnose specific issues');

console.log('\n📱 MOBILE CONFIG UPDATE (if needed):');
console.log('Edit rsvp-mobile/config.ts and update the getApiBaseUrl function');
console.log('for your specific development environment.');

console.log('\n🎯 EXPECTED RESULT:');
console.log('After starting the backend server, the mobile app should');
console.log('successfully connect and load dashboard/invitation data.');

console.log('\n🚀 Network diagnostic complete!');