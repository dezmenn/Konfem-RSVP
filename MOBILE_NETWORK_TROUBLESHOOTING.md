# Mobile Network Troubleshooting Guide

## Issue: "Network request failed" in mobile app

### Root Cause
The mobile app cannot connect to the backend API server.

### Solutions (try in order):

## 1. 🚀 Start the Backend Server
```bash
# In the root directory, start the backend
npm run dev:backend

# OR if that doesn't work:
cd rsvp-backend
npm start
```

## 2. 📱 For Android Emulator
The configuration has been updated to use `10.0.2.2:5000` which maps to your host machine's localhost.

**Restart your Expo development server:**
```bash
# Stop current Expo server (Ctrl+C)
# Then restart:
npm run dev:mobile
# OR
cd rsvp-mobile
npx expo start
```

## 3. 📱 For Physical Android Device
If using a physical Android device, you need your computer's WiFi IP:

1. Find your WiFi IP address:
   - Windows: `ipconfig` (look for WiFi adapter)
   - Mac/Linux: `ifconfig` (look for en0 or wlan0)

2. Update the config manually in `rsvp-mobile/config.ts`:
   ```typescript
   return 'http://YOUR_WIFI_IP:5000'; // e.g., http://192.168.1.100:5000
   ```

## 4. 🍎 For iOS Simulator
Should work with localhost. If not, try:
```typescript
return 'http://127.0.0.1:5000';
```

## 5. 🌐 Test API Connectivity
Before testing the app, verify the API works:

1. **In your browser:** Visit `http://localhost:5000/api/health`
2. **Should return:** `{"status":"ok"}` or similar

## 6. 🔧 Additional Troubleshooting

### Clear Expo Cache
```bash
cd rsvp-mobile
npx expo start --clear
```

### Check Firewall
- Ensure Windows Firewall allows Node.js
- Disable antivirus temporarily to test

### Network Issues
- Ensure mobile device and computer are on same WiFi network
- Try disabling VPN if active
- Check if corporate firewall is blocking connections

## 7. 🧪 Test the Fix

1. Start backend server: `npm run dev:backend`
2. Verify API works: Visit `http://localhost:5000/api/guests/events/demo-event-1`
3. Start mobile app: `npm run dev:mobile`
4. Check mobile app logs for successful API calls

## 8. 📞 Still Having Issues?

If you're still getting "Network request failed":

1. Check the Expo console for detailed error messages
2. Try the API URL directly in your mobile browser
3. Verify the backend server is actually running and accessible
4. Check if any security software is blocking the connection

---
Generated: 2025-08-09T08:57:49.310Z
