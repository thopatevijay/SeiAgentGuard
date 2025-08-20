import { ethers } from 'ethers';
import { BlockchainConfig, BlockchainHealth, TransactionResult } from './types';
import { logger } from '../logger';

export class SeiClient {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private auditContract: ethers.Contract | null = null;
  private contractAddress: string;
  private chainId: number;
  
  constructor(config: BlockchainConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    this.contractAddress = config.contractAddress;
    this.chainId = config.chainId;
    
    logger.info('SeiClient initialized', { 
      rpcUrl: config.rpcUrl, 
      chainId: config.chainId,
      contractAddress: config.contractAddress 
    });
  }
  
  /**
   * Initialize the audit contract
   */
  async initializeContract(): Promise<void> {
    try {
      // Basic contract ABI for core functions
      const contractABI = [
        'function logSecurityEvent(address agentId, string eventType, uint256 severity, bytes32 evidenceHash) external',
        'function logPolicyEnforcement(address agentId, string policyName, string action) external',
        'function getAgentRiskScore(address agentId) external view returns (uint256)',
        'function getGlobalStats() external view returns (uint256, uint256, uint256)',
        'function isAuthorizedLogger(address logger) external view returns (bool)'
      ];
      
      this.auditContract = new ethers.Contract(
        this.contractAddress,
        contractABI,
        this.signer
      );
      
      logger.info('Audit contract initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize contract', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Log a security event to the blockchain
   */
  async logSecurityEvent(
    agentId: string,
    eventType: string,
    severity: number,
    evidenceHash: string
  ): Promise<TransactionResult> {
    if (!this.auditContract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      logger.info('Logging security event to blockchain', {
        agentId,
        eventType,
        severity,
        evidenceHash
      });
      
      const tx = await this.auditContract.logSecurityEvent(
        agentId,
        eventType,
        severity,
        evidenceHash,
        { gasLimit: 150000 }
      );
      
      logger.info('Transaction sent', { hash: tx.hash });
      
      const receipt = await tx.wait();
      
      logger.info('Transaction confirmed', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString()
      });
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: Number(receipt.gasUsed),
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      logger.error('Failed to log security event', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Log a policy enforcement action
   */
  async logPolicyEnforcement(
    agentId: string,
    policyName: string,
    action: string
  ): Promise<TransactionResult> {
    if (!this.auditContract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      logger.info('Logging policy enforcement to blockchain', {
        agentId,
        policyName,
        action
      });
      
      const tx = await this.auditContract.logPolicyEnforcement(
        agentId,
        policyName,
        action,
        { gasLimit: 100000 }
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: Number(receipt.gasUsed),
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      logger.error('Failed to log policy enforcement', { error: error.message });
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
    if (!this.auditContract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const riskScore = await this.auditContract.getAgentRiskScore(agentId);
      return Number(riskScore);
    } catch (error) {
      logger.error('Failed to get agent risk score', { error: error.message });
      return 0;
    }
  }
  
  /**
   * Get global statistics from blockchain
   */
  async getGlobalStats(): Promise<{ totalEvents: number; totalThreats: number; averageSeverity: number }> {
    if (!this.auditContract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const [totalEvents, totalThreats, averageSeverity] = await this.auditContract.getGlobalStats();
      return {
        totalEvents: Number(totalEvents),
        totalThreats: Number(totalThreats),
        averageSeverity: Number(averageSeverity)
      };
    } catch (error) {
      logger.error('Failed to get global stats', { error: error.message });
      return { totalEvents: 0, totalThreats: 0, averageSeverity: 0 };
    }
  }
  
  /**
   * Check if the current address is authorized to log events
   */
  async isAuthorizedLogger(): Promise<boolean> {
    if (!this.auditContract) {
      return false;
    }
    
    try {
      return await this.auditContract.isAuthorizedLogger(this.signer.address);
    } catch (error) {
      logger.error('Failed to check authorization', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get blockchain health status
   */
  async getHealthStatus(): Promise<BlockchainHealth> {
    try {
      const latestBlock = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();
      
      return {
        connected: true,
        latestBlock,
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        contractAddress: this.contractAddress
      };
    } catch (error) {
      logger.error('Failed to get blockchain health', { error: error.message });
      return {
        connected: false,
        latestBlock: 0,
        gasPrice: '0',
        contractAddress: this.contractAddress
      };
    }
  }
  
  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || '0';
    } catch (error) {
      logger.error('Failed to get gas price', { error: error.message });
      return '0';
    }
  }
  
  /**
   * Get current network information
   */
  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error) {
      logger.error('Failed to get network info', { error: error.message });
      return { chainId: this.chainId, name: 'unknown' };
    }
  }
}
