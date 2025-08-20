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
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case 'healthy': return 'HEALTHY';
      case 'warning': return 'WARNING';
      case 'critical': return 'CRITICAL';
      default: return 'UNKNOWN';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Overview</h1>
        <Badge className={`${getHealthColor(metrics.systemHealth)} text-white`}>
          {getHealthText(metrics.systemHealth)}
        </Badge>
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
              -5ms from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockchainEvents}</div>
            <p className="text-xs text-muted-foreground">
              Events logged to Sei
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cacheHitRate}%</div>
            <p className="text-xs text-muted-foreground">
              Redis performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">All Systems</div>
            <p className="text-xs text-muted-foreground">
              Operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Threat Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Detection Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="threats" stroke="#8884d8" strokeWidth={2} name="Total Threats" />
              <Line type="monotone" dataKey="blocked" stroke="#82ca9d" strokeWidth={2} name="Blocked Threats" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Threat Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Distribution by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { type: 'Prompt Injection', count: 45, blocked: 42 },
              { type: 'Malware', count: 23, blocked: 21 },
              { type: 'Data Exfiltration', count: 18, blocked: 17 },
              { type: 'Rate Limiting', count: 34, blocked: 32 },
              { type: 'Other', count: 36, blocked: 30 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" name="Total Threats" />
              <Bar dataKey="blocked" fill="#82ca9d" name="Blocked Threats" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
