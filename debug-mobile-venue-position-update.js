#!/usr/bin/env node

/**
 * Debug Mobile Venue Position Update Issues
 * 
 * This script tests the API endpoints used by the mobile venue manager
 * to update element and table positions.
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🔍 Debugging Mobile Venue Position Update Issues...\n');

  // Test 1: Check if backend is running
  console.log('1. Testing backend connectivity...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/guests/demo-event`);
    console.log(`   ✅ Backend is running (Status: ${response.status})`);
  } catch (error) {
    console.log('   ❌ Backend is not running or not accessible');
    console.log('   💡 Make sure to run: npm run dev:backend');
    return;
  }

  // Test 2: Get existing venue elements
  console.log('\n2. Testing venue elements endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/venue-layout/events/demo-event`);
    const data = await response.json();
    console.log(`   ✅ Venue layout endpoint works (Status: ${response.status})`);
    console.log(`   📊 Found ${data.elements?.length || 0} elements`);
    
    if (data.elements && data.elements.length > 0) {
      const testElement = data.elements[0];
      console.log(`   🎯 Test element: ${testElement.name} (ID: ${testElement.id})`);
      
      // Test 3: Try updating element position
      console.log('\n3. Testing element position update...');
      const newPosition = {
        x: testElement.position.x + 10,
        y: testElement.position.y + 10
      };
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/venue-layout/elements/${testElement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition })
      });
      
      if (updateResponse.ok) {
        console.log(`   ✅ Element position update successful (Status: ${updateResponse.status})`);
      } else {
        const errorText = await updateResponse.text();
        console.log(`   ❌ Element position update failed (Status: ${updateResponse.status})`);
        console.log(`   📝 Error: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Venue layout endpoint error: ${error.message}`);
  }

  // Test 4: Get existing tables
  console.log('\n4. Testing tables endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/tables/events/demo-event`);
    const tables = await response.json();
    console.log(`   ✅ Tables endpoint works (Status: ${response.status})`);
    console.log(`   📊 Found ${tables?.length || 0} tables`);
    
    if (tables && tables.length > 0) {
      const testTable = tables[0];
      console.log(`   🎯 Test table: ${testTable.name} (ID: ${testTable.id})`);
      
      // Test 5: Try updating table position
      console.log('\n5. Testing table position update...');
      const newPosition = {
        x: testTable.position.x + 10,
        y: testTable.position.y + 10
      };
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/tables/${testTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition })
      });
      
      if (updateResponse.ok) {
        console.log(`   ✅ Table position update successful (Status: ${updateResponse.status})`);
      } else {
        const errorText = await updateResponse.text();
        console.log(`   ❌ Table position update failed (Status: ${updateResponse.status})`);
        console.log(`   📝 Error: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Tables endpoint error: ${error.message}`);
  }

  // Test 6: Check mobile config
  console.log('\n6. Testing mobile config...');
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, 'rsvp-mobile/config.ts');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const apiUrlMatch = configContent.match(/apiBaseUrl:\s*['"`]([^'"`]+)['"`]/);
    
    if (apiUrlMatch) {
      const mobileApiUrl = apiUrlMatch[1];
      console.log(`   📱 Mobile API URL: ${mobileApiUrl}`);
      
      if (mobileApiUrl === API_BASE_URL) {
        console.log('   ✅ Mobile config matches backend URL');
      } else {
        console.log('   ⚠️  Mobile config URL differs from backend URL');
        console.log(`   💡 Expected: ${API_BASE_URL}`);
        console.log(`   💡 Found: ${mobileApiUrl}`);
      }
    } else {
      console.log('   ❌ Could not find apiBaseUrl in mobile config');
    }
  } else {
    console.log('   ❌ Mobile config file not found');
  }

  console.log('\n🔧 Troubleshooting Steps:');
  console.log('========================');
  console.log('1. Ensure backend is running: npm run dev:backend');
  console.log('2. Check mobile config API URL matches backend');
  console.log('3. Verify demo data is loaded');
  console.log('4. Check network connectivity from mobile app');
  console.log('5. Look for CORS issues in browser/mobile logs');
}

// Run the test
testAPI().catch(console.error);