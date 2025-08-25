"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.cacheService = exports.getRedisClient = exports.setupRedis = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient;
const setupRedis = async () => {
    // Skip Redis setup in test environment or when Redis is not available
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_REDIS_SETUP === 'true') {
        logger_1.logger.info('Redis setup skipped (test mode or SKIP_REDIS_SETUP=true)');
        return;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = (0, redis_1.createClient)({
        url: redisUrl,
        socket: {
            connectTimeout: 5000
        }
    });
    redisClient.on('error', (err) => {
        logger_1.logger.error('Redis Client Error:', err);
    });
    redisClient.on('connect', () => {
        logger_1.logger.info('Redis client connected');
    });
    redisClient.on('ready', () => {
        logger_1.logger.info('Redis client ready');
    });
    redisClient.on('end', () => {
        logger_1.logger.info('Redis client disconnected');
    });
    try {
        await redisClient.connect();
        // Test the connection
        await redisClient.ping();
        logger_1.logger.info('Redis connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('Redis connection failed:', error);
        // In demo mode, don't throw the error, just log it
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.warn('Continuing without Redis connection for demo purposes');
            return;
        }
        throw error;
    }
};
exports.setupRedis = setupRedis;
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis not initialized. Call setupRedis() first.');
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
// Cache utility functions
exports.cacheService = {
    async set(key, value, ttlSeconds = 3600) {
        try {
            const serializedValue = JSON.stringify(value);
            await redisClient.setEx(key, ttlSeconds, serializedValue);
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
            throw error;
        }
    },
    async get(key) {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    },
    async del(key) {
        try {
            await redisClient.del(key);
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', error);
            throw error;
        }
    },
    async exists(key) {
        try {
            const result = await redisClient.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Cache exists error:', error);
            return false;
        }
    },
    async setSession(sessionId, sessionData, ttlSeconds = 86400) {
        const key = `session:${sessionId}`;
        await this.set(key, sessionData, ttlSeconds);
    },
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.get(key);
    },
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.del(key);
    }
};
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger_1.logger.info('Redis connection closed');
    }
};
exports.closeRedis = closeRedis;
//# sourceMappingURL=redis.js.map