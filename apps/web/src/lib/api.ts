class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Security-specific methods
  async getMetrics() {
    return this.get('/api/v1/metrics');
  }

  async getAgents() {
    return this.get('/api/v1/agents');
  }

  async getThreats() {
    return this.get('/api/v1/threats');
  }

  async analyzePrompt(agentId: string, prompt: string) {
    return this.post('/api/v1/security/analyze', {
      agentId,
      prompt,
      timestamp: Date.now()
    });
  }

  async getSecurityStatus() {
    return this.get('/api/v1/security/status');
  }

  async getHealthStatus() {
    return this.get('/health');
  }

  // Blockchain-specific methods
  async getBlockchainStats() {
    return this.get('/api/v1/blockchain/stats');
  }

  async getAgentRiskScore(agentId: string) {
    return this.get(`/api/v1/blockchain/agent/${agentId}/risk`);
  }

  // Policy management
  async getPolicies() {
    return this.get('/api/v1/policies');
  }

  async createPolicy(policy: any) {
    return this.post('/api/v1/policies', policy);
  }

  async updatePolicy(policyId: string, policy: any) {
    return this.put(`/api/v1/policies/${policyId}`, policy);
  }

  async deletePolicy(policyId: string) {
    return this.delete(`/api/v1/policies/${policyId}`);
  }

  // Agent management
  async createAgent(agent: any) {
    return this.post('/api/v1/agents', agent);
  }

  async updateAgent(agentId: string, agent: any) {
    return this.put(`/api/v1/agents/${agentId}`, agent);
  }

  async deleteAgent(agentId: string) {
    return this.delete(`/api/v1/agents/${agentId}`);
  }

  // Threat analysis
  async getThreatHistory(agentId?: string, limit?: number) {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    if (limit) params.append('limit', limit.toString());
    
    return this.get(`/api/v1/threats/history?${params.toString()}`);
  }

  async exportThreatData(format: 'csv' | 'json' = 'json') {
    return this.get(`/api/v1/threats/export?format=${format}`);
  }

  // System configuration
  async getSystemConfig() {
    return this.get('/api/v1/system/config');
  }

  async updateSystemConfig(config: any) {
    return this.put('/api/v1/system/config', config);
  }

  // Logs and monitoring
  async getSystemLogs(level?: string, limit?: number) {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    
    return this.get(`/api/v1/system/logs?${params.toString()}`);
  }

  async getPerformanceMetrics() {
    return this.get('/api/v1/system/performance');
  }
}

export const apiClient = new ApiClient();
