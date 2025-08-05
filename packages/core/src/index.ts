import { createServer } from 'http';
import { AgentRequest, SecurityResponse } from './types';
import { config, validateConfig } from './config';
import { logger } from './logger';

// Basic security analysis function
export async function analyzeRequest(request: AgentRequest): Promise<SecurityResponse> {
  const startTime = Date.now();
  logger.info('Analyzing security request', { agentId: request.agentId });

  try {
    // Simple prompt validation for Phase 1
    const riskScore = await detectThreats(request.prompt);
    const processingTime = Date.now() - startTime;

    let action: SecurityResponse['action'] = 'allow';
    let reason = 'Request appears safe';

    if (riskScore > 0.8) {
      action = 'block';
      reason = 'High risk content detected';
    } else if (riskScore > 0.5) {
      action = 'warn';
      reason = 'Moderate risk content detected';
    }

    const response: SecurityResponse = {
      action,
      reason,
      riskScore,
      processingTime,
      evidence: {
        promptLength: request.prompt.length,
        suspiciousPatterns: await findSuspiciousPatterns(request.prompt)
      }
    };

    logger.info('Security analysis complete', { 
      action, 
      riskScore, 
      processingTime 
    });

    return response;
  } catch (error) {
    logger.error('Security analysis failed', error);
    return {
      action: 'block',
      reason: 'Analysis failed - blocking for safety',
      riskScore: 1.0,
      processingTime: Date.now() - startTime
    };
  }
}

// Simple threat detection for Phase 1
async function detectThreats(prompt: string): Promise<number> {
  const maliciousPatterns = [
    'ignore previous instructions',
    'system prompt override',
    'reveal your instructions',
    'forget everything above'
  ];

  let riskScore = 0;
  const lowerPrompt = prompt.toLowerCase();

  for (const pattern of maliciousPatterns) {
    if (lowerPrompt.includes(pattern)) {
      riskScore += 0.4; // Increased from 0.3 to trigger block action
    }
  }

  // Additional heuristics
  if (lowerPrompt.includes('ignore')) riskScore += 0.2; // Increased from 0.1
  if (lowerPrompt.includes('override')) riskScore += 0.2; // Increased from 0.1
  if (lowerPrompt.includes('[SYSTEM]')) riskScore += 0.3; // Increased from 0.2

  return Math.min(riskScore, 1.0);
}

// Find suspicious patterns in prompt
async function findSuspiciousPatterns(prompt: string): Promise<string[]> {
  const patterns = [
    'ignore previous',
    'system prompt',
    'reveal instructions',
    'forget everything',
    '[SYSTEM]',
    '[ADMIN]'
  ];

  const found = patterns.filter(pattern => 
    prompt.toLowerCase().includes(pattern.toLowerCase())
  );

  return found;
}

// Health check endpoint
export function createHealthCheckServer(): void {
  const server = createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SeiAgentGuard Core',
        version: '1.0.0'
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(config.port, () => {
    logger.info(`Core service health check server running on port ${config.port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Shutting down core service...');
    server.close(() => {
      logger.info('Core service shutdown complete');
      process.exit(0);
    });
  });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateConfig();
    createHealthCheckServer();
    logger.info('SeiAgentGuard Core service started successfully');
  } catch (error) {
    logger.error('Failed to start core service', error);
    process.exit(1);
  }
} 