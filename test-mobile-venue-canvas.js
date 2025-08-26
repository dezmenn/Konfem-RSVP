const fs = require('fs');

console.log('🎨 Testing Mobile Venue Canvas Visibility\n');

const mobileVenueFile = 'rsvp-mobile/components/MobileVenueLayoutManager.tsx';

if (fs.existsSync(mobileVenueFile)) {
  const content = fs.readFileSync(mobileVenueFile, 'utf8');
  
  console.log('📋 Canvas Implementation Check:');
  
  // Check for canvas structure
  const canvasChecks = [
    { name: 'Canvas container exists', check: content.includes('canvasContainer') },
    { name: 'ScrollView with canvas', check: content.includes('ScrollView') && content.includes('horizontal') },
    { name: 'Animated.View for canvas', check: content.includes('Animated.View') },
    { name: 'Canvas dimensions set', check: content.includes('CANVAS_WIDTH') && content.includes('CANVAS_HEIGHT') },
    { name: 'Grid background', check: content.includes('styles.grid') },
    { name: 'Elements rendering', check: content.includes('elements.map') },
    { name: 'Tables rendering', check: content.includes('tables.map') },
    { name: 'Touch handlers', check: content.includes('canvasTouchable') },
    { name: 'Pan responder', check: content.includes('panResponder.panHandlers') },
    { name: 'Transform animations', check: content.includes('scaleAnim') && content.includes('translateXAnim') }
  ];
  
  canvasChecks.forEach(check => {
    console.log(`  ${check.check ? '✅' : '❌'} ${check.name}`);
  });
  
  console.log('\n🎯 Canvas Styling Check:');
  
  // Check for essential styles
  const styleChecks = [
    { name: 'Canvas container flex', check: /canvasContainer:\s*{[^}]*flex:\s*1/.test(content) },
    { name: 'Canvas background', check: /canvas:\s*{[^}]*backgroundColor:\s*['"]white['"]/.test(content) },
    { name: 'Canvas dimensions', check: content.includes('width: CANVAS_WIDTH') && content.includes('height: CANVAS_HEIGHT') },
    { name: 'Element positioning', check: content.includes('position: \'absolute\'') },
    { name: 'Element dimensions', check: content.includes('element.dimensions.width') && content.includes('element.dimensions.height') },
    { name: 'Table positioning', check: content.includes('table.position.x') && content.includes('table.position.y') },
    { name: 'Visual feedback styles', check: content.includes('selectedElement') && content.includes('selectedTable') }
  ];
  
  styleChecks.forEach(check => {
    console.log(`  ${check.check ? '✅' : '❌'} ${check.name}`);
  });
  
  console.log('\n🔧 Potential Issues:');
  
  // Check for potential visibility issues
  if (!content.includes('backgroundColor: \'white\'')) {
    console.log('  ⚠️  Canvas might not have visible background');
  }
  
  if (!content.includes('borderWidth') || !content.includes('borderColor')) {
    console.log('  ⚠️  Canvas might not have visible borders');
  }
  
  if (!content.includes('elevation') && !content.includes('shadowColor')) {
    console.log('  ⚠️  Canvas might not have depth/shadow effects');
  }
  
  // Check if elements have proper dimensions
  if (!content.includes('element.dimensions.width') || !content.includes('element.dimensions.height')) {
    console.log('  ⚠️  Elements might not have proper dimensions');
  }
  
  // Check if tables have proper positioning
  if (!content.includes('table.position.x') || !content.includes('table.position.y')) {
    console.log('  ⚠️  Tables might not have proper positioning');
  }
  
  console.log('\n💡 Recommendations:');
  console.log('1. Make sure you\'re in the correct mode (Layout/Tables/Arrangement)');
  console.log('2. Try adding some test elements using the Library button');
  console.log('3. Try creating tables using the Add Table button');
  console.log('4. Check if the canvas has proper dimensions and is scrollable');
  console.log('5. Ensure the canvas has a visible background and borders');
  
  console.log('\n🎨 Canvas Structure Found:');
  
  // Extract canvas structure
  const canvasMatch = content.match(/\/\* Canvas \*\/[\s\S]*?<\/View>/);
  if (canvasMatch) {
    console.log('✅ Canvas section found in component');
    
    // Check for specific elements
    if (content.includes('elements.map(element =>')) {
      console.log('✅ Elements rendering logic found');
    }
    
    if (content.includes('tables.map(table =>')) {
      console.log('✅ Tables rendering logic found');
    }
    
    if (content.includes('TouchableOpacity') && content.includes('onPress')) {
      console.log('✅ Touch interaction logic found');
    }
  } else {
    console.log('❌ Canvas section not found or malformed');
  }
  
} else {
  console.log('❌ MobileVenueLayoutManager.tsx not found');
}

console.log('\n🚀 Canvas Visibility Test Complete!');
console.log('\nIf you still don\'t see the canvas:');
console.log('1. Check that you\'re using the MobileVenueLayoutManager component');
console.log('2. Verify the component is properly imported and rendered');
console.log('3. Make sure there are no console errors in the app');
console.log('4. Try refreshing the app or restarting the development server');