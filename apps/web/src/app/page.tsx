'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Shield, AlertTriangle, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  activeAgents: number;
  averageResponseTime: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  blockchainEvents: number;
  cacheHitRate: number;
}

interface ThreatData {
  time: string;
  threats: number;
  blocked: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 0,
    threatsBlocked: 0,
    activeAgents: 0,
    averageResponseTime: 0,
    systemHealth: 'healthy',
    blockchainEvents: 0,
    cacheHitRate: 0
  });

  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();
    
    // Setup WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3003');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics') {
        setMetrics(data.payload);
      }
    };

    // Setup polling for metrics
    const interval = setInterval(fetchMetrics, 30000); // Every 30 seconds

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Use mock data for development
      setMetrics({
        totalThreats: 156,
        threatsBlocked: 142,
        activeAgents: 23,
        averageResponseTime: 45,
        systemHealth: 'healthy',
        blockchainEvents: 89,
        cacheHitRate: 78
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock threat data for development
  useEffect(() => {
    const mockData = [
      { time: '00:00', threats: 12, blocked: 11 },
      { time: '04:00', threats: 8, blocked: 7 },
      { time: '08:00', threats: 25, blocked: 23 },
      { time: '12:00', threats: 34, blocked: 31 },
      { time: '16:00', threats: 28, blocked: 26 },
      { time: '20:00', threats: 18, blocked: 17 },
    ];
    setThreatData(mockData);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading SeiAgentGuard Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Overview</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of AI agent security threats and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getHealthColor(metrics.systemHealth)}>
            {getHealthIcon(metrics.systemHealth)}
            <span className="ml-2 capitalize">{metrics.systemHealth}</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalThreats}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((metrics.threatsBlocked / metrics.totalThreats) * 100)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              3 new this hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              -5% from last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Threat Activity (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={threatData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="blocked" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blockchain Events</span>
                <span className="text-sm text-muted-foreground">{metrics.blockchainEvents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics.blockchainEvents / 100) * 100, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <span className="text-sm text-muted-foreground">{metrics.cacheHitRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${metrics.cacheHitRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Prompt Injection Attempt</p>
                  <p className="text-sm text-muted-foreground">Agent: AI-Trading-Bot-001</p>
                </div>
              </div>
              <Badge variant="destructive">Blocked</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Suspicious Tool Access</p>
                  <p className="text-sm text-muted-foreground">Agent: Data-Analyzer-003</p>
                </div>
              </div>
              <Badge variant="secondary">Warning</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Policy Update Applied</p>
                  <p className="text-sm text-muted-foreground">Enhanced MCP security rules</p>
                </div>
              </div>
              <Badge variant="outline">Info</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
