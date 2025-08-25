import { RedisClientType } from 'redis';
export declare const setupRedis: () => Promise<void>;
export declare const getRedisClient: () => RedisClientType;
export declare const cacheService: {
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    setSession(sessionId: string, sessionData: any, ttlSeconds?: number): Promise<void>;
    getSession<T>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<void>;
};
export declare const closeRedis: () => Promise<void>;
//# sourceMappingURL=redis.d.ts.map