#!/usr/bin/env node
const http = require('http');

async function checkService(name, url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      resolve({ name, status: res.statusCode === 200 ? '✅' : '❌', code: res.statusCode });
    });
    
    req.on('error', () => resolve({ name, status: '❌', error: 'Connection failed' }));
    req.on('timeout', () => resolve({ name, status: '❌', error: 'Timeout' }));
  });
}

async function runHealthCheck() {
  console.log('🏥 SeiAgentGuard Health Check');
  console.log('='.repeat(40));
  
  const services = [
    { name: 'API Server', url: 'http://localhost:3001/health' },
    { name: 'Core Service', url: 'http://localhost:3002/health' }
  ];
  
  for (const service of services) {
    const result = await checkService(service.name, service.url);
    console.log(`${result.status} ${result.name}: ${result.code || result.error}`);
  }
  
  console.log('\n🎯 Health check complete!');
}

runHealthCheck().catch(console.error); 