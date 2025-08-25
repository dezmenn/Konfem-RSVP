/**
 * Mobile App Configuration - Updated for Network Connectivity
 * Generated on: 2025-08-09T08:56:26.459Z
 */

import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android emulator, use 10.0.2.2
      // For Android physical device, use your computer's WiFi IP
      return Platform.select({
        android: 'http://198.18.28.251:5000', // Your WiFi IP
        default: 'http://localhost:5000'
      });
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:5000';
    } else {
      // Web/Expo web
      return 'http://localhost:5000';
    }
  } else {
    // Production mode
    return 'https://your-production-api.com';
  }
};

export const API_BASE_URL = getApiBaseUrl();

export const config = {
  apiBaseUrl: API_BASE_URL,
  eventId: 'demo-event-1',
  wsUrl: API_BASE_URL.replace('http', 'ws'),
  
  // Debug settings
  timeout: 10000, // 10 second timeout
  retries: 3,     // Retry failed requests 3 times
};

// Debug logging
console.log('Mobile App Config:', {
  platform: Platform.OS,
  apiBaseUrl: config.apiBaseUrl,
  isDev: __DEV__,
  timestamp: new Date().toISOString()
});

export default config;