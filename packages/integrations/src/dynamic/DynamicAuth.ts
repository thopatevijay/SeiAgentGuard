import axios from 'axios';

export interface DynamicUser {
  id: string;
  walletAddress: string;
  email?: string;
  permissions: string[];
  createdAt: string;
  lastLogin: string;
}

export interface AgentSession {
  sessionId: string;
  userId: string;
  walletAddress: string;
  permissions: string[];
  agentConfig: any;
  createdAt: number;
  expiresAt: number;
}

export class DynamicAuthClient {
  private apiKey: string;
  private environmentId: string;
  private baseUrl: string = 'https://app.dynamic.xyz/api/v0';
  
  constructor(environmentId: string, apiKey: string) {
    this.environmentId = environmentId;
    this.apiKey = apiKey;
  }
  
  /**
   * Validate user authentication token
   */
  async validateUser(token: string): Promise<DynamicUser | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Environment-Id': this.environmentId
        }
      });
      
      return this.transformUser(response.data);
    } catch (error) {
      console.error('Dynamic auth validation failed:', error);
      return null;
    }
  }
  
  /**
   * Create secure session for AI agent
   */
  async createAgentSession(user: DynamicUser, agentConfig: any): Promise<AgentSession> {
    const sessionData: AgentSession = {
      sessionId: this.generateSessionId(),
      userId: user.id,
      walletAddress: user.walletAddress,
      permissions: user.permissions,
      agentConfig,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    // In production, this would be stored securely in a database
    console.log('Agent session created:', sessionData.sessionId);
    
    return sessionData;
  }
  
  /**
   * Validate agent session
   */
  async validateAgentSession(sessionId: string): Promise<AgentSession | null> {
    try {
      // In production, this would validate against a secure database
      // For now, we'll simulate session validation
      if (sessionId && sessionId.length > 0) {
        return {
          sessionId,
          userId: 'mock-user-id',
          walletAddress: '0x742d35Cc6634C0532925a3b8D404b7e0d9C19699',
          permissions: ['basic', 'agent'],
          agentConfig: {},
          createdAt: Date.now() - 3600000, // 1 hour ago
          expiresAt: Date.now() + (23 * 60 * 60 * 1000) // 23 hours from now
        };
      }
      return null;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }
  
  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/permissions`, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        }
      });
      
      return response.data.permissions || ['basic'];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return ['basic'];
    }
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }
  
  /**
   * Create new user account
   */
  async createUser(userData: { email: string; walletAddress: string }): Promise<DynamicUser | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/users`, userData, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        }
      });
      
      return this.transformUser(response.data);
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }
  
  /**
   * Update user information
   */
  async updateUser(userId: string, updates: Partial<DynamicUser>): Promise<DynamicUser | null> {
    try {
      const response = await axios.put(`${this.baseUrl}/users/${userId}`, updates, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        }
      });
      
      return this.transformUser(response.data);
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }
  
  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }
  
  /**
   * Get user activity logs
   */
  async getUserActivity(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/activity`, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        },
        params: { limit }
      });
      
      return response.data.activities || [];
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return [];
    }
  }
  
  /**
   * Health check for Dynamic service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'X-Environment-Id': this.environmentId,
          'X-API-Key': this.apiKey
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Dynamic health check failed:', error);
      return false;
    }
  }
  
  /**
   * Transform raw user data to DynamicUser interface
   */
  private transformUser(userData: any): DynamicUser {
    return {
      id: userData.id,
      walletAddress: userData.walletPublicKey || userData.walletAddress,
      email: userData.email,
      permissions: userData.scopes || userData.permissions || ['basic'],
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLogin: userData.lastLogin || new Date().toISOString()
    };
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
