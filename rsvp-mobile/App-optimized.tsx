import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Platform, Text, TouchableOpacity, Alert } from 'react-native';
import GuestManagement from './components/GuestManagement';
import InvitationManagement from './components/InvitationManagement';

export default function App() {
  const [activeTab, setActiveTab] = useState<'test' | 'guests' | 'invitations'>('test');
  const eventId = 'demo-event-1';

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  // Use useCallback to prevent unnecessary re-renders
  const testTouch = useCallback(() => {
    console.log('Test touch pressed');
    Alert.alert('Touch Test', 'Touch is working!', [
      { text: 'OK', onPress: () => console.log('Alert dismissed') }
    ]);
  }, []);

  const handleTabChange = useCallback((tab: 'test' | 'guests' | 'invitations') => {
    console.log('Changing tab to:', tab);
    setActiveTab(tab);
  }, []);

  const renderContent = useCallback(() => {
    console.log('Rendering content for tab:', activeTab);
    
    switch (activeTab) {
      case 'test':
        return (
          <View style={styles.testContainer}>
            <Text style={styles.title}>RSVP Mobile App</Text>
            <Text style={styles.subtitle}>Touch Test - Optimized</Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={testTouch}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Test Touch</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleTabChange('guests')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Guest Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleTabChange('invitations')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Invitation Management</Text>
            </TouchableOpacity>
          </View>
        );
      case 'guests':
        return <GuestManagement eventId={eventId} />;
      case 'invitations':
        return <InvitationManagement eventId={eventId} />;
      default:
        return null;
    }
  }, [activeTab, eventId, testTouch, handleTabChange]);

  return (
    <Container style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RSVP Planning App</Text>
        <Text style={styles.headerSubtitle}>Sarah & John's Wedding</Text>
      </View>

      {/* Tab Navigation */}
      {activeTab !== 'test' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'guests' && styles.activeTab]}
            onPress={() => handleTabChange('guests')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'guests' && styles.activeTabText]}>
              👥 Guests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
            onPress={() => handleTabChange('invitations')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'invitations' && styles.activeTabText]}>
              📧 Invitations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => handleTabChange('test')}
            activeOpacity={0.7}
          >
            <Text style={styles.tabText}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
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
});