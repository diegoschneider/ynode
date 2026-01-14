import helmet from 'helmet';
import hpp from 'hpp';
import type { Express, Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", isDev ? "'unsafe-inline'" : ''],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isDev ? null : [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const hppMiddleware = hpp({
  whitelist: ['tags', 'fields'],
});

export function sanitizeRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.query[key] = value.replace(/\$|\{|\}/g, '').slice(0, 1000);
      }
    }
  }
  next();
}

function getDepth(obj: unknown, currentDepth = 0): number {
  if (currentDepth > 20) return currentDepth;
  if (typeof obj !== 'object' || obj === null) return currentDepth;

  let maxDepth = currentDepth;
  for (const value of Object.values(obj)) {
    const depth = getDepth(value, currentDepth + 1);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

export function jsonDepthLimit(maxDepth = 10) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      const depth = getDepth(req.body);
      if (depth > maxDepth) {
        res.status(400).json({
          error: 'Request body too deeply nested',
          maxDepth,
        });
        return;
      }
    }
    next();
  };
}

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

export function additionalSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
}

export function applySecurityMiddleware(app: Express): void {
  app.use(requestId);
  app.use(helmetMiddleware);
  app.use(hppMiddleware);
  app.use(sanitizeRequest);
  app.use(jsonDepthLimit(10));
  app.use(additionalSecurityHeaders);
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
