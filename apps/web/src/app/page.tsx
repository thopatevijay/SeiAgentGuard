'use client';

import { useEffect, useState } from 'react';

interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  activeAgents: number;
  averageResponseTime: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 156,
    threatsBlocked: 142,
    activeAgents: 23,
    averageResponseTime: 45,
    systemHealth: 'healthy'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg">Loading SeiAgentGuard Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SeiAgentGuard Security Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Real-time monitoring of AI agent security threats and system health
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-8">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            metrics.systemHealth === 'healthy' 
              ? 'bg-green-100 text-green-800' 
              : metrics.systemHealth === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {metrics.systemHealth === 'healthy' && '🟢'}
            {metrics.systemHealth === 'warning' && '🟡'}
            {metrics.systemHealth === 'critical' && '🔴'}
            <span className="ml-2 capitalize">{metrics.systemHealth}</span>
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Threats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Threats</h3>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.totalThreats}</p>
              <p className="text-sm text-gray-500">+12% from last hour</p>
            </div>
          </div>

          {/* Threats Blocked */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Threats Blocked</h3>
              <span className="text-2xl">🛡️</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.threatsBlocked}</p>
              <p className="text-sm text-gray-500">
                {Math.round((metrics.threatsBlocked / metrics.totalThreats) * 100)}% success rate
              </p>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Active Agents</h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.activeAgents}</p>
              <p className="text-sm text-gray-500">3 new this hour</p>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{metrics.averageResponseTime}ms</p>
              <p className="text-sm text-gray-500">-5% from last hour</p>
            </div>
          </div>
        </div>

        {/* Simple Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Threat Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Threat Activity (24h)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">00:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-red-200 rounded">
                    <div className="w-16 h-4 bg-red-500 rounded"></div>
                  </div>
                  <span className="text-sm">12 threats, 11 blocked</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">08:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-red-200 rounded">
                    <div className="w-18 h-4 bg-red-500 rounded"></div>
                  </div>
                  <span className="text-sm">25 threats, 23 blocked</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">16:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-red-200 rounded">
                    <div className="w-14 h-4 bg-red-500 rounded"></div>
                  </div>
                  <span className="text-sm">28 threats, 26 blocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Blockchain Events</span>
                  <span className="text-sm text-gray-500">89</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm text-gray-500">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-red-900">Prompt Injection Attempt</p>
                  <p className="text-sm text-red-600">Agent: AI-Trading-Bot-001</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                Blocked
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="font-medium text-yellow-900">Suspicious Tool Access</p>
                  <p className="text-sm text-yellow-600">Agent: Data-Analyzer-003</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                Warning
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-900">Policy Update Applied</p>
                  <p className="text-sm text-green-600">Enhanced MCP security rules</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Info
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Connected to Sei Network • Real-time monitoring active</p>
        </div>
      </div>
    </div>
  );
}
