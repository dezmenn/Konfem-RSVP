import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Platform, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';

export default function App() {
  const [touchCount, setTouchCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'test' | 'simple'>('test');

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  const testTouch = () => {
    const newCount = touchCount + 1;
    setTouchCount(newCount);
    console.log(`Touch ${newCount} - Working!`);
    Alert.alert('Touch Test', `Touch ${newCount} is working!`);
  };

  const resetCount = () => {
    setTouchCount(0);
    console.log('Count reset');
  };

  const switchToSimple = () => {
    setActiveTab('simple');
    console.log('Switched to simple view');
  };

  const switchToTest = () => {
    setActiveTab('test');
    console.log('Switched to test view');
  };

  if (activeTab === 'simple') {
    return (
      <Container style={styles.container}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Simple View</Text>
          <Text style={styles.subtitle}>Testing scroll and touch</Text>
          
          <TouchableOpacity style={styles.button} onPress={switchToTest}>
            <Text style={styles.buttonText}>Back to Test</Text>
          </TouchableOpacity>

          {/* Generate some content to test scrolling */}
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listText}>Item {i + 1}</Text>
              <TouchableOpacity 
                style={styles.smallButton} 
                onPress={() => Alert.alert('Item', `Pressed item ${i + 1}`)}
              >
                <Text style={styles.smallButtonText}>Press</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Touch Test App</Text>
        <Text style={styles.headerSubtitle}>Minimal Version</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Touch Counter: {touchCount}</Text>
        <Text style={styles.subtitle}>Test continuous touch response</Text>
        
        <TouchableOpacity style={styles.button} onPress={testTouch}>
          <Text style={styles.buttonText}>Test Touch ({touchCount})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={resetCount}>
          <Text style={styles.buttonText}>Reset Counter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={switchToSimple}>
          <Text style={styles.buttonText}>Test Scroll View</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Instructions:{'\n'}
            1. Tap "Test Touch" multiple times{'\n'}
            2. Check if counter increases{'\n'}
            3. Test "Reset Counter"{'\n'}
            4. Test "Test Scroll View"{'\n'}
            5. Report when it stops responding
          </Text>
        </View>
      </View>
    </Container>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
  smallButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});