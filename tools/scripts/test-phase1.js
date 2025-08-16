#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
require('dotenv').config();

async function testPhase1() {
  console.log('🧪 Phase 1 Validation Tests');
  console.log('='.repeat(40));
  
  // Test 1: Environment validation
  console.log('Testing environment configuration...');
  const requiredVars = ['NODE_ENV', 'PORT', 'API_PORT'];
  let envValid = true;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`❌ Missing ${varName}`);
      envValid = false;
    } else {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    }
  });
  
  if (!envValid) {
    console.log('❌ Environment validation failed');
    return;
  }
  
  console.log('✅ Environment validation passed');
  
  // Test 2: Start core service
  console.log('\nTesting core service...');
  const coreProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: './packages/core',
    stdio: 'pipe'
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const coreResponse = await makeRequest('http://localhost:3002/health');
    if (coreResponse.status === 200) {
      console.log('✅ Core service health check passed');
    } else {
      console.log('❌ Core service health check failed');
    }
  } catch (error) {
    console.log('❌ Core service not responding');
  }
  
  coreProcess.kill();
  
  // Test 3: Start API service
  console.log('\nTesting API service...');
  const apiProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: './apps/api',
    stdio: 'pipe'
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const apiResponse = await makeRequest('http://localhost:3001/health');
    if (apiResponse.status === 200) {
      console.log('✅ API service health check passed');
    } else {
      console.log('❌ API service health check failed');
    }
  } catch (error) {
    console.log('❌ API service not responding');
  }
  
  apiProcess.kill();
  
  // Test 4: Security analysis endpoint
  console.log('\nTesting security analysis endpoint...');
  try {
    const securityResponse = await makeRequest('http://localhost:3001/api/v1/security/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'test',
        prompt: 'Hello world',
        timestamp: Date.now()
      })
    });
    
    if (securityResponse.status === 200) {
      console.log('✅ Security analysis endpoint working');
    } else {
      console.log('❌ Security analysis endpoint failed');
    }
  } catch (error) {
    console.log('❌ Security analysis endpoint not responding');
  }
  
  console.log('\n🎯 Phase 1 validation complete!');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

testPhase1().catch(console.error); 