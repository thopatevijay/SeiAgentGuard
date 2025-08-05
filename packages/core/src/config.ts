import dotenv from 'dotenv';
import { AppConfig } from './types';
import { join } from 'path';

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  testMode: process.env.TEST_MODE === 'true'
};

export function validateConfig(): void {
  const required = ['NODE_ENV', 'PORT', 'API_PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 