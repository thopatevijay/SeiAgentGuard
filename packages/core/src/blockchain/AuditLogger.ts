import { SeiClient } from './SeiClient';
import { AuditEvent, PolicyEnforcementEvent, TransactionResult } from './types';
import { createHash } from 'crypto';
import { logger } from '../logger';

export class BlockchainAuditLogger {
  private seiClient: SeiClient;
  private enabled: boolean;
  private initialized: boolean = false;
  
  constructor(seiClient: SeiClient, enabled: boolean = true) {
    this.seiClient = seiClient;
    this.enabled = enabled;
  }
  
  /**
   * Initialize the blockchain logger
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      logger.info('Blockchain logging disabled');
      return;
    }
    
    try {
      await this.seiClient.initializeContract();
      
      // Check if we're authorized to log
      const isAuthorized = await this.seiClient.isAuthorizedLogger();
      if (!isAuthorized) {
        logger.warn('Not authorized to log to blockchain contract');
        this.enabled = false;
        return;
      }
      
      this.initialized = true;
      logger.info('Blockchain audit logger initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize blockchain logger', { error: error.message });
      this.enabled = false;
    }
  }
  
  /**
   * Log a security event to the blockchain
   */
  async logSecurityEvent(event: AuditEvent): Promise<TransactionResult | null> {
    if (!this.enabled || !this.initialized) {
      logger.debug('Blockchain logging disabled or not initialized');
      return null;
    }
    
    try {
      // Hash the evidence for blockchain storage
      const evidenceHash = this.hashEvidence(event.evidence);
      
      // Convert severity to blockchain format (0-100)
      const blockchainSeverity = Math.min(Math.round(event.severity * 100), 100);
      
      logger.info('Logging security event to blockchain', {
        agentId: event.agentId,
        eventType: event.eventType,
        severity: blockchainSeverity,
        evidenceHash
      });
      
      const result = await this.seiClient.logSecurityEvent(
        event.agentId,
        event.eventType,
        blockchainSeverity,
        evidenceHash
      );
      
      if (result.success) {
        logger.info('Security event logged to blockchain successfully', {
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed
        });
      } else {
        logger.error('Failed to log security event to blockchain', {
          error: result.error
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error('Failed to log to blockchain', { error: error.message });
      // Don't throw - graceful degradation
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Log a policy enforcement action
   */
  async logPolicyEnforcement(event: PolicyEnforcementEvent): Promise<TransactionResult | null> {
    if (!this.enabled || !this.initialized) {
      logger.debug('Blockchain logging disabled or not initialized');
      return null;
    }
    
    try {
      logger.info('Logging policy enforcement to blockchain', {
        agentId: event.agentId,
        policyName: event.policyName,
        action: event.action
      });
      
      const result = await this.seiClient.logPolicyEnforcement(
        event.agentId,
        event.policyName,
        event.action
      );
      
      if (result.success) {
        logger.info('Policy enforcement logged to blockchain successfully', {
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error('Failed to log policy enforcement to blockchain', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get agent risk score from blockchain
   */
  async getAgentRiskScore(agentId: string): Promise<number> {
    if (!this.enabled || !this.initialized) {
      return 0;
    }
    
    try {
      const riskScore = await this.seiClient.getAgentRiskScore(agentId);
      return riskScore;
    } catch (error) {
      logger.error('Failed to get agent risk score from blockchain', { error: error.message });
      return 0;
    }
  }
  
  /**
   * Get global blockchain statistics
   */
  async getGlobalStats(): Promise<{ totalEvents: number; totalThreats: number; averageSeverity: number }> {
    if (!this.enabled || !this.initialized) {
      return { totalEvents: 0, totalThreats: 0, averageSeverity: 0 };
    }
    
    try {
      return await this.seiClient.getGlobalStats();
    } catch (error) {
      logger.error('Failed to get global stats from blockchain', { error: error.message });
      return { totalEvents: 0, totalThreats: 0, averageSeverity: 0 };
    }
  }
  
  /**
   * Get blockchain health status
   */
  async getHealthStatus(): Promise<{ connected: boolean; details?: any }> {
    if (!this.enabled) {
      return { connected: false };
    }
    
    try {
      const health = await this.seiClient.getHealthStatus();
      return {
        connected: health.connected,
        details: health
      };
    } catch (error) {
      logger.error('Failed to get blockchain health', { error: error.message });
      return { connected: false };
    }
  }
  
  /**
   * Check if blockchain logging is available
   */
  isAvailable(): boolean {
    return this.enabled && this.initialized;
  }
  
  /**
   * Enable or disable blockchain logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info('Blockchain logging ' + (enabled ? 'enabled' : 'disabled'));
  }
  
  /**
   * Hash evidence data for blockchain storage
   */
  private hashEvidence(evidence: any): string {
    const evidenceString = JSON.stringify(evidence);
    return createHash('sha256').update(evidenceString).digest('hex');
  }
  
  /**
   * Batch log multiple events (for efficiency)
   */
  async batchLogEvents(events: AuditEvent[]): Promise<TransactionResult[]> {
    if (!this.enabled || !this.initialized) {
      return [];
    }
    
    const results: TransactionResult[] = [];
    
    for (const event of events) {
      try {
        const result = await this.logSecurityEvent(event);
        if (result) {
          results.push(result);
        }
        
        // Small delay between transactions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.error('Failed to log event in batch', { error: error.message });
        results.push({
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}
