import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import config from '../config';

const NetworkTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('🔧 Starting network connectivity test...');
    addResult(`📱 Platform: ${Platform.OS}`);
    addResult(`🌐 API Base URL: ${config.apiBaseUrl}`);
    
    // Test 1: Basic connectivity
    try {
      addResult('🧪 Testing basic connectivity...');
      const response = await fetch(`${config.apiBaseUrl}/api/health`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.text();
        addResult('✅ Basic connectivity: SUCCESS');
        addResult(`📄 Response: ${data}`);
      } else {
        addResult(`❌ Basic connectivity: FAILED (Status: ${response.status})`);
      }
    } catch (error) {
      addResult(`❌ Basic connectivity: FAILED`);
      addResult(`🔍 Error: ${error.message}`);
    }
    
    // Test 2: Analytics endpoint
    try {
      addResult('🧪 Testing analytics endpoint...');
      const response = await fetch(`${config.apiBaseUrl}/api/analytics/events/demo-event-1`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (response.ok) {
        addResult('✅ Analytics endpoint: SUCCESS');
      } else {
        addResult(`❌ Analytics endpoint: FAILED (Status: ${response.status})`);
      }
    } catch (error) {
      addResult(`❌ Analytics endpoint: FAILED`);
      addResult(`🔍 Error: ${error.message}`);
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

export default NetworkTest;