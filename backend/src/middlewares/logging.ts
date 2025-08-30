import { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  userId?: number | undefined;
  userName?: string | undefined;
  latency?: number | undefined;
  statusCode?: number | undefined;
  userAgent?: string | undefined;
  ip: string;
  errorMessage?: string | undefined;
  errorStack?: string | undefined;
  requestBody?: any;
  responseBody?: any;
}

export class Logger {
  private static formatLogEntry(entry: LogEntry): string {
    // Structured JSON logging - perfect for Loki/Grafana future integration
    return JSON.stringify({
      ...entry,
      timestamp: entry.timestamp,
      service: 'sprintsync-backend',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  static info(entry: Omit<LogEntry, 'level' | 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      level: 'info',
      timestamp: new Date().toISOString()
    };
    console.log(this.formatLogEntry(logEntry));
  }

  static warn(entry: Omit<LogEntry, 'level' | 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      level: 'warn', 
      timestamp: new Date().toISOString()
    };
    console.warn(this.formatLogEntry(logEntry));
  }

  static error(entry: Omit<LogEntry, 'level' | 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      level: 'error',
      timestamp: new Date().toISOString()
    };
    console.error(this.formatLogEntry(logEntry));
  }
}

export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json;
  
  // Override res.json to capture response completion
  res.json = function(body?: any): Response {
    const latency = Date.now() - startTime;
    
    // Log the request completion
    Logger.info({
      method: req.method,
      path: req.path,
      userId: req.user?.userId || undefined,
      userName: req.user?.username || undefined,
      latency,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent') || undefined,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      // Only log request body for non-sensitive endpoints and if small
      requestBody: shouldLogRequestBody(req) ? truncateObject(req.body) : undefined
    });
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
};

export const errorLoggingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  Logger.error({
    method: req.method,
    path: req.path,
    userId: req.user?.userId || undefined,
    userName: req.user?.username || undefined,
    statusCode: res.statusCode || 500,
    userAgent: req.get('User-Agent') || undefined,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    errorMessage: error.message,
    errorStack: error.stack || undefined,
    requestBody: shouldLogRequestBody(req) ? truncateObject(req.body) : undefined
  });
  
  next(error);
};

// Helper functions
function shouldLogRequestBody(req: Request): boolean {
  // Don't log sensitive endpoints
  if (req.path.includes('/auth') && req.method === 'POST') {
    return false;
  }
  
  // Only log if body is reasonably small
  const bodySize = JSON.stringify(req.body || {}).length;
  return bodySize < 1000;
}

function truncateObject(obj: any, maxLength: number = 500): any {
  if (!obj) return obj;
  
  const str = JSON.stringify(obj);
  if (str.length <= maxLength) return obj;
  
  return {
    _truncated: true,
    _originalLength: str.length,
    data: str.substring(0, maxLength) + '...'
  };
}
