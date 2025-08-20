import axios from 'axios';

export interface WalletConfig {
  email: string;
  chain: string;
  agentId: string;
  purpose: string;
}

export interface Transaction {
  to: string;
  value: string;
  data?: string;
  gasLimit?: number;
  chain: string;
}

export interface WalletInfo {
  walletAddress: string;
  walletId: string;
  chain: string;
  balance: string;
  status: 'active' | 'inactive' | 'pending';
}

export class CrossmintWalletManager {
  private apiKey: string;
  private projectId: string;
  private baseUrl: string = 'https://www.crossmint.com/api';
  
  constructor(apiKey: string, projectId: string) {
    this.apiKey = apiKey;
    this.projectId = projectId;
  }
  
  /**
   * Create a new wallet for an AI agent
   */
  async createWallet(config: WalletConfig): Promise<WalletInfo> {
    try {
      const response = await axios.post(`${this.baseUrl}/v1-alpha2/wallets`, {
        email: config.email,
        chain: config.chain,
        metadata: {
          agentId: config.agentId,
          purpose: config.purpose,
          createdBy: 'SeiAgentGuard'
        }
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        }
      });
      
      return {
        walletAddress: response.data.address,
        walletId: response.data.id,
        chain: config.chain,
        balance: '0',
        status: 'active'
      };
    } catch (error) {
      throw new Error(`Wallet creation failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Execute a transaction with security validation
   */
  async executeTransaction(
    walletId: string,
    transaction: Transaction,
    securityCheck: boolean = true
  ): Promise<string> {
    if (securityCheck) {
      // Integrate with SeiAgentGuard security validation
      const securityResult = await this.validateTransaction(transaction);
      if (securityResult.risk === 'high') {
        throw new Error(`Transaction blocked: ${securityResult.reason}`);
      }
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/v1-alpha2/wallets/${walletId}/transactions`, {
        ...transaction,
        chain: transaction.chain || 'sei'
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        }
      });
      
      return response.data.transactionHash;
    } catch (error) {
      throw new Error(`Transaction failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Get wallet information and balance
   */
  async getWalletInfo(walletId: string): Promise<WalletInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1-alpha2/wallets/${walletId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        }
      });
      
      return {
        walletAddress: response.data.address,
        walletId: response.data.id,
        chain: response.data.chain,
        balance: response.data.balance || '0',
        status: response.data.status || 'active'
      };
    } catch (error) {
      throw new Error(`Failed to get wallet info: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(walletId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1-alpha2/wallets/${walletId}/transactions`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        },
        params: { limit }
      });
      
      return response.data.transactions || [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
  
  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: string): Promise<string> {
    try {
      const walletInfo = await this.getWalletInfo(walletId);
      return walletInfo.balance;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0';
    }
  }
  
  /**
   * Transfer funds between wallets
   */
  async transferFunds(
    fromWalletId: string,
    toAddress: string,
    amount: string,
    chain: string = 'sei'
  ): Promise<string> {
    const transaction: Transaction = {
      to: toAddress,
      value: amount,
      chain
    };
    
    return this.executeTransaction(fromWalletId, transaction);
  }
  
  /**
   * Deploy smart contract
   */
  async deployContract(
    walletId: string,
    contractBytecode: string,
    constructorArgs: any[] = [],
    chain: string = 'sei'
  ): Promise<string> {
    const transaction: Transaction = {
      to: '', // Empty for contract deployment
      value: '0',
      data: contractBytecode,
      gasLimit: 5000000, // Higher gas limit for deployment
      chain
    };
    
    return this.executeTransaction(walletId, transaction);
  }
  
  /**
   * Call smart contract function
   */
  async callContract(
    walletId: string,
    contractAddress: string,
    functionData: string,
    value: string = '0',
    chain: string = 'sei'
  ): Promise<string> {
    const transaction: Transaction = {
      to: contractAddress,
      value,
      data: functionData,
      gasLimit: 200000,
      chain
    };
    
    return this.executeTransaction(walletId, transaction);
  }
  
  /**
   * Get gas estimate for transaction
   */
  async estimateGas(transaction: Transaction): Promise<number> {
    try {
      const response = await axios.post(`${this.baseUrl}/v1-alpha2/gas/estimate`, transaction, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        }
      });
      
      return response.data.gasEstimate || 21000;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return 21000; // Default gas limit
    }
  }
  
  /**
   * Get current gas prices
   */
  async getGasPrices(chain: string = 'sei'): Promise<{ slow: string; standard: string; fast: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1-alpha2/gas/prices`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        },
        params: { chain }
      });
      
      return {
        slow: response.data.slow || '20000000000',
        standard: response.data.standard || '25000000000',
        fast: response.data.fast || '30000000000'
      };
    } catch (error) {
      console.error('Failed to get gas prices:', error);
      return {
        slow: '20000000000',
        standard: '25000000000',
        fast: '30000000000'
      };
    }
  }
  
  /**
   * Validate transaction for security risks
   */
  private async validateTransaction(transaction: Transaction): Promise<{ risk: 'low' | 'medium' | 'high'; reason: string }> {
    // Integration point with SeiAgentGuard security analysis
    // This would call your security API to validate the transaction
    
    // Basic validation rules
    if (parseFloat(transaction.value) > 1000000000000000000) { // 1 ETH equivalent
      return { risk: 'high', reason: 'Transaction value too high' };
    }
    
    if (transaction.to && transaction.to.length !== 42) {
      return { risk: 'medium', reason: 'Invalid recipient address' };
    }
    
    return { risk: 'low', reason: 'Transaction validated' };
  }
  
  /**
   * Health check for Crossmint service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1-alpha2/health`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-PROJECT-ID': this.projectId
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Crossmint health check failed:', error);
      return false;
    }
  }
}
