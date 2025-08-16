import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SecurityPolicy, PolicyCondition, PolicyAction, PolicyEvaluationResult, PolicyContext } from './types';
import { PolicyValidator } from './PolicyValidator';
import { SecurityCache } from '../cache';

export class PolicyEngine {
  private policies: SecurityPolicy[] = [];
  private cache: SecurityCache;
  private policiesPath: string;
  
  constructor(cache: SecurityCache, policiesPath?: string) {
    this.cache = cache;
    this.policiesPath = policiesPath || join(__dirname, 'default-policies.yaml');
    this.loadPolicies();
  }
  
  private loadPolicies(): void {
    try {
      const policiesFile = readFileSync(this.policiesPath, 'utf8');
      const policiesData = yaml.load(policiesFile) as { policies: SecurityPolicy[] };
      
      if (policiesData && Array.isArray(policiesData.policies)) {
        // Validate all policies
        const validation = PolicyValidator.validatePolicies(policiesData.policies);
        if (validation.valid) {
          this.policies = policiesData.policies
            .filter(policy => policy.enabled)
            .sort((a, b) => a.priority - b.priority);
          
          console.log(`Loaded ${this.policies.length} valid policies`);
        } else {
          console.error('Policy validation failed:', validation.errors);
          this.loadDefaultPolicies();
        }
      } else {
        console.warn('Invalid policies file format, loading defaults');
        this.loadDefaultPolicies();
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
      this.loadDefaultPolicies();
    }
  }
  
  private loadDefaultPolicies(): void {
    // Fallback to basic policies if YAML loading fails
    this.policies = [
      {
        name: 'basic_security',
        description: 'Basic security policy',
        enabled: true,
        severity: 'medium',
        priority: 1,
        conditions: [
          {
            type: 'risk_score',
            operator: 'greater_than',
            value: 0.7
          }
        ],
        actions: [
          {
            type: 'block',
            message: 'High risk content detected'
          }
        ]
      }
    ];
  }
  
  async evaluatePolicies(context: PolicyContext): Promise<PolicyEvaluationResult[]> {
    const results: PolicyEvaluationResult[] = [];
    
    for (const policy of this.policies) {
      const result = await this.evaluatePolicy(policy, context);
      if (result.matched) {
        results.push(result);
      }
    }
    
    // Sort by priority (highest first)
    return results.sort((a, b) => b.policy.priority - a.policy.priority);
  }
  
  private async evaluatePolicy(policy: SecurityPolicy, context: PolicyContext): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    let matchedConditions: PolicyCondition[] = [];
    let allConditionsMet = true;
    
    for (const condition of policy.conditions) {
      if (!(await this.evaluateCondition(condition, context))) {
        allConditionsMet = false;
        break;
      }
      matchedConditions.push(condition);
    }
    
    const evaluationTime = Date.now() - startTime;
    
    if (allConditionsMet) {
      return {
        matched: true,
        policy,
        confidence: this.calculateConfidence(matchedConditions, context),
        recommendedAction: policy.actions[0], // Use first action for now
        matchedConditions,
        evaluationTime
      };
    }
    
    return {
      matched: false,
      policy,
      confidence: 0,
      recommendedAction: { type: 'allow' },
      matchedConditions: [],
      evaluationTime
    };
  }
  
  private async evaluateCondition(condition: PolicyCondition, context: PolicyContext): Promise<boolean> {
    switch (condition.type) {
      case 'pattern_match':
        return this.evaluatePatternMatch(condition, context.prompt);
      case 'risk_score':
        return this.evaluateRiskScore(condition, context.riskScore);
      case 'request_frequency':
        return this.evaluateRequestFrequency(condition, context.requestCount);
      default:
        return false;
    }
  }
  
  private evaluatePatternMatch(condition: PolicyCondition, prompt: string): boolean {
    if (condition.operator !== 'contains' || !Array.isArray(condition.value)) {
      return false;
    }
    
    const lowerPrompt = prompt.toLowerCase();
    return condition.value.some((pattern: string) => 
      lowerPrompt.includes(pattern.toLowerCase())
    );
  }
  
  private evaluateRiskScore(condition: PolicyCondition, riskScore: number): boolean {
    switch (condition.operator) {
      case 'greater_than':
        return riskScore > condition.value;
      case 'less_than':
        return riskScore < condition.value;
      case 'equals':
        return Math.abs(riskScore - condition.value) < 0.01;
      default:
        return false;
    }
  }
  
  private async evaluateRequestFrequency(condition: PolicyCondition, requestCount: number): Promise<boolean> {
    switch (condition.operator) {
      case 'greater_than':
        return requestCount > condition.value;
      case 'less_than':
        return requestCount < condition.value;
      default:
        return false;
    }
  }
  
  private calculateConfidence(matchedConditions: PolicyCondition[], context: PolicyContext): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on number of matched conditions
    confidence += Math.min(matchedConditions.length * 0.2, 0.4);
    
    // Increase confidence based on risk score
    if (context.riskScore > 0.8) confidence += 0.2;
    else if (context.riskScore > 0.5) confidence += 0.1;
    
    // Increase confidence if patterns were detected
    if (context.detectedPatterns.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
  
  async reloadPolicies(): Promise<void> {
    this.loadPolicies();
  }
  
  getPolicies(): SecurityPolicy[] {
    return [...this.policies];
  }
  
  async isHealthy(): Promise<boolean> {
    try {
      return this.policies.length > 0;
    } catch {
      return false;
    }
  }
}

