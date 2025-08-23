import axios from 'axios';

export interface WebhookConfig {
  webhookUrl: string;
  addresses: string[];
  webhookType: 'ADDRESS_ACTIVITY' | 'MINED_TRANSACTION' | 'DROPPED_TRANSACTION';
  network: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: number;
  blockNumber: number;
  timestamp: number;
}

export interface BlockData {
  number: number;
  hash: string;
  timestamp: number;
  transactions: string[];
  gasUsed: string;
  gasLimit: string;
}

export class AlchemyClient {
  private apiKey: string;
  private network: string;
  private baseUrl: string;
  
  constructor(apiKey: string, network: string = 'sei-mainnet') {
    this.apiKey = apiKey;
    this.network = network;
    this.baseUrl = `https://${network}.g.alchemy.com/v2/${apiKey}`;
  }
  
  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      });
      
      return response.data.result;
    } catch (error) {
      throw new Error(`Alchemy RPC call failed: ${error.message}`);
    }
  }
  
  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1
      });
      
      return parseInt(response.data.result, 16);
    } catch (error) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }
  
  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<TransactionData | null> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [hash],
        id: 1
      });
      
      if (!response.data.result) {
        return null;
      }
      
      const tx = response.data.result;
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        nonce: parseInt(tx.nonce, 16),
        blockNumber: parseInt(tx.blockNumber, 16),
        timestamp: Date.now() // Would need to get from block
      };
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }
  
  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<BlockData | null> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [`0x${blockNumber.toString(16)}`, false],
        id: 1
      });
      
      if (!response.data.result) {
        return null;
      }
      
      const block = response.data.result;
      return {
        number: parseInt(block.number, 16),
        hash: block.hash,
        timestamp: parseInt(block.timestamp, 16),
        transactions: block.transactions,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit
      };
    } catch (error) {
      throw new Error(`Failed to get block: ${error.message}`);
    }
  }
  
  /**
   * Get latest block number
   */
  async getLatestBlockNumber(): Promise<number> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      });
      
      return parseInt(response.data.result, 16);
    } catch (error) {
      throw new Error(`Failed to get latest block: ${error.message}`);
    }
  }
  
  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      });
      
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }
  
  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
  }): Promise<number> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [transaction],
        id: 1
      });
      
      return parseInt(response.data.result, 16);
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }
  
  /**
   * Get logs for specific address
   */
  async getLogs(address: string, fromBlock: number, toBlock: number): Promise<any[]> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          address,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`
        }],
        id: 1
      });
      
      return response.data.result || [];
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
  
  /**
   * Setup webhook for monitoring
   */
  async setupWebhook(config: WebhookConfig): Promise<string> {
    try {
      const response = await axios.post('https://dashboard.alchemy.com/api/team-webhooks', {
        webhook_url: config.webhookUrl,
        webhook_type: config.webhookType,
        addresses: config.addresses,
        network: config.network
      }, {
        headers: {
          'X-Alchemy-Token': this.apiKey
        }
      });
      
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to setup webhook: ${error.message}`);
    }
  }
  
  /**
   * Get webhook information
   */
  async getWebhook(webhookId: string): Promise<any> {
    try {
      const response = await axios.get(`https://dashboard.alchemy.com/api/team-webhooks/${webhookId}`, {
        headers: {
          'X-Alchemy-Token': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get webhook: ${error.message}`);
    }
  }
  
  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await axios.delete(`https://dashboard.alchemy.com/api/team-webhooks/${webhookId}`, {
        headers: {
          'X-Alchemy-Token': this.apiKey
        }
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }
  
  /**
   * Get token balances for address
   */
  async getTokenBalances(address: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/getTokenBalances`, {
        params: { address }
      });
      
      return response.data.tokenBalances || [];
    } catch (error) {
      throw new Error(`Failed to get token balances: ${error.message}`);
    }
  }
  
  /**
   * Get NFTs owned by address
   */
  async getNFTs(address: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/getNFTs`, {
        params: { owner: address }
      });
      
      return response.data.ownedNfts || [];
    } catch (error) {
      throw new Error(`Failed to get NFTs: ${error.message}`);
    }
  }
  
  /**
   * Get transaction history for address
   */
  async getTransactionHistory(address: string, limit: number = 100): Promise<TransactionData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/getAssetTransfers`, {
        params: {
          fromAddress: address,
          toAddress: address,
          maxCount: limit
        }
      });
      
      return response.data.transfers || [];
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }
  
  /**
   * Get contract metadata
   */
  async getContractMetadata(contractAddress: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/getContractMetadata`, {
        params: { contractAddress }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get contract metadata: ${error.message}`);
    }
  }
  
  /**
   * Health check for Alchemy service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const blockNumber = await this.getLatestBlockNumber();
      return blockNumber > 0;
    } catch (error) {
      console.error('Alchemy health check failed:', error);
      return false;
    }
  }
  
  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      });
      
      const chainId = parseInt(response.data.result, 16);
      return {
        chainId,
        name: this.network
      };
    } catch (error) {
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }
}
