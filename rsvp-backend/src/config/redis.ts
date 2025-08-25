import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const setupRedis = async (): Promise<void> => {
  // Skip Redis setup in test environment or when Redis is not available
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_REDIS_SETUP === 'true') {
    logger.info('Redis setup skipped (test mode or SKIP_REDIS_SETUP=true)');
    return;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000
    }
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('end', () => {
    logger.info('Redis client disconnected');
  });

  try {
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // In demo mode, don't throw the error, just log it
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing without Redis connection for demo purposes');
      return;
    }
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call setupRedis() first.');
  }
  return redisClient;
};

// Cache utility functions
export const cacheService = {
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, ttlSeconds, serializedValue);
    } catch (error) {
      logger.error('Cache set error:', error);
      throw error;
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
      throw error;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  async setSession(sessionId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, sessionData, ttlSeconds);
  },

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.get<T>(key);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};