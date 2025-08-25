const io = require('socket.io-client');

const eventId = 'demo-event-1';
const webSocketUrl = 'http://localhost:5000';

const webClient = io(webSocketUrl, { query: { eventId, platform: 'web' } });
const mobileClient = io(webSocketUrl, { query: { eventId, platform: 'mobile' } });

console.log('Connecting clients...');

webClient.on('connect', () => {
  console.log('Web client connected');
  webClient.emit('register', { eventId, platform: 'web' });
});

mobileClient.on('connect', () => {
  console.log('Mobile client connected');
  mobileClient.emit('register', { eventId, platform: 'mobile' });
});

webClient.on('registered', () => {
  console.log('Web client registered');
  webClient.emit('subscribe_event', eventId);
});

mobileClient.on('registered', () => {
  console.log('Mobile client registered');
  mobileClient.emit('subscribe_event', eventId);
});

// Test: Web client updates layout, mobile client should receive it
setTimeout(() => {
  console.log('Web client sending layout update...');
  const newLayout = {
    elements: [{ id: 'element-1', name: 'Stage', type: 'stage', position: { x: 100, y: 100 }, dimensions: { width: 200, height: 100 }, color: '#8B4513', eventId }],
    tables: [{ id: 'table-1', name: 'Table 1', capacity: 8, position: { x: 300, y: 200 }, isLocked: false, assignedGuests: [], eventId }],
  };
  webClient.emit('update-layout', { eventId, layout: newLayout });
}, 2000);

mobileClient.on('layout-updated', (layout) => {
  console.log('Mobile client received layout update:', layout);
  // Add assertions here to verify the layout is correct
  if (layout.elements[0].name === 'Stage' && layout.tables[0].name === 'Table 1') {
    console.log('Test passed!');
  } else {
    console.error('Test failed!');
  }
  webClient.disconnect();
  mobileClient.disconnect();
  process.exit(0);
});

setTimeout(() => {
    console.error('Test timed out!');
    webClient.disconnect();
    mobileClient.disconnect();
    process.exit(1);
}, 5000)