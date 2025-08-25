"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes will be imported after database setup
const WhatsAppMockService_1 = require("./services/WhatsAppMockService");
const MessageRepository_1 = require("./repositories/MessageRepository");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
exports.io = io;
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
        const result = await global.whatsAppMockService?.sendMessage(to, content, messageId);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Initialize WebSocket service
const WebSocketService_1 = require("./services/WebSocketService");
const webSocketService = new WebSocketService_1.WebSocketService(io);
// Make WebSocket service available globally
global.webSocketService = webSocketService;
// Cleanup inactive sessions every 15 minutes
setInterval(() => {
    webSocketService.cleanupInactiveSessions(30);
}, 15 * 60 * 1000);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Initialize services and start server
async function startServer() {
    try {
        // Initialize database connection (will be skipped in demo mode)
        await (0, database_1.setupDatabase)();
        logger_1.logger.info('Database setup completed');
        // Initialize Redis connection (will be skipped in demo mode)
        await (0, redis_1.setupRedis)();
        logger_1.logger.info('Redis setup completed');
        // Load demo data in demo mode
        if (process.env.SKIP_DB_SETUP === 'true') {
            const { DemoDataService } = await Promise.resolve().then(() => __importStar(require('./services/DemoDataService')));
            const demoDataService = DemoDataService.getInstance();
            await demoDataService.loadDemoData();
            logger_1.logger.info('Demo data loaded successfully');
        }
        // Initialize WhatsApp Mock Service
        const messageRepository = new MessageRepository_1.MessageRepository();
        const whatsAppMockService = new WhatsAppMockService_1.WhatsAppMockService(messageRepository, {
            enableRateLimiting: true,
            rateLimitPerMinute: 10,
            simulateDeliveryDelay: true,
            deliveryDelayMs: 2000,
            errorRate: 0.1,
            enableLogging: true
        });
        // Seed WhatsApp service with demo data in demo mode
        if (process.env.SKIP_DB_SETUP === 'true') {
            const { DemoDataService } = await Promise.resolve().then(() => __importStar(require('./services/DemoDataService')));
            const demoDataService = DemoDataService.getInstance();
            const demoMessages = demoDataService.getMessages('demo-event-1');
            await whatsAppMockService.seedDemoData(demoMessages);
            logger_1.logger.info('WhatsApp mock service seeded with demo messages');
        }
        // Import and set up routes after services are initialized
        const guestRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/guests')))).default;
        const { default: whatsappAdminRoutes, setWhatsAppMockService } = await Promise.resolve().then(() => __importStar(require('./routes/whatsapp-admin')));
        const rsvpRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/rsvp')))).default;
        const messagingRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/messaging')))).default;
        // Set the service for admin routes
        setWhatsAppMockService(whatsAppMockService);
        // Make WhatsApp service available globally for demo endpoint
        global.whatsAppMockService = whatsAppMockService;
        logger_1.logger.info('WhatsApp Mock Service initialized');
        // Set up API routes
        app.use('/api/guests', guestRoutes);
        app.use('/api/whatsapp-admin', whatsappAdminRoutes);
        app.use('/api/rsvp', rsvpRoutes);
        app.use('/api/messaging', messagingRoutes);
        // Import and set up reminder routes
        const reminderRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/reminders')))).default;
        app.use('/api/reminders', reminderRoutes);
        // Import and set up venue layout routes
        const venueLayoutRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/venue-layout')))).default;
        app.use('/api/venue-layout', venueLayoutRoutes);
        // Import and set up table routes
        const tableRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/tables')))).default;
        app.use('/api/tables', tableRoutes);
        // Import and set up export routes
        const exportRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/exports')))).default;
        app.use('/api/exports', exportRoutes);
        // Import and set up analytics routes
        const analyticsRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/analytics')))).default;
        app.use('/api/analytics', analyticsRoutes);
        // Import and set up sync routes
        const syncRoutes = (await Promise.resolve().then(() => __importStar(require('./routes/sync')))).default;
        app.use('/api/sync', syncRoutes);
        // Start reminder scheduler
        const { startReminderScheduler } = await Promise.resolve().then(() => __importStar(require('./services/ReminderScheduler')));
        startReminderScheduler();
        logger_1.logger.info('Reminder scheduler started');
        logger_1.logger.info('API routes configured');
        // Start server
        server.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`API endpoint: http://localhost:${PORT}/api`);
            logger_1.logger.info(`WhatsApp Admin Dashboard: http://localhost:${PORT}/api/whatsapp-admin/dashboard`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    // Stop reminder scheduler
    Promise.resolve().then(() => __importStar(require('./services/ReminderScheduler'))).then(({ stopReminderScheduler }) => {
        stopReminderScheduler();
        logger_1.logger.info('Reminder scheduler stopped');
    });
    server.close(() => {
        logger_1.logger.info('Process terminated');
    });
});
startServer();
//# sourceMappingURL=server.js.map