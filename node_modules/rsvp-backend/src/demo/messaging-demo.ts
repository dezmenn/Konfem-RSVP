import { MessagingService } from '../services/MessagingService';
import { WhatsAppMockService } from '../services/WhatsAppMockService';
import { MessageRepository } from '../repositories/MessageRepository';

// Simple demo to test messaging functionality
async function demoMessaging() {
  console.log('🚀 Starting Messaging Service Demo...\n');

  try {
    // Initialize services
    const messageRepository = new MessageRepository();
    const whatsAppService = new WhatsAppMockService(messageRepository, {
      enableRateLimiting: false,
      simulateDeliveryDelay: false,
      errorRate: 0,
      enableLogging: true
    });
    const messagingService = new MessagingService(whatsAppService);

    console.log('✅ Services initialized successfully');

    // Test message personalization
    const testContent = 'Dear {{guestName}}, you are invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. RSVP: {{rsvpLink}}';
    
    const mockGuest = {
      id: 'guest-1',
      name: 'John Doe',
      phoneNumber: '+1234567890'
    };

    const mockEvent = {
      id: 'event-1',
      title: 'Wedding Celebration',
      date: new Date('2024-06-15T18:00:00Z'),
      location: 'Grand Ballroom'
    };

    const mockRsvpLink = 'http://localhost:3000/rsvp/token123';

    // Test personalization (using private method logic)
    const personalizedContent = testContent
      .replace(/\{\{guestName\}\}/g, mockGuest.name)
      .replace(/\{\{eventTitle\}\}/g, mockEvent.title)
      .replace(/\{\{eventDate\}\}/g, mockEvent.date.toLocaleDateString())
      .replace(/\{\{eventLocation\}\}/g, mockEvent.location)
      .replace(/\{\{rsvpLink\}\}/g, mockRsvpLink);

    console.log('\n📝 Message Personalization Test:');
    console.log('Original template:', testContent);
    console.log('Personalized message:', personalizedContent);

    // Test WhatsApp mock service directly
    console.log('\n📱 Testing WhatsApp Mock Service:');
    
    const messageId = 'test-msg-' + Date.now();
    const result = await whatsAppService.sendMessage(
      mockGuest.phoneNumber,
      personalizedContent,
      messageId
    );

    console.log('Send result:', result);

    // Wait a bit for delivery simulation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check delivery status
    const deliveryStatus = whatsAppService.getDeliveryStatus(messageId);
    console.log('Delivery status:', deliveryStatus);

    // Get service stats
    const stats = whatsAppService.getStats();
    console.log('Service stats:', stats);

    console.log('\n✅ Messaging demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoMessaging();
}

export { demoMessaging };