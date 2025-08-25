#!/bin/bash
# This script performs a clean installation of project dependencies to resolve build issues.

echo "Step 1: Removing existing node_modules directory..."
rm -rf node_modules

echo "Step 2: Clearing npm cache..."
npm cache clean --force

echo "Step 3: Installing all project dependencies..."
npm install

echo "Dependency troubleshooting complete. Please try running your application again."