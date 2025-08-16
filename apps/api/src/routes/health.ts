import { Router } from 'express';

const router = Router();

// GET /health - Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SeiAgentGuard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /health/detailed - Detailed health check
router.get('/detailed', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SeiAgentGuard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform
  };

  res.json(health);
});

export { router as healthRoutes }; 