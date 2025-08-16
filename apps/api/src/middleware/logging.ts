import { Request, Response, NextFunction } from 'express';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} (${duration}ms)`);
    
    return originalEnd.call(this, chunk, encoding);
  };

  next();
} 