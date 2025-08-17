export interface SecurityPolicy {
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  priority: number;
}

export interface PolicyCondition {
  type: 'pattern_match' | 'risk_score' | 'agent_history' | 'request_frequency';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  field?: string;
}

export interface PolicyAction {
  type: 'allow' | 'block' | 'warn' | 'modify';
  message?: string;
  metadata?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  matched: boolean;
  policy: SecurityPolicy;
  confidence: number;
  recommendedAction: PolicyAction;
  matchedConditions: PolicyCondition[];
  evaluationTime: number;
}

export interface PolicyContext {
  agentId: string;
  prompt: string;
  riskScore: number;
  detectedPatterns: string[];
  requestCount: number;
  timestamp: number;
}

