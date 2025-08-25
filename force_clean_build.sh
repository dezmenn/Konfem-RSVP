#!/bin/bash
# This script performs a forceful and comprehensive clean of the entire project to resolve persistent build issues.

echo "Step 1: Deleting all node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "Step 2: Deleting all package-lock.json files..."
find . -name "package-lock.json" -type f -prune -exec rm -f '{}' +

echo "Step 3: Clearing npm cache..."
npm cache clean --force

echo "Step 4: Reinstalling all project dependencies..."
npm install

echo "Step 5: Starting the development server with a clean cache..."
npm run dev:mobile

echo "Force clean build complete. The application should now run without any build errors."