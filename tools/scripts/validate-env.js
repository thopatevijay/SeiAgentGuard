#!/usr/bin/env node
require('dotenv').config();

const requiredVars = {
  'PHASE_1': ['NODE_ENV', 'PORT', 'API_PORT'],
  'PHASE_2': ['NODE_ENV', 'PORT', 'API_PORT', 'REDIS_URL'],
  'PHASE_3': ['NODE_ENV', 'PORT', 'API_PORT', 'REDIS_URL', 'SEI_RPC_URL', 'SEI_PRIVATE_KEY'],
  'PHASE_4': ['NODE_ENV', 'PORT', 'API_PORT', 'REDIS_URL', 'SEI_RPC_URL', 'SEI_PRIVATE_KEY', 'AWS_ACCESS_KEY_ID']
};

const currentPhase = process.env.DEVELOPMENT_PHASE || 'PHASE_1';
const required = requiredVars[currentPhase] || requiredVars['PHASE_1'];

console.log(`🔍 Validating environment for ${currentPhase}`);
console.log('='.repeat(40));

let allValid = true;
required.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allValid = false;
  }
});

if (allValid) {
  console.log('\n🎉 Environment validation successful!');
  process.exit(0);
} else {
  console.log('\n❌ Environment validation failed. Please check your .env file.');
  process.exit(1);
} 