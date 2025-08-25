#!/bin/bash
# This script starts the React Native development server with a clean cache to resolve build issues.

echo "Starting the development server with a clean cache..."
npx react-native start --reset-cache

echo "Development server started."