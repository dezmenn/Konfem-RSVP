import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupDatabase } from './config/database';
import { setupRedis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
// Routes will be imported after database setup
import { WhatsAppMockService } from './services/WhatsAppMockService';
import { MessageRepository } from './repositories/MessageRepository';
// Load environment variables
dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
const PORT = process.env.PORT || 5000;
// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'RSVP Planning App API is running!' });
});
// Demo message testing endpoint
app.post('/api/demo/send-message', async (req, res) => {
  try {
    const { to, content, messageId } = req.body;
    if (!to || !content || !messageId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, content, messageId' 
      });
    }
    // Get the WhatsApp service instance (will be available after initialization)
    const result = await (global as any).whatsAppMockService?.sendMessage(to, content, messageId);
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        error: 'WhatsApp service not initialized' 
      });
    }
    res.json({ 
      success: result.success, 
      message: result.success ? 'Message sent successfully' : 'Failed to send message',
      error: result.error 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
// Initialize WebSocket service
import { WebSocketService } from './services/WebSocketService';
const webSocketService = new WebSocketService(io);
// Make WebSocket service available globally
(global as any).webSocketService = webSocketService;
// Cleanup inactive sessions every 15 minutes
setInterval(() => {
  webSocketService.cleanupInactiveSessions(30);
}, 15 * 60 * 1000);
// Error handling middleware
app.use(errorHandler);
// Initialize services and start server
async function startServer() {
  try {
    // Initialize database connection (will be skipped in demo mode)
    await setupDatabase();
    logger.info('Database setup completed');
    // Initialize Redis connection (will be skipped in demo mode)
    await setupRedis();
    logger.info('Redis setup completed');
    // Load demo data in demo mode
    if (process.env.SKIP_DB_SETUP === 'true') {
      const { DemoDataService } = await import('./services/DemoDataService');
      const demoDataService = DemoDataService.getInstance();
      await demoDataService.loadDemoData();
      logger.info('Demo data loaded successfully');
    }
    // Initialize WhatsApp Mock Service
    const messageRepository = new MessageRepository();
    const whatsAppMockService = new WhatsAppMockService(messageRepository, {
      enableRateLimiting: true,
      rateLimitPerMinute: 10,
      simulateDeliveryDelay: true,
      deliveryDelayMs: 2000,
      errorRate: 0.1,
      enableLogging: true
    });
    // Seed WhatsApp service with demo data in demo mode
    if (process.env.SKIP_DB_SETUP === 'true') {
      const { DemoDataService } = await import('./services/DemoDataService');
      const demoDataService = DemoDataService.getInstance();
      const demoMessages = demoDataService.getMessages('demo-event-1');
      await whatsAppMockService.seedDemoData(demoMessages);
      logger.info('WhatsApp mock service seeded with demo messages');
    }
    // Import and set up routes after services are initialized
    const guestRoutes = (await import('./routes/guests')).default;
    const { default: whatsappAdminRoutes, setWhatsAppMockService } = await import('./routes/whatsapp-admin');
    const rsvpRoutes = (await import('./routes/rsvp')).default;
    const messagingRoutes = (await import('./routes/messaging')).default;
    // Set the service for admin routes
    setWhatsAppMockService(whatsAppMockService);
    // Make WhatsApp service available globally for demo endpoint
    (global as any).whatsAppMockService = whatsAppMockService;
    logger.info('WhatsApp Mock Service initialized');
    // Set up API routes
    app.use('/api/guests', guestRoutes);
    app.use('/api/whatsapp-admin', whatsappAdminRoutes);
    app.use('/api/rsvp', rsvpRoutes);
    app.use('/api/messaging', messagingRoutes);
    // Import and set up reminder routes
    const reminderRoutes = (await import('./routes/reminders')).default;
    app.use('/api/reminders', reminderRoutes);
    // Import and set up invitation routes
    const invitationRoutes = (await import('./routes/invitations')).default;
    app.use('/api/invitations', invitationRoutes);
    // Import and set up venue layout routes
    const venueLayoutRoutes = (await import('./routes/venue-layout')).default;
    app.use('/api/venue-layout', venueLayoutRoutes);
    // Import and set up table routes
    const tableRoutes = (await import('./routes/tables')).default;
    app.use('/api/tables', tableRoutes);
    // Import and set up export routes
    const exportRoutes = (await import('./routes/exports')).default;
    app.use('/api/exports', exportRoutes);
    // Import and set up analytics routes
    const analyticsRoutes = (await import('./routes/analytics')).default;
    app.use('/api/analytics', analyticsRoutes);
    // Import and set up sync routes
    const syncRoutes = (await import('./routes/sync')).default;
    app.use('/api/sync', syncRoutes);
    // Start reminder scheduler
    const { startReminderScheduler } = await import('./services/ReminderScheduler');
    startReminderScheduler();
    logger.info('Reminder scheduler started');
    logger.info('API routes configured');
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoint: http://localhost:${PORT}/api`);
      logger.info(`WhatsApp Admin Dashboard: http://localhost:${PORT}/api/whatsapp-admin/dashboard`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Stop reminder scheduler
  import('./services/ReminderScheduler').then(({ stopReminderScheduler }) => {
    stopReminderScheduler();
    logger.info('Reminder scheduler stopped');
  });
  server.close(() => {
    logger.info('Process terminated');
  });
});
startServer();
export { app, io };
