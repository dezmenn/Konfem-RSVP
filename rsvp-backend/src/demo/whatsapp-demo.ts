import { WhatsAppMockService } from '../services/WhatsAppMockService';

// Mock message repository for demo
class MockMessageRepository {
  async markAsSent(id: string): Promise<any> {
    console.log(`📝 Mock: Marking message ${id} as sent`);
    return { id, deliveryStatus: 'sent' };
  }

  async markAsDelivered(id: string): Promise<any> {
    console.log(`📝 Mock: Marking message ${id} as delivered`);
    return { id, deliveryStatus: 'delivered' };
  }

  async markAsFailed(id: string): Promise<any> {
    console.log(`📝 Mock: Marking message ${id} as failed`);
    return { id, deliveryStatus: 'failed' };
  }
}

// Simple demo to test WhatsApp mock service
async function demoWhatsApp() {
  console.log('📱 Starting WhatsApp Mock Service Demo...\n');

  try {
    // Initialize WhatsApp service with mock repository
    const mockRepo = new MockMessageRepository();
    const whatsAppService = new WhatsAppMockService(mockRepo as any, {
      enableRateLimiting: true,
      rateLimitPerMinute: 5,
      simulateDeliveryDelay: true,
      deliveryDelayMs: 1000,
      errorRate: 0.1, // 10% error rate
      deliveryFailureRate: 0.05, // 5% delivery failure rate
      enableLogging: true
    });

    console.log('✅ WhatsApp Mock Service initialized');
    console.log('Configuration:', whatsAppService.getConfig());

    // Test message personalization
    const testTemplate = 'Dear {{guestName}}, you are invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}. Please RSVP by {{rsvpDeadline}}: {{rsvpLink}}';
    
    const mockData = {
      guestName: 'John Doe',
      eventTitle: 'Wedding Celebration',
      eventDate: new Date('2024-06-15T18:00:00Z').toLocaleDateString(),
      eventTime: new Date('2024-06-15T18:00:00Z').toLocaleTimeString(),
      eventLocation: 'Grand Ballroom',
      rsvpDeadline: new Date('2024-06-01T23:59:59Z').toLocaleDateString(),
      rsvpLink: 'http://localhost:3000/rsvp/token123',
      organizerName: 'Event Organizer'
    };

    const personalizedMessage = testTemplate
      .replace(/\{\{guestName\}\}/g, mockData.guestName)
      .replace(/\{\{eventTitle\}\}/g, mockData.eventTitle)
      .replace(/\{\{eventDate\}\}/g, mockData.eventDate)
      .replace(/\{\{eventTime\}\}/g, mockData.eventTime)
      .replace(/\{\{eventLocation\}\}/g, mockData.eventLocation)
      .replace(/\{\{rsvpDeadline\}\}/g, mockData.rsvpDeadline)
      .replace(/\{\{rsvpLink\}\}/g, mockData.rsvpLink)
      .replace(/\{\{organizerName\}\}/g, mockData.organizerName);

    console.log('\n📝 Message Personalization Test:');
    console.log('Template:', testTemplate);
    console.log('\nPersonalized:', personalizedMessage);

    // Test individual message sending
    console.log('\n📱 Testing Individual Message Sending:');
    
    const guests = [
      { name: 'John Doe', phone: '+1234567890' },
      { name: 'Jane Smith', phone: '+0987654321' },
      { name: 'Bob Johnson', phone: '+1122334455' }
    ];

    const messageResults = [];
    
    for (const guest of guests) {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const personalizedContent = personalizedMessage.replace('John Doe', guest.name);
      
      console.log(`\nSending to ${guest.name} (${guest.phone})...`);
      const result = await whatsAppService.sendMessage(
        guest.phone,
        personalizedContent,
        messageId
      );
      
      messageResults.push({ guest, messageId, result });
      console.log(`Result: ${result.success ? '✅ Success' : '❌ Failed'} ${result.error || ''}`);
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Test bulk message sending
    console.log('\n📦 Testing Bulk Message Sending:');
    
    const bulkMessages = guests.map(guest => ({
      to: guest.phone,
      content: personalizedMessage.replace('John Doe', guest.name),
      messageId: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    const bulkResult = await whatsAppService.sendBulkMessages(bulkMessages);
    console.log('Bulk result:', bulkResult);

    // Wait for delivery simulation
    console.log('\n⏳ Waiting for delivery simulation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check final stats
    console.log('\n📊 Final Statistics:');
    const stats = whatsAppService.getStats();
    console.log('Stats:', stats);

    const rateLimitStatus = whatsAppService.getRateLimitStatus();
    console.log('Rate limit status:', rateLimitStatus);

    // Test rate limiting
    console.log('\n⏱️ Testing Rate Limiting:');
    const testPhone = '+9999999999';
    
    for (let i = 0; i < 7; i++) {
      const messageId = `rate-test-${i}`;
      const result = await whatsAppService.sendMessage(
        testPhone,
        `Rate limit test message ${i + 1}`,
        messageId
      );
      
      console.log(`Message ${i + 1}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
      
      if (!result.success && result.error?.includes('Rate limit')) {
        console.log('✅ Rate limiting is working correctly!');
        break;
      }
    }

    console.log('\n✅ WhatsApp Mock Service demo completed successfully!');
    console.log('\n📱 You can view the admin dashboard at: http://localhost:5000/api/whatsapp-admin/dashboard');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoWhatsApp();
}

export { demoWhatsApp };