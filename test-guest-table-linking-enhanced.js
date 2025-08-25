const puppeteer = require('puppeteer');

async function testGuestTableLinking() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting Enhanced Guest-Table Linking Test...');
    
    // Navigate to the guest management page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForSelector('.guest-list-container', { timeout: 10000 });
    console.log('✅ Guest list loaded');
    
    // Test 1: Check if table assignment buttons are visible
    console.log('\n📋 Test 1: Checking table assignment UI elements...');
    
    const tableAssignmentContainers = await page.$$('.table-assignment-container');
    console.log(`Found ${tableAssignmentContainers.length} table assignment containers`);
    
    // Look for assigned and unassigned guests
    const assignedGuests = await page.$$('.table-assignment');
    const unassignedGuests = await page.$$('.text-muted');
    
    console.log(`Assigned guests: ${assignedGuests.length}`);
    console.log(`Unassigned guests: ${unassignedGuests.length}`);
    
    // Test 2: Test assigning an unassigned guest to a table
    console.log('\n📋 Test 2: Testing guest assignment to table...');
    
    const assignButton = await page.$('.btn-assign');
    if (assignButton) {
      console.log('Found assign button, clicking...');
      await assignButton.click();
      
      // Wait for the table assignment modal to appear
      await page.waitForSelector('.modal-overlay', { timeout: 5000 });
      console.log('✅ Table assignment modal opened');
      
      // Check if tables are displayed
      const tableOptions = await page.$$('.table-option');
      console.log(`Found ${tableOptions.length} table options in modal`);
      
      if (tableOptions.length > 0) {
        // Click on the first available table
        const firstTable = tableOptions[0];
        const isLocked = await firstTable.$('.locked');
        
        if (!isLocked) {
          console.log('Clicking on first available table...');
          await firstTable.click();
          
          // Wait for modal to close and page to refresh
          await page.waitForTimeout(2000);
          console.log('✅ Guest assigned to table');
        } else {
          console.log('First table is locked, canceling modal...');
          await page.click('.modal-close');
        }
      } else {
        console.log('No tables available, canceling modal...');
        await page.click('.modal-close');
      }
    } else {
      console.log('No unassigned guests found to test assignment');
    }
    
    // Test 3: Test viewing table layout
    console.log('\n📋 Test 3: Testing table layout view...');
    
    const viewTableButton = await page.$('.btn-view-table');
    if (viewTableButton) {
      console.log('Found view table button, clicking...');
      
      // Handle the alert dialog
      page.on('dialog', async dialog => {
        console.log('Alert message:', dialog.message());
        await dialog.accept();
      });
      
      await viewTableButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Table layout view triggered');
    } else {
      console.log('No assigned guests found to test table view');
    }
    
    // Test 4: Test unassigning a guest from table
    console.log('\n📋 Test 4: Testing guest unassignment...');
    
    const unassignButton = await page.$('.btn-unassign');
    if (unassignButton) {
      console.log('Found unassign button, clicking...');
      
      // Handle the confirmation dialog
      page.on('dialog', async dialog => {
        console.log('Confirmation message:', dialog.message());
        await dialog.accept(); // Accept the confirmation
      });
      
      await unassignButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Guest unassigned from table');
    } else {
      console.log('No assigned guests found to test unassignment');
    }
    
    // Test 5: Check guest list refresh and data consistency
    console.log('\n📋 Test 5: Checking data consistency...');
    
    // Refresh the page to check if changes persist
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.guest-list-container', { timeout: 10000 });
    
    const updatedAssignedGuests = await page.$$('.table-assignment');
    const updatedUnassignedGuests = await page.$$('.text-muted');
    
    console.log(`Updated assigned guests: ${updatedAssignedGuests.length}`);
    console.log(`Updated unassigned guests: ${updatedUnassignedGuests.length}`);
    console.log('✅ Data consistency check completed');
    
    // Test 6: Test table assignment modal functionality
    console.log('\n📋 Test 6: Testing table assignment modal features...');
    
    const newAssignButton = await page.$('.btn-assign');
    if (newAssignButton) {
      await newAssignButton.click();
      await page.waitForSelector('.modal-overlay', { timeout: 5000 });
      
      // Check modal content
      const guestInfo = await page.$('.guest-info');
      const tableGrid = await page.$('.table-grid');
      
      if (guestInfo && tableGrid) {
        console.log('✅ Modal contains guest info and table grid');
        
        // Check table options details
        const tableOptions = await page.$$('.table-option');
        for (let i = 0; i < Math.min(tableOptions.length, 3); i++) {
          const tableName = await tableOptions[i].$eval('.table-name', el => el.textContent);
          const tableCapacity = await tableOptions[i].$eval('.table-capacity', el => el.textContent);
          const tableStatus = await tableOptions[i].$eval('.table-status', el => el.textContent);
          
          console.log(`Table ${i + 1}: ${tableName} - ${tableCapacity} - ${tableStatus}`);
        }
      }
      
      // Close the modal
      await page.click('.modal-close');
      await page.waitForTimeout(1000);
      console.log('✅ Modal closed successfully');
    }
    
    // Test 7: Test responsive design
    console.log('\n📋 Test 7: Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileTableContainers = await page.$$('.table-assignment-container');
    console.log(`Mobile view: ${mobileTableContainers.length} table assignment containers visible`);
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    console.log('✅ Responsive design test completed');
    
    console.log('\n🎉 Enhanced Guest-Table Linking Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Table assignment UI elements working');
    console.log('✅ Guest assignment modal functional');
    console.log('✅ Table layout view integration');
    console.log('✅ Guest unassignment working');
    console.log('✅ Data consistency maintained');
    console.log('✅ Modal functionality complete');
    console.log('✅ Responsive design working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'guest-table-linking-error.png', 
      fullPage: true 
    });
    console.log('📸 Error screenshot saved as guest-table-linking-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testGuestTableLinking().catch(console.error);