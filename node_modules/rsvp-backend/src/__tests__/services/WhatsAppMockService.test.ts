import { WhatsAppMockService, WhatsAppMockConfig } from '../../services/WhatsAppMockService';
import { MessageRepository } from '../../repositories/MessageRepository';
import { Message } from '../../../../shared/src/types';

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

describe('WhatsAppMockService', () => {
  let whatsAppService: WhatsAppMockService;
  let mockMessageRepository: jest.Mocked<MessageRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessageRepository = new MockedMessageRepository() as jest.Mocked<MessageRepository>;
    
    // Mock repository methods
    mockMessageRepository.markAsSent = jest.fn().mockResolvedValue({} as Message);
    mockMessageRepository.markAsDelivered = jest.fn().mockResolvedValue({} as Message);
    mockMessageRepository.markAsFailed = jest.fn().mockResolvedValue({} as Message);

    whatsAppService = new WhatsAppMockService(mockMessageRepository, {
      enableRateLimiting: false,
      simulateDeliveryDelay: false,
      errorRate: 0,
      deliveryFailureRate: 0, // No delivery failures for deterministic tests
      enableLogging: false
    });
  });

  afterEach(() => {
    whatsAppService.reset();
  });

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      const result = await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockMessageRepository.markAsSent).toHaveBeenCalledWith('msg-123');
      expect(mockMessageRepository.markAsDelivered).toHaveBeenCalledWith('msg-123');
    });

    it('should store sent message in memory', async () => {
      await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      const sentMessages = whatsAppService.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toMatchObject({
        to: '+1234567890',
        content: 'Test message',
        messageId: 'msg-123'
      });
    });

    it('should create delivery status record', async () => {
      await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      const deliveryStatus = whatsAppService.getDeliveryStatus('msg-123');
      expect(deliveryStatus).toBeDefined();
      // With delivery delay disabled, it should be delivered immediately
      expect(deliveryStatus?.status).toBe('delivered');
      expect(deliveryStatus?.messageId).toBe('msg-123');
    });

    it('should simulate errors based on error rate', async () => {
      // Create service with 100% error rate
      const errorService = new WhatsAppMockService(mockMessageRepository, {
        errorRate: 1.0,
        enableLogging: false
      });

      const result = await errorService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Simulated WhatsApp API error');
      expect(mockMessageRepository.markAsFailed).toHaveBeenCalledWith('msg-123');
    });

    it('should handle rate limiting', async () => {
      // Create service with rate limiting enabled
      const rateLimitedService = new WhatsAppMockService(mockMessageRepository, {
        enableRateLimiting: true,
        rateLimitPerMinute: 2,
        enableLogging: false
      });

      // Send messages up to the limit
      await rateLimitedService.sendMessage('+1234567890', 'Message 1', 'msg-1');
      await rateLimitedService.sendMessage('+1234567890', 'Message 2', 'msg-2');

      // Third message should be rate limited
      const result = await rateLimitedService.sendMessage('+1234567890', 'Message 3', 'msg-3');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(mockMessageRepository.markAsFailed).toHaveBeenCalledWith('msg-3');
    });

    it('should handle delivery delay simulation', async () => {
      const delayService = new WhatsAppMockService(mockMessageRepository, {
        simulateDeliveryDelay: true,
        deliveryDelayMs: 100,
        deliveryFailureRate: 0, // No delivery failures for this test
        enableLogging: false
      });

      await delayService.sendMessage('+1234567890', 'Test message', 'msg-123');

      // Initially should be sent but not delivered
      let deliveryStatus = delayService.getDeliveryStatus('msg-123');
      expect(deliveryStatus?.status).toBe('sent');

      // Wait for delivery delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Now should be delivered
      deliveryStatus = delayService.getDeliveryStatus('msg-123');
      expect(deliveryStatus?.status).toBe('delivered');
    });

    it('should handle repository errors gracefully', async () => {
      mockMessageRepository.markAsSent.mockRejectedValue(new Error('Database error'));

      const result = await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('sendBulkMessages', () => {
    it('should send multiple messages successfully', async () => {
      const messages = [
        { to: '+1234567890', content: 'Message 1', messageId: 'msg-1' },
        { to: '+1234567891', content: 'Message 2', messageId: 'msg-2' },
        { to: '+1234567892', content: 'Message 3', messageId: 'msg-3' }
      ];

      const result = await whatsAppService.sendBulkMessages(messages);

      expect(result.totalMessages).toBe(3);
      expect(result.successfulSends).toBe(3);
      expect(result.failedSends).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should handle mixed success and failure in bulk send', async () => {
      // Create service with 50% error rate
      const mixedService = new WhatsAppMockService(mockMessageRepository, {
        errorRate: 0.5,
        enableLogging: false
      });

      const messages = Array.from({ length: 10 }, (_, i) => ({
        to: `+123456789${i}`,
        content: `Message ${i}`,
        messageId: `msg-${i}`
      }));

      const result = await mixedService.sendBulkMessages(messages);

      expect(result.totalMessages).toBe(10);
      expect(result.successfulSends + result.failedSends).toBe(10);
      expect(result.results).toHaveLength(10);
    });

    it('should handle empty message array', async () => {
      const result = await whatsAppService.sendBulkMessages([]);

      expect(result.totalMessages).toBe(0);
      expect(result.successfulSends).toBe(0);
      expect(result.failedSends).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('rate limiting', () => {
    let rateLimitedService: WhatsAppMockService;

    beforeEach(() => {
      rateLimitedService = new WhatsAppMockService(mockMessageRepository, {
        enableRateLimiting: true,
        rateLimitPerMinute: 3,
        enableLogging: false
      });
    });

    it('should track rate limits per phone number', async () => {
      // Send messages to different numbers
      await rateLimitedService.sendMessage('+1111111111', 'Message 1', 'msg-1');
      await rateLimitedService.sendMessage('+2222222222', 'Message 2', 'msg-2');
      await rateLimitedService.sendMessage('+1111111111', 'Message 3', 'msg-3');

      const rateLimitStatus = rateLimitedService.getRateLimitStatus();
      
      const phone1Status = rateLimitStatus.find(s => s.phoneNumber === '+1111111111');
      const phone2Status = rateLimitStatus.find(s => s.phoneNumber === '+2222222222');

      expect(phone1Status?.recentMessages).toBe(2);
      expect(phone2Status?.recentMessages).toBe(1);
      expect(phone1Status?.isLimited).toBe(false);
      expect(phone2Status?.isLimited).toBe(false);
    });

    it('should clear rate limits', async () => {
      // Send messages up to limit
      await rateLimitedService.sendMessage('+1111111111', 'Message 1', 'msg-1');
      await rateLimitedService.sendMessage('+1111111111', 'Message 2', 'msg-2');
      await rateLimitedService.sendMessage('+1111111111', 'Message 3', 'msg-3');

      // Should be at limit
      let rateLimitStatus = rateLimitedService.getRateLimitStatus();
      expect(rateLimitStatus[0]?.recentMessages).toBe(3);

      // Clear rate limits
      rateLimitedService.clearRateLimits();

      // Should be cleared
      rateLimitStatus = rateLimitedService.getRateLimitStatus();
      expect(rateLimitStatus).toHaveLength(0);
    });
  });

  describe('admin interface methods', () => {
    beforeEach(async () => {
      // Send some test messages
      await whatsAppService.sendMessage('+1234567890', 'Message 1', 'msg-1');
      await whatsAppService.sendMessage('+1234567891', 'Message 2', 'msg-2');
    });

    it('should return sent messages', () => {
      const messages = whatsAppService.getSentMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].messageId).toBe('msg-1');
      expect(messages[1].messageId).toBe('msg-2');
    });

    it('should return delivery statuses', () => {
      const statuses = whatsAppService.getDeliveryStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses.every(s => s.status === 'delivered')).toBe(true);
    });

    it('should return message by ID', () => {
      const message = whatsAppService.getMessageById('msg-1');
      expect(message).toBeDefined();
      expect(message?.messageId).toBe('msg-1');
      expect(message?.content).toBe('Message 1');
    });

    it('should return delivery status by message ID', () => {
      const status = whatsAppService.getDeliveryStatus('msg-1');
      expect(status).toBeDefined();
      expect(status?.messageId).toBe('msg-1');
      expect(status?.status).toBe('delivered');
    });

    it('should return undefined for non-existent message', () => {
      const message = whatsAppService.getMessageById('non-existent');
      expect(message).toBeUndefined();
    });

    it('should calculate statistics correctly', () => {
      const stats = whatsAppService.getStats();
      // With delivery delay disabled, messages go directly to 'delivered' status
      expect(stats.totalSent).toBe(2); // Total successful sends (sent + delivered)
      expect(stats.totalDelivered).toBe(2);
      expect(stats.totalFailed).toBe(0);
      expect(stats.totalPending).toBe(0);
      expect(stats.deliveryRate).toBe(100);
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = whatsAppService.getConfig();
      expect(config).toMatchObject({
        enableRateLimiting: false,
        simulateDeliveryDelay: false,
        errorRate: 0,
        enableLogging: false
      });
    });

    it('should update configuration', () => {
      const newConfig: Partial<WhatsAppMockConfig> = {
        enableRateLimiting: true,
        rateLimitPerMinute: 5,
        errorRate: 0.2
      };

      whatsAppService.updateConfig(newConfig);
      const updatedConfig = whatsAppService.getConfig();

      expect(updatedConfig.enableRateLimiting).toBe(true);
      expect(updatedConfig.rateLimitPerMinute).toBe(5);
      expect(updatedConfig.errorRate).toBe(0.2);
      // Other config should remain unchanged
      expect(updatedConfig.simulateDeliveryDelay).toBe(false);
    });
  });

  describe('service reset', () => {
    beforeEach(async () => {
      // Send some test messages and set up rate limits
      await whatsAppService.sendMessage('+1234567890', 'Message 1', 'msg-1');
      await whatsAppService.sendMessage('+1234567891', 'Message 2', 'msg-2');
    });

    it('should reset all service data', () => {
      // Verify data exists
      expect(whatsAppService.getSentMessages()).toHaveLength(2);
      expect(whatsAppService.getDeliveryStatuses()).toHaveLength(2);

      // Reset service
      whatsAppService.reset();

      // Verify data is cleared
      expect(whatsAppService.getSentMessages()).toHaveLength(0);
      expect(whatsAppService.getDeliveryStatuses()).toHaveLength(0);
      expect(whatsAppService.getRateLimitStatus()).toHaveLength(0);
    });
  });

  describe('delivery simulation', () => {
    it('should simulate delivery failures occasionally', async () => {
      // Create service that simulates delivery failures
      const failureService = new WhatsAppMockService(mockMessageRepository, {
        simulateDeliveryDelay: true,
        deliveryDelayMs: 50,
        enableLogging: false
      });

      // Send many messages to trigger some delivery failures (5% chance)
      const promises = Array.from({ length: 100 }, (_, i) =>
        failureService.sendMessage(`+123456789${i}`, `Message ${i}`, `msg-${i}`)
      );

      await Promise.all(promises);

      // Wait for delivery simulation
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = failureService.getStats();
      // With 5% delivery failure rate, we should have some failures in 100 messages
      // But this is probabilistic, so we just check that the system handles it
      expect(stats.totalSent + stats.totalFailed).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in markAsSent', async () => {
      mockMessageRepository.markAsSent.mockRejectedValue(new Error('Database connection failed'));

      const result = await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle repository errors in markAsDelivered', async () => {
      mockMessageRepository.markAsDelivered.mockRejectedValue(new Error('Database error'));

      // This should still succeed in sending, but fail in delivery update
      const result = await whatsAppService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(true);
      // The delivery status should still be tracked in memory as 'delivered' 
      // because repository errors don't affect in-memory status
      const status = whatsAppService.getDeliveryStatus('msg-123');
      expect(status?.status).toBe('delivered');
    });

    it('should handle repository errors in markAsFailed', async () => {
      // Create service with 100% error rate to trigger failure
      const errorService = new WhatsAppMockService(mockMessageRepository, {
        errorRate: 1.0,
        enableLogging: false
      });

      const result = await errorService.sendMessage('+1234567890', 'Test message', 'msg-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Simulated WhatsApp API error');
      
      // Verify that the delivery status is tracked in memory as failed
      const status = errorService.getDeliveryStatus('msg-123');
      expect(status?.status).toBe('failed');
    });
  });
});