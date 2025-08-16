import Redis from 'ioredis';
import { join } from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

export class SecurityCache {
  private redis: Redis;
  private defaultTTL: number;
  
  constructor(url?: string, ttl: number = 3600) {
    this.redis = new Redis(url || process.env.REDIS_URL || 'redis://localhost:6379');
    this.defaultTTL = ttl;
    
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  
  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }
  
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }
  
  generateKey(agentId: string, promptHash: string): string {
    return `security:${agentId}:${promptHash}`;
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

