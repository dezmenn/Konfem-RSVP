import React, { useState, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  Platform, 
  Text, 
  TouchableOpacity, 
  Alert,
  InteractionManager
} from 'react-native';

export default function App() {
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouch, setLastTouch] = useState('None');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use ref to prevent stale closures
  const touchCountRef = useRef(0);

  // Debounced touch handler to prevent rapid-fire touches from blocking the thread
  const handleTouch = useCallback((type: string) => {
    if (isProcessing) {
      console.log('Touch ignored - processing');
      return;
    }

    setIsProcessing(true);
    
    // Use InteractionManager to ensure UI responsiveness
    InteractionManager.runAfterInteractions(() => {
      const newCount = touchCountRef.current + 1;
      touchCountRef.current = newCount;
      
      // Batch state updates
      requestAnimationFrame(() => {
        setTouchCount(newCount);
        setLastTouch(`${type} - ${new Date().toLocaleTimeString()}`);
        setIsProcessing(false);
      });
      
      // Minimal logging to prevent console spam
      if (newCount % 5 === 0 || newCount <= 10) {
        console.log(`${type} touch ${newCount}`);
      }
    });
  }, [isProcessing]);

  const showAlert = useCallback(() => {
    if (isProcessing) return;
    
    Alert.alert(
      'Touch Test', 
      `Touch is working! Count: ${touchCount}`,
      [{ text: 'OK', onPress: () => console.log('Alert dismissed') }]
    );
  }, [touchCount, isProcessing]);

  const resetCounter = useCallback(() => {
    if (isProcessing) return;
    
    touchCountRef.current = 0;
    setTouchCount(0);
    setLastTouch('Reset');
    console.log('Counter reset');
  }, [isProcessing]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Stable Touch Test</Text>
        <Text style={styles.info}>Platform: {Platform.OS}</Text>
        <Text style={styles.info}>Touch Count: {touchCount}</Text>
        <Text style={styles.info}>Last: {lastTouch}</Text>
        <Text style={styles.info}>Status: {isProcessing ? 'Processing...' : 'Ready'}</Text>
      </View>

      <View style={styles.content}>
        {/* Primary Test Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Test</Text>
          <TouchableOpacity 
            style={[styles.button, isProcessing && styles.buttonDisabled]} 
            onPress={() => handleTouch('Primary')}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'Touch Test'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.alertButton, isProcessing && styles.buttonDisabled]} 
            onPress={showAlert}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Show Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.resetButton, isProcessing && styles.buttonDisabled]} 
            onPress={resetCounter}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Reset Counter</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Test Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Tap "Touch Test" repeatedly{'\n'}
            2. Watch the counter increase{'\n'}
            3. Try "Show Alert" and "Reset"{'\n'}
            4. Test should remain responsive{'\n'}
            5. If it stops, shake device for dev menu
          </Text>
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug: React Native {Platform.constants.reactNativeVersion?.major}.{Platform.constants.reactNativeVersion?.minor}
          </Text>
          <Text style={styles.debugText}>
            Hermes: {(global as any).HermesInternal ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  alertButton: {
    backgroundColor: '#28a745',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#0056b3',
    lineHeight: 20,
  },
  debugInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
});