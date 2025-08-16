import { AgentRequest, SecurityResponse } from './types';
import { config, validateConfig } from './config';
import { logger } from './logger';
import { SecurityCache } from './cache';
import { ThreatDetector } from './detector';
import { PolicyEngine } from './policy/PolicyEngine';
import { PolicyContext } from './policy/types';
import { createHash } from 'crypto';

// Initialize Phase 2 components
const cache = new SecurityCache();
const threatDetector = new ThreatDetector(cache);
const policyEngine = new PolicyEngine(cache);

// Track request counts for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function analyzeRequest(request: AgentRequest): Promise<SecurityResponse> {
  const startTime = Date.now();
  
  try {
    logger.info('Analyzing security request', { agentId: request.agentId });
    
    // Validate request
    if (!request.prompt || request.prompt.trim().length === 0) {
      return {
        action: 'block',
        reason: 'Empty prompt not allowed',
        riskScore: 1.0,
        processingTime: Date.now() - startTime,
        evidence: { promptLength: 0, suspiciousPatterns: [] }
      };
    }
    
    // Get request count for rate limiting
    const requestCount = getRequestCount(request.agentId);
    
    // Enhanced threat detection with caching
    const threatResult = await threatDetector.analyze(request.prompt, request.agentId);
    
    // Create policy context
    const policyContext: PolicyContext = {
      agentId: request.agentId,
      prompt: request.prompt,
      riskScore: threatResult.threatProbability,
      detectedPatterns: threatResult.detectedPatterns,
      requestCount,
      timestamp: request.timestamp
    };
    
    // Evaluate policies
    const policyResults = await policyEngine.evaluatePolicies(policyContext);
    
    // Determine action based on policy results and threat detection
    let action: 'allow' | 'block' | 'modify' | 'warn' = 'allow';
    let reason = 'Request appears safe';
    
    if (policyResults.length > 0) {
      const topPolicy = policyResults[0];
      action = topPolicy.recommendedAction.type;
      reason = topPolicy.recommendedAction.message || `Policy ${topPolicy.policy.name} triggered`;
    } else if (threatResult.threatProbability > 0.7) {
      action = 'block';
      reason = 'High risk content detected';
    } else if (threatResult.threatProbability > 0.3) {
      action = 'warn';
      reason = 'Moderate risk content detected';
    }
    
    // Rate limiting check
    if (requestCount > 100) {
      action = 'block';
      reason = 'Rate limit exceeded';
    }
    
    const processingTime = Date.now() - startTime;
    
    logger.info('Security analysis complete', {
      action,
      riskScore: threatResult.threatProbability,
      processingTime,
      cached: threatResult.cached
    });
    
    return {
      action,
      reason,
      riskScore: threatResult.threatProbability,
      processingTime,
      evidence: {
        promptLength: request.prompt.length,
        suspiciousPatterns: threatResult.detectedPatterns,
        confidence: threatResult.confidence,
        cached: threatResult.cached,
        policiesMatched: policyResults.length
      }
    };
    
  } catch (error) {
    logger.error('Security analysis failed', { error: error.message });
    
    return {
      action: 'block',
      reason: 'Security analysis failed',
      riskScore: 1.0,
      processingTime: Date.now() - startTime,
      evidence: { error: error.message }
    };
  }
}

function getRequestCount(agentId: string): number {
  const now = Date.now();
  const agentData = requestCounts.get(agentId);
  
  if (!agentData || now > agentData.resetTime) {
    // Reset counter every hour
    requestCounts.set(agentId, { count: 1, resetTime: now + 3600000 });
    return 1;
  }
  
  agentData.count++;
  return agentData.count;
}

// Export components for external use
export { SecurityCache, ThreatDetector, PolicyEngine };
export { cache, threatDetector, policyEngine };

// Simple health check function (no web server)
export async function getHealthStatus() {
  try {
    const cacheHealth = await cache.isHealthy();
    const policyHealth = await policyEngine.isHealthy();
    const threatHealth = await threatDetector.isHealthy();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SeiAgentGuard Core',
      version: '2.0.0',
      environment: config.nodeEnv,
      components: {
        cache: cacheHealth,
        policyEngine: policyHealth,
        threatDetector: threatHealth
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'SeiAgentGuard Core',
      error: error.message
    };
  }
} 