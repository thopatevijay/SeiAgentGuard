import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { join } from 'path';
import { securityRoutes } from './routes/security';
import { healthRoutes } from './routes/health';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

const app = express();
const port = parseInt(process.env.API_PORT || '3001', 10);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : false,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(loggingMiddleware);

// Routes
app.use('/api/v1/security', securityRoutes);
app.use('/health', healthRoutes);
app.use('/api/v1/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      service: 'SeiAgentGuard API',
      version: '1.0.0',
      environment: process.env.NODE_ENV
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 SeiAgentGuard API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔒 Security API: http://localhost:${port}/api/v1/security`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down API server...');
  server.close(() => {
    console.log('✅ API server shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down API server...');
  server.close(() => {
    console.log('✅ API server shutdown complete');
    process.exit(0);
  });
}); 