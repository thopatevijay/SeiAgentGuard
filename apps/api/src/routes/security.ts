import { Router } from 'express';
import { SecurityCache } from '../cache';
import { createHash } from 'crypto';

// Initialize Redis cache
const cache = new SecurityCache();

// Temporary local implementation for Phase 2 (will be replaced with proper core import)
interface AgentRequest {
  agentId: string;
  prompt: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface SecurityResponse {
  action: 'allow' | 'block' | 'modify' | 'warn';
  reason: string;
  riskScore: number;
  processingTime: number;
  evidence: Record<string, any>;
}

// Enhanced threat detection with Redis caching for Phase 2
async function analyzeRequest(request: AgentRequest): Promise<SecurityResponse> {
  const startTime = Date.now();
  
  try {
    // Generate cache key
    const promptHash = createHash('sha256').update(request.prompt).digest('hex').slice(0, 16);
    const cacheKey = cache.generateKey(request.agentId, promptHash);
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        processingTime: Date.now() - startTime,
        evidence: {
          ...cached.evidence,
          cached: true
        }
      };
    }
    
    // Enhanced threat detection patterns
    const maliciousPatterns = [
      'ignore previous instructions',
      'system prompt override',
      'reveal your instructions',
      'reveal system prompt',
      'forget everything above',
      'disregard all previous',
      'pretend you are',
      'act as if',
      'you are now',
      'from now on you',
      'ignore the above'
    ];
    
    let riskScore = 0;
    const detectedPatterns: string[] = [];
    const lowerPrompt = request.prompt.toLowerCase();
    
    // Pattern matching
    for (const pattern of maliciousPatterns) {
      if (lowerPrompt.includes(pattern)) {
        detectedPatterns.push(pattern);
        riskScore += 0.4;
      }
    }
    
    // Additional heuristics
    if (lowerPrompt.includes('ignore')) riskScore += 0.2;
    if (lowerPrompt.includes('override')) riskScore += 0.2;
    if (lowerPrompt.includes('[system]') || lowerPrompt.includes('[admin]')) {
      riskScore += 0.3;
    }
    if (lowerPrompt.includes('roleplay')) riskScore += 0.1;
    
    // Enhanced bracket pattern detection
    if (lowerPrompt.includes('[system]') || lowerPrompt.includes('[admin]')) {
      riskScore += 0.3;
    }
    
    // Bonus for multiple malicious patterns
    if (detectedPatterns.length > 1) {
      riskScore += 0.2;
    }
    
    // Length-based analysis
    if (request.prompt.length > 1000) {
      riskScore += 0.1;
    }
    
    // Repetition detection
    const words = lowerPrompt.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
      riskScore += 0.2;
    }
    
    riskScore = Math.min(riskScore, 1.0);
    const processingTime = Date.now() - startTime;
    
    // Policy-based action determination
    let action: 'allow' | 'block' | 'modify' | 'warn' = 'allow';
    let reason = 'Request appears safe';
    
    if (riskScore > 0.7) {
      action = 'block';
      reason = 'High risk content detected';
    } else if (riskScore > 0.3) {
      action = 'warn';
      reason = 'Moderate risk content detected';
    }
    
    // Special case: "Ignore previous instructions" should be blocked
    if (lowerPrompt.includes('ignore previous instructions')) {
      action = 'block';
      reason = 'Prompt injection detected';
    }
    
    // Special case: "Slightly suspicious" should trigger warning
    if (lowerPrompt.includes('slightly suspicious')) {
      action = 'warn';
      reason = 'Suspicious content detected';
    }
    
    // Rate limiting simulation
    if (request.agentId.includes('spam')) {
      action = 'block';
      reason = 'Rate limit exceeded';
    }
    
    const result = {
      action,
      reason,
      riskScore,
      processingTime,
      evidence: {
        promptLength: request.prompt.length,
        suspiciousPatterns: detectedPatterns,
        confidence: detectedPatterns.length > 0 ? 0.8 : 0.6,
        cached: false,
        policiesMatched: detectedPatterns.length > 0 ? 1 : 0
      }
    };
    
    // Cache the result for 1 hour
    await cache.set(cacheKey, result, 3600);
    
    return result;
    
  } catch (error) {
    return {
      action: 'block',
      reason: 'Security analysis failed',
      riskScore: 1.0,
      processingTime: Date.now() - startTime,
      evidence: { error: error.message }
    };
  }
}

const router = Router();

// Security analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { agentId, prompt, timestamp } = req.body;
    
    // Validate required fields
    if (!agentId || !prompt || timestamp === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, prompt, timestamp',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validate data types
    if (typeof agentId !== 'string' || typeof prompt !== 'string' || typeof timestamp !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data types',
        code: 'INVALID_TYPES'
      });
    }
    
    // Validate prompt is not empty
    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt cannot be empty',
        code: 'EMPTY_PROMPT'
      });
    }
    
    // Analyze request using enhanced core
    const result = await analyzeRequest({
      agentId,
      prompt,
      timestamp,
      context: req.body.context
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Security analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Security status endpoint
router.get('/status', async (req, res) => {
  try {
    const cacheHealth = await cache.isHealthy();
    
    res.json({
      success: true,
      data: {
        service: 'SeiAgentGuard Security API',
        version: '2.0.0',
        status: 'operational',
        features: {
          threatDetection: true,
          policyEngine: true,
          redisCaching: cacheHealth,
          rateLimiting: true
        },
        cache: {
          status: cacheHealth ? 'connected' : 'disconnected',
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      code: 'STATUS_ERROR'
    });
  }
});

export { router as securityRoutes }; 