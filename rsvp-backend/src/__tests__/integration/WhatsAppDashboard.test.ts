import { WhatsAppMockService } from '../../services/WhatsAppMockService';
import { MessageRepository } from '../../repositories/MessageRepository';
import { DemoDataService } from '../../services/DemoDataService';

// Mock the MessageRepository
jest.mock('../../repositories/MessageRepository');
const MockedMessageRepository = MessageRepository as jest.MockedClass<typeof MessageRepository>;

// Mock logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('WhatsApp Admin Dashboard Integration', () => {
  let mockMessageRepository: jest.Mocked<MessageRepository>;
  let whatsAppService: WhatsAppMockService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessageRepository = new MockedMessageRepository() as jest.Mocked<MessageRepository>;
    
    // Mock repository methods
    mockMessageRepository.markAsSent = jest.fn().mockResolvedValue({} as any);
    mockMessageRepository.markAsDelivered = jest.fn().mockResolvedValue({} as any);
    mockMessageRepository.markAsFailed = jest.fn().mockResolvedValue({} as any);

    // Create WhatsApp service with test configuration
    whatsAppService = new WhatsAppMockService(mockMessageRepository, {
      enableRateLimiting: true,
      rateLimitPerMinute: 10,
      simulateDeliveryDelay: false, // Disable for faster tests
      errorRate: 0.1, // 10% error rate
      deliveryFailureRate: 0.05, // 5% delivery failure rate
      enableLogging: false // Disable logging for cleaner test output
    });
  });

  afterEach(() => {
    whatsAppService.reset();
  });

  describe('Dashboard Data Management', () => {
    it('should provide statistics for dashboard display', () => {
      // Send some test messages
      whatsAppService.sendMessage('+1234567890', 'Test message 1', 'test-1');
      whatsAppService.sendMessage('+1234567891', 'Test message 2', 'test-2');

      const stats = whatsAppService.getStats();
      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalDelivered');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('deliveryRate');
      expect(stats.totalSent).toBeGreaterThan(0);
    });

    it('should provide messages list for dashboard display', async () => {
      await whatsAppService.sendMessage('+1234567890', 'Dashboard test message', 'dashboard-test');
      
      const messages = whatsAppService.getSentMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].messageId).toBe('dashboard-test');
      expect(messages[0].to).toBe('+1234567890');
      expect(messages[0].content).toBe('Dashboard test message');
    });

    it('should provide delivery statuses for dashboard display', async () => {
      await whatsAppService.sendMessage('+1234567890', 'Status test message', 'status-test');
      
      const statuses = whatsAppService.getDeliveryStatuses();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].messageId).toBe('status-test');
      expect(['sent', 'delivered', 'failed']).toContain(statuses[0].status);
    });
  });

  describe('Dashboard Service Integration', () => {
    beforeEach(async () => {
      // Load demo data first, then seed WhatsApp service
      const demoDataService = DemoDataService.getInstance();
      await demoDataService.loadDemoData();
      const demoMessages = demoDataService.getMessages('demo-event-1');
      await whatsAppService.seedDemoData(demoMessages);
    });

    it('should provide complete statistics data for dashboard', () => {
      const stats = whatsAppService.getStats();
      const rateLimitStatus = whatsAppService.getRateLimitStatus();
      const config = whatsAppService.getConfig();

      // Verify stats structure matches dashboard expectations
      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalDelivered');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('deliveryRate');

      // Should have demo data
      expect(stats.totalSent).toBeGreaterThan(0);
      expect(stats.totalDelivered).toBeGreaterThan(0);

      // Verify rate limit status structure
      expect(Array.isArray(rateLimitStatus)).toBe(true);

      // Verify config structure
      expect(config).toHaveProperty('enableRateLimiting');
      expect(config).toHaveProperty('rateLimitPerMinute');
      expect(config).toHaveProperty('errorRate');
    });

    it('should provide messages data for dashboard display', () => {
      const messages = whatsAppService.getSentMessages();
      
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);

      // Check message structure matches dashboard expectations
      const message = messages[0];
      expect(message).toHaveProperty('messageId');
      expect(message).toHaveProperty('to');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
    });

    it('should provide delivery statuses for dashboard display', () => {
      const statuses = whatsAppService.getDeliveryStatuses();
      
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);

      // Check delivery status structure
      const status = statuses[0];
      expect(status).toHaveProperty('messageId');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(['pending', 'sent', 'delivered', 'failed']).toContain(status.status);
    });

    it('should provide rate limit data for dashboard display', async () => {
      // Send messages to create rate limit data
      await whatsAppService.sendMessage('+1234567890', 'Rate limit test 1', 'rate-test-1');
      await whatsAppService.sendMessage('+1234567890', 'Rate limit test 2', 'rate-test-2');

      const rateLimitStatus = whatsAppService.getRateLimitStatus();
      
      expect(Array.isArray(rateLimitStatus)).toBe(true);
      expect(rateLimitStatus.length).toBeGreaterThan(0);

      const phoneStatus = rateLimitStatus.find(s => s.phoneNumber === '+1234567890');
      expect(phoneStatus).toBeDefined();
      expect(phoneStatus).toHaveProperty('phoneNumber');
      expect(phoneStatus).toHaveProperty('recentMessages');
      expect(phoneStatus).toHaveProperty('isLimited');
    });
  });

  describe('Dashboard Button Functionality', () => {
    beforeEach(async () => {
      // Load demo data first, then seed WhatsApp service
      const demoDataService = DemoDataService.getInstance();
      await demoDataService.loadDemoData();
      const demoMessages = demoDataService.getMessages('demo-event-1');
      await whatsAppService.seedDemoData(demoMessages);
    });

    it('should reset service data correctly', () => {
      // Verify we have data before reset
      let stats = whatsAppService.getStats();
      expect(stats.totalSent).toBeGreaterThan(0);

      // Reset the service
      whatsAppService.reset();

      // Verify data is cleared
      stats = whatsAppService.getStats();
      expect(stats.totalSent).toBe(0);
      expect(stats.totalDelivered).toBe(0);
      expect(stats.totalFailed).toBe(0);
      
      const messages = whatsAppService.getSentMessages();
      expect(messages).toHaveLength(0);
      
      const statuses = whatsAppService.getDeliveryStatuses();
      expect(statuses).toHaveLength(0);
    });

    it('should clear rate limits correctly', async () => {
      // Send some messages to create rate limit data
      await whatsAppService.sendMessage('+1234567890', 'Test message 1', 'test-msg-1');
      await whatsAppService.sendMessage('+1234567890', 'Test message 2', 'test-msg-2');

      // Verify rate limits exist
      let rateLimitStatus = whatsAppService.getRateLimitStatus();
      expect(rateLimitStatus.length).toBeGreaterThan(0);

      // Clear rate limits
      whatsAppService.clearRateLimits();

      // Verify rate limits are cleared
      rateLimitStatus = whatsAppService.getRateLimitStatus();
      expect(rateLimitStatus.length).toBe(0);
    });

    it('should update configuration correctly', () => {
      const newConfig = {
        enableRateLimiting: false,
        rateLimitPerMinute: 20,
        errorRate: 0.2
      };

      whatsAppService.updateConfig(newConfig);
      const updatedConfig = whatsAppService.getConfig();

      expect(updatedConfig.enableRateLimiting).toBe(false);
      expect(updatedConfig.rateLimitPerMinute).toBe(20);
      expect(updatedConfig.errorRate).toBe(0.2);
    });
  });

  describe('Real-time Statistics Updates', () => {
    it('should reflect new messages in statistics immediately', async () => {
      // Get initial stats
      const initialStats = whatsAppService.getStats();
      const initialSent = initialStats.totalSent;

      // Send a new message
      await whatsAppService.sendMessage('+1234567890', 'New test message', 'new-test-msg');

      // Get updated stats
      const updatedStats = whatsAppService.getStats();
      expect(updatedStats.totalSent).toBe(initialSent + 1);
    });

    it('should show new messages in messages list immediately', async () => {
      // Get initial messages
      const initialMessages = whatsAppService.getSentMessages();
      const initialCount = initialMessages.length;

      // Send a new message
      const testMessageId = 'real-time-test-msg';
      await whatsAppService.sendMessage('+1234567890', 'Real-time test message', testMessageId);

      // Get updated messages
      const updatedMessages = whatsAppService.getSentMessages();
      expect(updatedMessages.length).toBe(initialCount + 1);
      
      // Find the new message
      const newMessage = updatedMessages.find(msg => msg.messageId === testMessageId);
      expect(newMessage).toBeDefined();
      expect(newMessage!.content).toBe('Real-time test message');
      expect(newMessage!.to).toBe('+1234567890');
    });

    it('should update delivery statuses in real-time', async () => {
      const testMessageId = 'delivery-status-test-msg';
      
      // Send a message
      await whatsAppService.sendMessage('+1234567890', 'Delivery status test', testMessageId);

      // Check delivery status
      const statuses = whatsAppService.getDeliveryStatuses();
      const messageStatus = statuses.find(status => status.messageId === testMessageId);
      
      expect(messageStatus).toBeDefined();
      expect(['sent', 'delivered', 'failed']).toContain(messageStatus!.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle message retrieval for non-existent messages', () => {
      const message = whatsAppService.getMessageById('non-existent-id');
      expect(message).toBeUndefined();
      
      const status = whatsAppService.getDeliveryStatus('non-existent-id');
      expect(status).toBeUndefined();
    });

    it('should handle service errors gracefully', async () => {
      // Test with repository error simulation
      mockMessageRepository.markAsSent.mockRejectedValue(new Error('Database error'));
      
      const result = await whatsAppService.sendMessage('+1234567890', 'Test message', 'error-test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Demo Data Integration', () => {
    beforeEach(async () => {
      // Load demo data first, then seed WhatsApp service
      const demoDataService = DemoDataService.getInstance();
      await demoDataService.loadDemoData();
      const demoMessages = demoDataService.getMessages('demo-event-1');
      await whatsAppService.seedDemoData(demoMessages);
    });

    it('should display demo data correctly on dashboard load', () => {
      const stats = whatsAppService.getStats();
      
      // Based on mock-demo-data.json, we should have 8 messages
      // 6 delivered, 1 failed, 1 sent
      expect(stats.totalSent).toBeGreaterThan(0);
      expect(stats.totalDelivered).toBeGreaterThan(0);
      expect(stats.totalFailed).toBeGreaterThan(0);
    });

    it('should show demo messages with correct phone numbers and content', () => {
      const messages = whatsAppService.getSentMessages();
      expect(messages.length).toBeGreaterThan(0);

      // Check that we have messages with expected phone numbers from demo data
      const phoneNumbers = messages.map(msg => msg.to);
      expect(phoneNumbers).toContain('+1234567890'); // Michael Johnson
      expect(phoneNumbers).toContain('+1234567891'); // Emily Davis
      expect(phoneNumbers).toContain('+1555123456'); // Jennifer Martinez
    });

    it('should reflect demo data delivery statuses correctly', () => {
      const statuses = whatsAppService.getDeliveryStatuses();
      expect(statuses.length).toBeGreaterThan(0);

      // Check for different status types from demo data
      const statusTypes = statuses.map(status => status.status);
      expect(statusTypes).toContain('delivered');
      expect(statusTypes).toContain('failed');
    });
  });
});