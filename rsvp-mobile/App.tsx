import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  Platform, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  BackHandler
} from 'react-native';
import GuestManagement from './components/GuestManagement';
import InvitationManagement from './components/InvitationManagement';
import EventDashboard from './components/EventDashboard';
import IntegratedVenueManager from './components/IntegratedVenueManager';
import ExportManager from './components/ExportManager';
import ResponsiveNavigation from './components/ResponsiveNavigation';

type TabType = 'dashboard' | 'guests' | 'invitations' | 'venue' | 'exports';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(false);
  
  const eventId = 'demo-event-1';
  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [activeTab]);

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: '📊' },
    { id: 'guests', title: 'Guests', icon: '👥' },
    { id: 'invitations', title: 'Invites', icon: '📧' },
    { id: 'venue', title: 'Venue', icon: '🏛️' },
    { id: 'exports', title: 'Export', icon: '📄' },
  ];

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as TabType);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EventDashboard eventId={eventId} />;
      case 'guests':
        return <GuestManagement eventId={eventId} />;
      case 'invitations':
        return <InvitationManagement eventId={eventId} />;
      case 'venue':
        return <IntegratedVenueManager eventId={eventId} />;
      case 'exports':
        return <ExportManager eventId={eventId} />;
      default:
        return null;
    }
  };

  return (
    <Container style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, isLandscape && styles.compactHeader]}>
        <Text style={[styles.headerTitle, isLandscape && styles.compactHeaderTitle]}>
          RSVP Planning App
        </Text>
        {!isLandscape && (
          <Text style={styles.headerSubtitle}>Sarah & John's Wedding</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <ResponsiveNavigation
        items={navigationItems}
        activeItem={activeTab}
        onItemPress={handleTabChange}
        orientation="horizontal"
        showLabels={!isLandscape}
        compact={isLandscape}
      />
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  compactHeader: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  compactHeaderTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
});
