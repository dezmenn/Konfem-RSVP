import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  Platform, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Pressable,
  Button,
  Dimensions
} from 'react-native';

export default function App() {
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouch, setLastTouch] = useState('None');

  const screenData = Dimensions.get('window');

  const handleTouch = (type: string) => {
    const newCount = touchCount + 1;
    setTouchCount(newCount);
    setLastTouch(`${type} - ${new Date().toLocaleTimeString()}`);
    console.log(`${type} touch ${newCount} at ${new Date().toLocaleTimeString()}`);
  };

  const showAlert = () => {
    Alert.alert('Alert Test', 'Alert is working!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Touch Debug App</Text>
        <Text style={styles.info}>Platform: {Platform.OS}</Text>
        <Text style={styles.info}>Screen: {screenData.width}x{screenData.height}</Text>
        <Text style={styles.info}>Touch Count: {touchCount}</Text>
        <Text style={styles.info}>Last Touch: {lastTouch}</Text>
      </View>

      <View style={styles.content}>
        {/* Native Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Native Button</Text>
          <Button 
            title="Native Button Test" 
            onPress={() => handleTouch('Native Button')}
          />
        </View>

        {/* TouchableOpacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. TouchableOpacity</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTouch('TouchableOpacity')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>TouchableOpacity Test</Text>
          </TouchableOpacity>
        </View>

        {/* Pressable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Pressable</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? '#0056b3' : '#007bff' }
            ]}
            onPress={() => handleTouch('Pressable')}
          >
            <Text style={styles.buttonText}>Pressable Test</Text>
          </Pressable>
        </View>

        {/* Large Touch Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Large Touch Area</Text>
          <TouchableOpacity 
            style={styles.largeButton} 
            onPress={() => handleTouch('Large Area')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Large Touch Area</Text>
          </TouchableOpacity>
        </View>

        {/* Alert Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Alert Test</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={showAlert}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Show Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Instructions:{'\n'}
            1. Try each button type{'\n'}
            2. Check if touch count increases{'\n'}
            3. Note which buttons work{'\n'}
            4. Check console logs{'\n'}
            5. Try shaking device for dev menu
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  largeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  instructionText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});