const puppeteer = require('puppeteer');

async function testAutoArrangement() {
  console.log('🚀 Starting Auto Table Arrangement Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await page.waitForSelector('.admin-layout', { timeout: 10000 });
    console.log('✅ Application loaded successfully');
    
    // Navigate to venue management
    console.log('🏢 Navigating to venue management...');
    const venueLink = await page.$('a[href*="venue"]');
    if (venueLink) {
      await venueLink.click();
      await page.waitForSelector('.integrated-venue-manager', { timeout: 5000 });
      console.log('✅ Venue management page loaded');
    } else {
      console.log('⚠️ Venue link not found, trying direct navigation...');
      await page.goto('http://localhost:3000/venue', { waitUntil: 'networkidle0' });
    }
    
    // Switch to Auto Arrangement mode
    console.log('🎯 Switching to Auto Arrangement mode...');
    await page.waitForSelector('.mode-selector', { timeout: 5000 });
    
    const arrangementButton = await page.$('button:contains("Auto Arrangement")');
    if (arrangementButton) {
      await arrangementButton.click();
      console.log('✅ Switched to Auto Arrangement mode');
    } else {
      // Try alternative selector
      const buttons = await page.$$('.mode-selector button');
      for (let button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Auto Arrangement') || text.includes('Arrangement')) {
          await button.click();
          console.log('✅ Switched to Auto Arrangement mode');
          break;
        }
      }
    }
    
    // Wait for auto arrangement component to load
    await page.waitForSelector('.auto-table-arrangement', { timeout: 5000 });
    console.log('✅ Auto Table Arrangement component loaded');
    
    // Test auto-arrangement options
    console.log('⚙️ Testing auto-arrangement options...');
    
    // Check if options are visible
    const optionsSection = await page.$('.arrangement-options');
    if (optionsSection) {
      console.log('✅ Auto-arrangement options panel found');
      
      // Test toggling options
      const checkboxes = await page.$$('.options-grid input[type="checkbox"]');
      console.log(`📋 Found ${checkboxes.length} option checkboxes`);
      
      // Toggle some options
      if (checkboxes.length > 0) {
        await checkboxes[0].click();
        console.log('✅ Toggled first option');
      }
      
      // Test max guests per table input
      const maxGuestsInput = await page.$('input[type="number"]');
      if (maxGuestsInput) {
        await maxGuestsInput.click({ clickCount: 3 });
        await maxGuestsInput.type('6');
        console.log('✅ Updated max guests per table to 6');
      }
    }
    
    // Test guest lists
    console.log('👥 Testing guest lists...');
    
    const unseatedSection = await page.$('.unseated-guests');
    if (unseatedSection) {
      const unseatedCount = await page.$eval('.unseated-guests h3', el => {
        const match = el.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      });
      console.log(`📊 Found ${unseatedCount} unseated guests`);
    }
    
    const seatedSection = await page.$('.seated-guests');
    if (seatedSection) {
      const seatedCount = await page.$eval('.seated-guests h3', el => {
        const match = el.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      });
      console.log(`📊 Found ${seatedCount} seated guests`);
    }
    
    // Test table layout
    console.log('🪑 Testing table layout...');
    
    const tableCards = await page.$$('.table-card');
    console.log(`🏷️ Found ${tableCards.length} table cards`);
    
    if (tableCards.length > 0) {
      // Click on first table to select it
      await tableCards[0].click();
      console.log('✅ Selected first table');
      
      // Check table capacity info
      const capacityIndicator = await page.$eval('.table-card .capacity-indicator', el => el.textContent);
      console.log(`📊 Table capacity: ${capacityIndicator}`);
    }
    
    // Test drag and drop functionality
    console.log('🖱️ Testing drag and drop functionality...');
    
    const guestItems = await page.$$('.guest-item');
    if (guestItems.length > 0 && tableCards.length > 0) {
      console.log('🎯 Testing guest drag and drop...');
      
      // Get the first guest and first table
      const firstGuest = guestItems[0];
      const firstTable = tableCards[0];
      
      // Get bounding boxes
      const guestBox = await firstGuest.boundingBox();
      const tableBox = await firstTable.boundingBox();
      
      if (guestBox && tableBox) {
        // Perform drag and drop
        await page.mouse.move(guestBox.x + guestBox.width / 2, guestBox.y + guestBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(tableBox.x + tableBox.width / 2, tableBox.y + tableBox.height / 2);
        await page.mouse.up();
        
        console.log('✅ Performed drag and drop operation');
        
        // Wait for any updates
        await page.waitForTimeout(1000);
      }
    }
    
    // Test auto-arrangement button
    console.log('🤖 Testing auto-arrangement functionality...');
    
    const autoArrangeButton = await page.$('.auto-arrange-btn');
    if (autoArrangeButton) {
      const isDisabled = await page.$eval('.auto-arrange-btn', el => el.disabled);
      
      if (!isDisabled) {
        console.log('🎯 Clicking auto-arrange button...');
        await autoArrangeButton.click();
        
        // Wait for arrangement to complete
        await page.waitForTimeout(3000);
        
        // Check if button text changed to indicate completion
        const buttonText = await page.$eval('.auto-arrange-btn', el => el.textContent);
        console.log(`📝 Auto-arrange button text: ${buttonText}`);
        
        if (buttonText.includes('Arranging')) {
          console.log('⏳ Auto-arrangement in progress...');
          // Wait for completion
          await page.waitForFunction(
            () => !document.querySelector('.auto-arrange-btn').textContent.includes('Arranging'),
            { timeout: 10000 }
          );
          console.log('✅ Auto-arrangement completed');
        }
      } else {
        console.log('⚠️ Auto-arrange button is disabled');
      }
    }
    
    // Test statistics
    console.log('📊 Checking arrangement statistics...');
    
    const statsSection = await page.$('.arrangement-stats');
    if (statsSection) {
      const stats = await page.$$eval('.stat-item', items => {
        return items.map(item => {
          const label = item.querySelector('.stat-label').textContent;
          const value = item.querySelector('.stat-value').textContent;
          return { label, value };
        });
      });
      
      console.log('📈 Current statistics:');
      stats.forEach(stat => {
        console.log(`   ${stat.label}: ${stat.value}`);
      });
    }
    
    // Test refresh functionality
    console.log('🔄 Testing refresh functionality...');
    
    const refreshButton = await page.$('.refresh-btn');
    if (refreshButton) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Refresh button clicked');
    }
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    console.log('✅ Tested mobile viewport');
    
    // Test tablet viewport
    await page.setViewport({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    console.log('✅ Tested tablet viewport');
    
    // Return to desktop viewport
    await page.setViewport({ width: 1400, height: 900 });
    await page.waitForTimeout(1000);
    console.log('✅ Returned to desktop viewport');
    
    console.log('🎉 Auto Table Arrangement test completed successfully!');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and exit');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Don't close browser automatically for inspection
    // await browser.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the test
testAutoArrangement().catch(console.error);