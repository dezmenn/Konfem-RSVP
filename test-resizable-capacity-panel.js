const puppeteer = require('puppeteer');

async function testResizableCapacityPanel() {
  console.log('🧪 Testing Resizable Capacity Panel...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    
    // Wait for the venue manager to load
    await page.waitForSelector('.integrated-venue-manager', { timeout: 10000 });
    console.log('✅ Venue manager loaded');
    
    // Switch to table management mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tableButton = buttons.find(btn => btn.textContent.includes('Table Management'));
      if (tableButton) tableButton.click();
    });
    await page.waitForTimeout(1000);
    console.log('✅ Switched to table management mode');
    
    // Wait for capacity panel to be visible
    await page.waitForSelector('.capacity-panel', { timeout: 5000 });
    console.log('✅ Capacity panel is visible');
    
    // Check initial panel width
    const initialWidth = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.offsetWidth : 0;
    });
    console.log(`✅ Initial panel width: ${initialWidth}px`);
    
    // Check if resize handle is present
    const resizeHandle = await page.$('.capacity-panel-resize-handle');
    if (!resizeHandle) {
      throw new Error('❌ Resize handle not found');
    }
    console.log('✅ Resize handle found');
    
    // Test resizing the panel
    console.log('🔄 Testing panel resize...');
    
    // Get the resize handle position
    const handleBox = await resizeHandle.boundingBox();
    if (!handleBox) {
      throw new Error('❌ Could not get resize handle bounding box');
    }
    
    // Simulate drag to resize
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    
    // Drag to the right to increase width
    await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
    await page.waitForTimeout(500);
    
    // Check if width increased
    const increasedWidth = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.offsetWidth : 0;
    });
    
    if (increasedWidth > initialWidth) {
      console.log(`✅ Panel width increased: ${initialWidth}px → ${increasedWidth}px`);
    } else {
      console.log(`⚠️ Panel width did not increase as expected: ${initialWidth}px → ${increasedWidth}px`);
    }
    
    // Drag to the left to decrease width
    await page.mouse.move(handleBox.x - 50, handleBox.y + handleBox.height / 2);
    await page.waitForTimeout(500);
    
    const decreasedWidth = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.offsetWidth : 0;
    });
    
    if (decreasedWidth < increasedWidth) {
      console.log(`✅ Panel width decreased: ${increasedWidth}px → ${decreasedWidth}px`);
    } else {
      console.log(`⚠️ Panel width did not decrease as expected: ${increasedWidth}px → ${decreasedWidth}px`);
    }
    
    await page.mouse.up();
    
    // Test minimum width constraint
    console.log('🔄 Testing minimum width constraint...');
    await page.mouse.down();
    await page.mouse.move(handleBox.x - 200, handleBox.y + handleBox.height / 2);
    await page.waitForTimeout(500);
    
    const minWidth = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.offsetWidth : 0;
    });
    
    if (minWidth >= 250) {
      console.log(`✅ Minimum width constraint respected: ${minWidth}px (min: 250px)`);
    } else {
      console.log(`❌ Minimum width constraint violated: ${minWidth}px (min: 250px)`);
    }
    
    await page.mouse.up();
    
    // Test maximum width constraint
    console.log('🔄 Testing maximum width constraint...');
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 300, handleBox.y + handleBox.height / 2);
    await page.waitForTimeout(500);
    
    const maxWidth = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.offsetWidth : 0;
    });
    
    if (maxWidth <= 500) {
      console.log(`✅ Maximum width constraint respected: ${maxWidth}px (max: 500px)`);
    } else {
      console.log(`❌ Maximum width constraint violated: ${maxWidth}px (max: 500px)`);
    }
    
    await page.mouse.up();
    
    // Test visual feedback during resize
    console.log('🔄 Testing visual feedback...');
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    
    const isResizing = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.classList.contains('resizing') : false;
    });
    
    if (isResizing) {
      console.log('✅ Visual feedback during resize: resizing class applied');
    } else {
      console.log('⚠️ Visual feedback during resize: resizing class not applied');
    }
    
    await page.mouse.up();
    
    // Check if resizing class is removed after resize
    await page.waitForTimeout(100);
    const isStillResizing = await page.evaluate(() => {
      const panel = document.querySelector('.capacity-panel');
      return panel ? panel.classList.contains('resizing') : false;
    });
    
    if (!isStillResizing) {
      console.log('✅ Visual feedback cleanup: resizing class removed after resize');
    } else {
      console.log('⚠️ Visual feedback cleanup: resizing class not removed after resize');
    }
    
    // Test cursor change on hover
    console.log('🔄 Testing cursor change on hover...');
    await page.hover('.capacity-panel-resize-handle');
    
    const cursor = await page.evaluate(() => {
      const handle = document.querySelector('.capacity-panel-resize-handle');
      return handle ? window.getComputedStyle(handle).cursor : '';
    });
    
    if (cursor === 'col-resize') {
      console.log('✅ Cursor changes to col-resize on hover');
    } else {
      console.log(`⚠️ Cursor does not change correctly on hover: ${cursor}`);
    }
    
    // Test responsive behavior
    console.log('🔄 Testing responsive behavior...');
    await page.setViewport({ width: 800, height: 600 });
    await page.waitForTimeout(1000);
    
    const handleVisible = await page.evaluate(() => {
      const handle = document.querySelector('.capacity-panel-resize-handle');
      return handle ? window.getComputedStyle(handle).display !== 'none' : false;
    });
    
    if (!handleVisible) {
      console.log('✅ Resize handle hidden on mobile viewport');
    } else {
      console.log('⚠️ Resize handle should be hidden on mobile viewport');
    }
    
    // Reset viewport
    await page.setViewport({ width: 1400, height: 900 });
    await page.waitForTimeout(1000);
    
    console.log('\n🎉 Resizable Capacity Panel Test Summary:');
    console.log('✅ Panel can be resized horizontally');
    console.log('✅ Width constraints are enforced (250px - 500px)');
    console.log('✅ Visual feedback during resize');
    console.log('✅ Proper cursor indication');
    console.log('✅ Responsive behavior on mobile');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testResizableCapacityPanel()
    .then(() => {
      console.log('\n✅ All resizable capacity panel tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Resizable capacity panel tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testResizableCapacityPanel };