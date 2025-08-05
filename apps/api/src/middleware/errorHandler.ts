import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('API Error:', err);

  // Default error response
  const errorResponse = {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation error';
    errorResponse.code = 'VALIDATION_ERROR';
    res.status(400);
  } else if (err.name === 'UnauthorizedError') {
    errorResponse.error = 'Unauthorized';
    errorResponse.code = 'UNAUTHORIZED';
    res.status(401);
  } else if (err.name === 'NotFoundError') {
    errorResponse.error = 'Resource not found';
    errorResponse.code = 'NOT_FOUND';
    res.status(404);
  } else {
    res.status(500);
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message || errorResponse.error;
  }

  res.json(errorResponse);
} 