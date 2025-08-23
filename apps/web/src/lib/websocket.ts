export interface WebSocketMessage {
  type: 'metrics' | 'security_event' | 'system_health' | 'threat_update' | 'blockchain_event' | 'policy_update' | 'info' | 'pong';
  payload?: any;
  message?: string;
  timestamp?: number;
}

export interface WebSocketCallbacks {
  onMetrics?: (data: any) => void;
  onSecurityEvent?: (data: any) => void;
  onSystemHealth?: (data: any) => void;
  onThreatUpdate?: (data: any) => void;
  onBlockchainEvent?: (data: any) => void;
  onPolicyUpdate?: (data: any) => void;
  onInfo?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(url: string, callbacks: WebSocketCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to WebSocket:', this.url);

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.callbacks.onDisconnect?.();
      
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnecting = false;
      this.callbacks.onError?.(error);
    };
  }

  private handleMessage(data: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', data.type);
    
    switch (data.type) {
      case 'metrics':
        this.callbacks.onMetrics?.(data.payload);
        break;
      case 'security_event':
        this.callbacks.onSecurityEvent?.(data.payload);
        break;
      case 'system_health':
        this.callbacks.onSystemHealth?.(data.payload);
        break;
      case 'threat_update':
        this.callbacks.onThreatUpdate?.(data.payload);
        break;
      case 'blockchain_event':
        this.callbacks.onBlockchainEvent?.(data.payload);
        break;
      case 'policy_update':
        this.callbacks.onPolicyUpdate?.(data.payload);
        break;
      case 'info':
        this.callbacks.onInfo?.(data);
        break;
      case 'pong':
        // Heartbeat response, no action needed
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  requestMetrics(): void {
    this.send({ type: 'request_metrics', timestamp: Date.now() });
  }

  requestSecurityEvents(): void {
    this.send({ type: 'request_security_events', timestamp: Date.now() });
  }

  requestSystemHealth(): void {
    this.send({ type: 'request_system_health', timestamp: Date.now() });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Create a singleton instance
export const wsClient = new WebSocketClient('ws://localhost:3003');

