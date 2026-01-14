import type { Request, Response, NextFunction } from 'express';
import { auditService, AuditAction } from '../services/auditService';

interface RateLimitTier {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMITS: Record<string, RateLimitTier> = {
  'auth:login': {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  'auth:register': {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many registration attempts. Please try again later.',
  },
  'auth:password-reset': {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset requests.',
  },

  'api:general': {
    windowMs: 60 * 1000,
    max: 100,
    skipSuccessfulRequests: false,
  },
  'api:workflow-create': {
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many workflows created. Please slow down.',
  },
  'api:workflow-execute': {
    windowMs: 60 * 1000,
    max: 20,
    message: 'Execution rate limit exceeded.',
  },

  'webhook:incoming': {
    windowMs: 60 * 1000,
    max: 1000,
    message: 'Webhook rate limit exceeded.',
  },
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(tier: string): Map<string, RateLimitEntry> {
  if (!stores.has(tier)) {
    stores.set(tier, new Map());
  }
  return stores.get(tier)!;
}

setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }
}, 60 * 1000);

function getClientIdentifier(req: Request): string {
  const ip = getClientIp(req);
  const userId = req.userId || 'anonymous';
  return `${ip}:${userId}`;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(
  identifier: string,
  tier: string,
  config: RateLimitTier
): { allowed: boolean; remaining: number; resetAt: number } {
  const store = getStore(tier);
  const now = Date.now();

  let entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.max - entry.count);
  const allowed = entry.count < config.max;

  if (allowed) {
    entry.count++;
    store.set(identifier, entry);
  }

  return { allowed, remaining, resetAt: entry.resetAt };
}

export function rateLimiter(tier: string) {
  const config = RATE_LIMITS[tier];

  if (!config) {
    console.warn(`Unknown rate limit tier: ${tier}`);
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = getClientIdentifier(req);
    const { allowed, remaining, resetAt } = checkRateLimit(
      identifier,
      tier,
      config
    );

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

    if (!allowed) {
      auditService.log(AuditAction.RATE_LIMITED, {
        userId: req.userId,
        req,
        metadata: { tier, identifier },
      });

      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        error: config.message || 'Too many requests',
        retryAfter,
      });
      return;
    }

    next();
  };
}

export function globalRateLimiter(max = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = getClientIp(req);
    const { allowed, remaining, resetAt } = checkRateLimit(
      identifier,
      'global',
      { max, windowMs }
    );

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
      return;
    }

    next();
  };
}

export const RateLimitTiers = {
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',
  AUTH_PASSWORD_RESET: 'auth:password-reset',
  API_GENERAL: 'api:general',
  API_WORKFLOW_CREATE: 'api:workflow-create',
  API_WORKFLOW_EXECUTE: 'api:workflow-execute',
  WEBHOOK_INCOMING: 'webhook:incoming',
} as const;
