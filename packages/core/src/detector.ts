import { SecurityCache } from './cache';
import { createHash } from 'crypto';

export interface ThreatDetectionResult {
  threatProbability: number;
  confidence: number;
  detectedPatterns: string[];
  processingTime: number;
  cached: boolean;
}

export class ThreatDetector {
  private cache: SecurityCache;
  
  constructor(cache: SecurityCache) {
    this.cache = cache;
  }
  
  async analyze(prompt: string, agentId: string): Promise<ThreatDetectionResult> {
    const startTime = Date.now();
    
    // Generate cache key
    const promptHash = this.hashPrompt(prompt);
    const cacheKey = this.cache.generateKey(agentId, promptHash);
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        processingTime: Date.now() - startTime
      };
    }
    
    // Run detection if not cached
    const result = await this.detectThreats(prompt);
    const finalResult = {
      ...result,
      cached: false,
      processingTime: Date.now() - startTime
    };
    
    // Cache result
    await this.cache.set(cacheKey, finalResult, 3600); // 1 hour TTL
    
    return finalResult;
  }
  
  private async detectThreats(prompt: string): Promise<Omit<ThreatDetectionResult, 'cached' | 'processingTime'>> {
    const maliciousPatterns = [
      'ignore previous instructions',
      'system prompt override',
      'reveal your instructions',
      'forget everything above',
      'disregard all previous',
      'pretend you are',
      'act as if',
      'you are now',
      'from now on you',
      'ignore the above'
    ];
    
    let threatProbability = 0;
    const detectedPatterns: string[] = [];
    const lowerPrompt = prompt.toLowerCase();
    
    // Pattern matching
    for (const pattern of maliciousPatterns) {
      if (lowerPrompt.includes(pattern)) {
        detectedPatterns.push(pattern);
        threatProbability += 0.4;
      }
    }
    
    // Additional heuristics
    if (lowerPrompt.includes('ignore')) threatProbability += 0.2;
    if (lowerPrompt.includes('override')) threatProbability += 0.2;
    if (lowerPrompt.includes('[system]')) threatProbability += 0.3;
    if (lowerPrompt.includes('[admin]')) threatProbability += 0.3;
    if (lowerPrompt.includes('roleplay')) threatProbability += 0.1;
    
    // Length-based analysis
    if (prompt.length > 1000) {
      threatProbability += 0.1; // Long prompts might be attempts to confuse
    }
    
    // Repetition detection
    const words = prompt.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
      threatProbability += 0.2; // High repetition might indicate prompt injection
    }
    
    // Confidence calculation
    let confidence = 0.6; // Base confidence
    if (detectedPatterns.length > 0) confidence += 0.3;
    if (threatProbability > 0.5) confidence += 0.1;
    
    return {
      threatProbability: Math.min(threatProbability, 1.0),
      confidence: Math.min(confidence, 1.0),
      detectedPatterns
    };
  }
  
  private hashPrompt(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  }
  
  async isHealthy(): Promise<boolean> {
    return await this.cache.isHealthy();
  }
}

