const WebSocket = require('ws');

// Create WebSocket server on port 3003
const wss = new WebSocket.Server({ port: 3003 });

console.log('🚀 SeiAgentGuard WebSocket Server started on port 3003');

// Store connected clients
const clients = new Set();

// Mock data for demonstration
let mockMetrics = {
  totalThreats: 156,
  threatsBlocked: 142,
  activeAgents: 23,
  averageResponseTime: 45,
  systemHealth: 'healthy',
  blockchainEvents: 89,
  cacheHitRate: 78
};

// Simulate real-time updates
function simulateUpdates() {
  // Update metrics every 10 seconds
  setInterval(() => {
    // Simulate threat detection
    mockMetrics.totalThreats += Math.floor(Math.random() * 3);
    mockMetrics.threatsBlocked += Math.floor(Math.random() * 2);
    mockMetrics.averageResponseTime = Math.max(20, mockMetrics.averageResponseTime + (Math.random() - 0.5) * 10);
    mockMetrics.blockchainEvents = Math.min(100, mockMetrics.blockchainEvents + Math.floor(Math.random() * 2));
    mockMetrics.cacheHitRate = Math.min(95, mockMetrics.cacheHitRate + (Math.random() - 0.5) * 2);
    
    // Randomly change system health
    if (Math.random() < 0.1) {
      const healthStates = ['healthy', 'warning', 'critical'];
      mockMetrics.systemHealth = healthStates[Math.floor(Math.random() * healthStates.length)];
    }
    
    // Broadcast updated metrics to all clients
    broadcastToAll({
      type: 'metrics',
      payload: mockMetrics
    });
  }, 10000);
  
  // Simulate security events every 15 seconds
  setInterval(() => {
    const eventTypes = ['threat', 'warning', 'info'];
    const messages = [
      'Prompt injection attempt detected',
      'Suspicious tool access pattern',
      'New agent registered',
      'Policy rule updated',
      'Threat intelligence feed updated',
      'Cache performance optimization',
      'Blockchain transaction confirmed'
    ];
    
    const randomEvent = {
      id: Date.now().toString(),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      agentId: `Agent-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      timestamp: Date.now(),
      severity: Math.floor(Math.random() * 100)
    };
    
    // Broadcast security event to all clients
    broadcastToAll({
      type: 'security_event',
      payload: randomEvent
    });
  }, 15000);
  
  // Simulate threat data updates every 20 seconds
  setInterval(() => {
    const currentHour = new Date().getHours();
    const newThreatData = {
      time: `${currentHour.toString().padStart(2, '0')}:00`,
      threats: Math.floor(Math.random() * 40) + 10,
      blocked: Math.floor(Math.random() * 35) + 8
    };
    
    // Broadcast threat update to all clients
    broadcastToAll({
      type: 'threat_update',
      payload: newThreatData
    });
  }, 20000);
}

// Broadcast message to all connected clients
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('🔌 New client connected');
  clients.add(ws);
  
  // Send initial metrics to new client
  ws.send(JSON.stringify({
    type: 'metrics',
    payload: mockMetrics
  }));
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'info',
    message: 'Welcome to SeiAgentGuard real-time monitoring!'
  }));
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'request_metrics':
          ws.send(JSON.stringify({
            type: 'metrics',
            payload: mockMetrics
          }));
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Start simulating updates
simulateUpdates();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

console.log('📡 WebSocket server ready for real-time updates');
console.log('💡 Clients can connect to: ws://localhost:3003');


