export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  chainId: number;
  contractAddress: string;
}

export interface AuditEvent {
  agentId: string;
  eventType: string;
  severity: number;
  evidence: any;
  timestamp: number;
}

export interface PolicyEnforcementEvent {
  agentId: string;
  policyName: string;
  action: string;
  timestamp: number;
}

export interface BlockchainHealth {
  connected: boolean;
  latestBlock: number;
  gasPrice: string;
  contractAddress: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export interface AgentRiskScore {
  agentId: string;
  totalEvents: number;
  totalSeverity: number;
  lastEventTime: number;
  isActive: boolean;
}

export interface GlobalStats {
  totalEvents: number;
  totalThreats: number;
  averageSeverity: number;
}
