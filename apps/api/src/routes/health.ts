import { Router } from 'express';
import { SecurityCache } from '../cache';

const router = Router();
const cache = new SecurityCache();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const cacheHealth = await cache.isHealthy();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SeiAgentGuard API',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        api: true,
        cache: cacheHealth
      },
      cache: {
        status: cacheHealth ? 'connected' : 'disconnected',
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
      }
    };
    
    const isHealthy = health.components.api && health.components.cache;
    res.status(isHealthy ? 200 : 503).json(health);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'SeiAgentGuard API',
      error: error.message
    });
  }
});

export { router as healthRoutes }; 