#!/bin/bash
# Development Optimization Script for Touch Responsiveness

echo "🔧 Optimizing React Native development environment for touch responsiveness..."

# Kill existing Metro processes
echo "Stopping existing Metro processes..."
pkill -f "metro" || true

# Clear Metro cache
echo "Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!

# Optimize ADB settings
echo "Optimizing ADB settings..."
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5

# Wait for Metro to start
sleep 5

echo "✅ Development environment optimized!"
echo "📱 Now connect your device via WiFi using QR code for best performance"
echo "🔌 Avoid USB connection during touch testing"

# Keep Metro running
wait $METRO_PID