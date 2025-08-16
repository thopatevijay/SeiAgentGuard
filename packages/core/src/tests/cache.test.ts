import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecurityCache } from '../cache';

describe('Redis Security Cache', () => {
  let cache: SecurityCache;
  
  beforeEach(() => {
    cache = new SecurityCache('redis://localhost:6379');
  });
  
  afterEach(async () => {
    await cache.flush(); // Clear test data
  });
  
  it('should cache and retrieve threat analysis results', async () => {
    const key = 'test:threat:123';
    const data = { threatProbability: 0.8, confidence: 0.9, detectedPatterns: ['test'] };
    
    await cache.set(key, data, 60);
    const retrieved = await cache.get(key);
    
    expect(retrieved).toEqual(data);
  });
  
  it('should handle cache misses gracefully', async () => {
    const result = await cache.get('nonexistent:key');
    expect(result).toBeNull();
  });
  
  it('should respect TTL settings', async () => {
    const key = 'test:ttl';
    const data = { test: 'data' };
    
    await cache.set(key, data, 1); // 1 second TTL
    
    // Should exist immediately
    expect(await cache.exists(key)).toBe(true);
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should not exist after TTL
    expect(await cache.exists(key)).toBe(false);
  });
  
  it('should generate proper cache keys', () => {
    const agentId = 'test-agent';
    const promptHash = 'abc123';
    const key = cache.generateKey(agentId, promptHash);
    
    expect(key).toBe('security:test-agent:abc123');
  });
  
  it('should check if keys exist', async () => {
    const key = 'test:exists';
    
    expect(await cache.exists(key)).toBe(false);
    
    await cache.set(key, 'test');
    expect(await cache.exists(key)).toBe(true);
  });
  
  it('should delete keys', async () => {
    const key = 'test:delete';
    
    await cache.set(key, 'test');
    expect(await cache.exists(key)).toBe(true);
    
    await cache.del(key);
    expect(await cache.exists(key)).toBe(false);
  });
  
  it('should be healthy when Redis is connected', async () => {
    const health = await cache.isHealthy();
    expect(health).toBe(true);
  });
}, { timeout: 10000 });

