/**
 * Mobile App Configuration - Fixed for Network Connectivity
 * Updated: 2025-08-09T08:57:49.309Z
 */

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // --- PRODUCTION ---
  if (!__DEV__) {
    return 'https://your-production-api.com';
  }

  // --- DEVELOPMENT ---
  // For physical devices (both Android and iOS), you must use your computer's local network IP address.
  // Find it by running `ipconfig` (Windows) or `ifconfig` (macOS/Linux).
  // Replace '192.168.100.55' with your actual IP address.
  const DEV_API_URL = 'http://192.168.100.55:5000'; // <--- REPLACE THIS

  // For the Android Emulator, 10.0.2.2 maps to the host machine's localhost.
  const EMULATOR_API_URL = 'http://10.0.2.2:5000';

  // Set this to `true` if you are ONLY using the Android Emulator
  const USE_ANDROID_EMULATOR = false;

  if (Platform.OS === 'android' && USE_ANDROID_EMULATOR) {
    return EMULATOR_API_URL;
  }
  
  // For iOS simulators and all physical devices, use the dev IP.
  return DEV_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export const config = {
  apiBaseUrl: API_BASE_URL,
  eventId: 'demo-event-1',
  wsUrl: API_BASE_URL.replace('http', 'ws'),
  
  // Network settings
  timeout: 15000, // 15 second timeout for mobile networks
  retries: 3,     // Retry failed requests
};

// Debug logging
console.log('📱 Mobile App Config:', {
  platform: Platform.OS,
  apiBaseUrl: config.apiBaseUrl,
  isDev: __DEV__,
  timestamp: new Date().toISOString()
});

export default config;