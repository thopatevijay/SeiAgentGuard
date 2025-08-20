'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Activity, Settings, Users, AlertTriangle, BarChart3 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Overview', href: '/', icon: Activity },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Threats', href: '/threats', icon: AlertTriangle },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r transition-all duration-300`}>
        <div className="flex items-center gap-2 p-4 border-b">
          <Shield className="h-8 w-8 text-primary" />
          {sidebarOpen && <h1 className="text-xl font-bold">SeiAgentGuard</h1>}
        </div>
        
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.location.href = item.href}
            >
              <item.icon className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">{item.name}</span>}
            </Button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </Button>
            <div className="text-sm text-muted-foreground">
              Connected to Sei Network
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
