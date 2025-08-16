export interface AgentRequest {
  agentId: string;
  prompt: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface SecurityResponse {
  action: 'allow' | 'block' | 'modify' | 'warn';
  reason: string;
  riskScore: number;
  processingTime: number;
  evidence?: Record<string, any>;
}

export interface AppConfig {
  port: number;
  logLevel: string;
  nodeEnv: string;
  testMode: boolean;
} 