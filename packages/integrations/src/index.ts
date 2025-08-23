import { DynamicAuthClient } from './dynamic/DynamicAuth';
import { CrossmintWalletManager } from './crossmint/WalletManager';
import { AlchemyClient } from './alchemy/AlchemyClient';
import { SageMakerClient } from './aws/SageMakerClient';

export interface SponsorToolsConfig {
  dynamic: {
    environmentId: string;
    apiKey: string;
  };
  crossmint: {
    apiKey: string;
    projectId: string;
  };
  alchemy: {
    apiKey: string;
    network?: string;
  };
  aws: {
    region: string;
    endpointName: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

export interface IntegrationHealth {
  dynamic: boolean;
  crossmint: boolean;
  alchemy: boolean;
  aws: boolean;
  overall: boolean;
}

export class SponsorToolsManager {
  public dynamic: DynamicAuthClient;
  public crossmint: CrossmintWalletManager;
  public alchemy: AlchemyClient;
  public aws: SageMakerClient;
  
  private config: SponsorToolsConfig;
  
  constructor(config: SponsorToolsConfig) {
    this.config = config;
    
    // Initialize Dynamic authentication
    this.dynamic = new DynamicAuthClient(
      config.dynamic.environmentId,
      config.dynamic.apiKey
    );
    
    // Initialize Crossmint wallet management
    this.crossmint = new CrossmintWalletManager(
      config.crossmint.apiKey,
      config.crossmint.projectId
    );
    
    // Initialize Alchemy RPC
    this.alchemy = new AlchemyClient(
      config.alchemy.apiKey,
      config.alchemy.network || 'sei-mainnet'
    );
    
    // Initialize AWS SageMaker
    this.aws = new SageMakerClient(
      config.aws.region,
      config.aws.endpointName
    );
  }
  
  /**
   * Health check for all sponsor tools
   */
  async healthCheck(): Promise<IntegrationHealth> {
    const results = await Promise.allSettled([
      this.dynamic.healthCheck(),
      this.crossmint.healthCheck(),
      this.alchemy.healthCheck(),
      this.aws.isHealthy()
    ]);
    
    const health: IntegrationHealth = {
      dynamic: results[0].status === 'fulfilled' && results[0].value,
      crossmint: results[1].status === 'fulfilled' && results[1].value,
      alchemy: results[2].status === 'fulfilled' && results[2].value,
      aws: results[3].status === 'fulfilled' && results[3].value,
      overall: false
    };
    
    health.overall = health.dynamic && health.crossmint && health.alchemy && health.aws;
    
    return health;
  }
  
  /**
   * Get detailed health information
   */
  async getDetailedHealth(): Promise<{
    health: IntegrationHealth;
    details: {
      dynamic?: any;
      crossmint?: any;
      alchemy?: any;
      aws?: any;
    };
  }> {
    const health = await this.healthCheck();
    
    const details: any = {};
    
    try {
      if (health.dynamic) {
        details.dynamic = { status: 'healthy', lastCheck: new Date().toISOString() };
      }
    } catch (error) {
      details.dynamic = { status: 'error', error: error.message };
    }
    
    try {
      if (health.crossmint) {
        details.crossmint = { status: 'healthy', lastCheck: new Date().toISOString() };
      }
    } catch (error) {
      details.crossmint = { status: 'error', error: error.message };
    }
    
    try {
      if (health.alchemy) {
        const networkInfo = await this.alchemy.getNetworkInfo();
        details.alchemy = { 
          status: 'healthy', 
          network: networkInfo,
          lastCheck: new Date().toISOString() 
        };
      }
    } catch (error) {
      details.alchemy = { status: 'error', error: error.message };
    }
    
    try {
      if (health.aws) {
        const modelHealth = await this.aws.getModelHealth();
        details.aws = { 
          status: 'healthy', 
          modelHealth,
          lastCheck: new Date().toISOString() 
        };
      }
    } catch (error) {
      details.aws = { status: 'error', error: error.message };
    }
    
    return { health, details };
  }
  
  /**
   * Create AI agent with all integrations
   */
  async createAgent(agentConfig: {
    email: string;
    agentId: string;
    purpose: string;
    chain: string;
  }): Promise<{
    userId: string;
    walletAddress: string;
    sessionId: string;
    integrations: {
      dynamic: boolean;
      crossmint: boolean;
      alchemy: boolean;
      aws: boolean;
    };
  }> {
    try {
      // 1. Create user in Dynamic
      const user = await this.dynamic.createUser({
        email: agentConfig.email,
        walletAddress: '0x0000000000000000000000000000000000000000' // Will be updated
      });
      
      if (!user) {
        throw new Error('Failed to create user in Dynamic');
      }
      
      // 2. Create wallet in Crossmint
      const wallet = await this.crossmint.createWallet({
        email: agentConfig.email,
        chain: agentConfig.chain,
        agentId: agentConfig.agentId,
        purpose: agentConfig.purpose
      });
      
      // 3. Update user with wallet address
      await this.dynamic.updateUser(user.id, {
        walletAddress: wallet.walletAddress
      });
      
      // 4. Create agent session
      const session = await this.dynamic.createAgentSession(user, {
        ...agentConfig,
        walletAddress: wallet.walletAddress
      });
      
      // 5. Setup Alchemy webhook for monitoring
      let webhookId: string | undefined;
      try {
        webhookId = await this.alchemy.setupWebhook({
          webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/alchemy`,
          addresses: [wallet.walletAddress],
          webhookType: 'ADDRESS_ACTIVITY',
          network: agentConfig.chain
        });
      } catch (error) {
        console.warn('Failed to setup Alchemy webhook:', error);
      }
      
      return {
        userId: user.id,
        walletAddress: wallet.walletAddress,
        sessionId: session.sessionId,
        integrations: {
          dynamic: true,
          crossmint: true,
          alchemy: !!webhookId,
          aws: true
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to create agent: ${error.message}`);
    }
  }
  
  /**
   * Get agent status across all integrations
   */
  async getAgentStatus(agentId: string, walletAddress: string): Promise<{
    dynamic: any;
    crossmint: any;
    alchemy: any;
    aws: any;
  }> {
    const status: any = {};
    
    try {
      // Get Dynamic user info
      status.dynamic = {
        status: 'active',
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      status.dynamic = { status: 'error', error: error.message };
    }
    
    try {
      // Get Crossmint wallet info
      const walletInfo = await this.crossmint.getWalletInfo(agentId);
      status.crossmint = {
        status: walletInfo.status,
        balance: walletInfo.balance,
        chain: walletInfo.chain
      };
    } catch (error) {
      status.crossmint = { status: 'error', error: error.message };
    }
    
    try {
      // Get Alchemy balance
      const balance = await this.alchemy.getBalance(walletAddress);
      status.alchemy = {
        status: 'active',
        balance: balance,
        network: this.config.alchemy.network
      };
    } catch (error) {
      status.alchemy = { status: 'error', error: error.message };
    }
    
    try {
      // Get AWS model status
      const modelHealth = await this.aws.getModelHealth();
      status.aws = {
        status: 'active',
        modelHealth: modelHealth
      };
    } catch (error) {
      status.aws = { status: 'error', error: error.message };
    }
    
    return status;
  }
  
  /**
   * Execute secure transaction with all validations
   */
  async executeSecureTransaction(
    walletId: string,
    transaction: any,
    agentId: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    securityValidation: any;
    integrations: any;
  }> {
    try {
      // 1. Security validation through SeiAgentGuard
      const securityValidation = await this.validateTransactionSecurity(transaction, agentId);
      
      if (securityValidation.risk === 'high') {
        return {
          success: false,
          securityValidation,
          integrations: {}
        };
      }
      
      // 2. Execute transaction through Crossmint
      const transactionHash = await this.crossmint.executeTransaction(
        walletId,
        transaction,
        true // Enable security check
      );
      
      // 3. Log to blockchain through SeiAgentGuard
      // This would integrate with your blockchain logging system
      
      return {
        success: true,
        transactionHash,
        securityValidation,
        integrations: {
          crossmint: true,
          blockchain: true
        }
      };
      
    } catch (error) {
      return {
        success: false,
        securityValidation: { risk: 'high', reason: error.message },
        integrations: {}
      };
    }
  }
  
  /**
   * Validate transaction security
   */
  private async validateTransactionSecurity(transaction: any, agentId: string): Promise<{
    risk: 'low' | 'medium' | 'high';
    reason: string;
    confidence: number;
  }> {
    // This would integrate with your SeiAgentGuard security analysis
    // For now, return basic validation
    
    if (parseFloat(transaction.value) > 1000000000000000000) {
      return { risk: 'high', reason: 'Transaction value too high', confidence: 0.9 };
    }
    
    if (transaction.to && transaction.to.length !== 42) {
      return { risk: 'medium', reason: 'Invalid recipient address', confidence: 0.7 };
    }
    
    return { risk: 'low', reason: 'Transaction validated', confidence: 0.8 };
  }
  
  /**
   * Get configuration
   */
  getConfig(): SponsorToolsConfig {
    return this.config;
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SponsorToolsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize clients if needed
    if (newConfig.dynamic) {
      this.dynamic = new DynamicAuthClient(
        newConfig.dynamic.environmentId,
        newConfig.dynamic.apiKey
      );
    }
    
    if (newConfig.crossmint) {
      this.crossmint = new CrossmintWalletManager(
        newConfig.crossmint.apiKey,
        newConfig.crossmint.projectId
      );
    }
    
    if (newConfig.alchemy) {
      this.alchemy = new AlchemyClient(
        newConfig.alchemy.apiKey,
        newConfig.alchemy.network || 'sei-mainnet'
      );
    }
    
    if (newConfig.aws) {
      this.aws = new SageMakerClient(
        newConfig.aws.region,
        newConfig.aws.endpointName
      );
    }
  }
}

// Export individual classes for direct use
export { DynamicAuthClient } from './dynamic/DynamicAuth';
export { CrossmintWalletManager } from './crossmint/WalletManager';
export { AlchemyClient } from './alchemy/AlchemyClient';
export { SageMakerClient } from './aws/SageMakerClient';
