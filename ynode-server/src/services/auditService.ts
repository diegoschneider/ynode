import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';

export enum AuditAction {
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  REGISTER = 'auth.register',
  PASSWORD_CHANGED = 'auth.password.changed',
  PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password.reset.complete',

  ACCOUNT_LOCKED = 'security.account.locked',
  ACCOUNT_UNLOCKED = 'security.account.unlocked',
  SESSION_CREATED = 'security.session.created',
  SESSION_REVOKED = 'security.session.revoked',
  ALL_SESSIONS_REVOKED = 'security.sessions.all_revoked',

  WORKFLOW_CREATED = 'workflow.created',
  WORKFLOW_UPDATED = 'workflow.updated',
  WORKFLOW_DELETED = 'workflow.deleted',
  WORKFLOW_EXECUTED = 'workflow.executed',

  WEBHOOK_CREATED = 'webhook.created',
  WEBHOOK_TRIGGERED = 'webhook.triggered',
  WEBHOOK_DELETED = 'webhook.deleted',

  USER_DELETED = 'admin.user.deleted',
  PERMISSIONS_CHANGED = 'admin.permissions.changed',

  CREDENTIAL_CREATED = 'credential.created',
  CREDENTIAL_UPDATED = 'credential.updated',
  CREDENTIAL_DELETED = 'credential.deleted',

  SUSPICIOUS_ACTIVITY = 'security.suspicious',
  RATE_LIMITED = 'security.rate_limited',
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  sessionId: string | null;
  action: AuditAction;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

let dbInstance: any = null;

export function setAuditDatabase(db: any): void {
  dbInstance = db;
}

export const auditService = {
  log(
    action: AuditAction,
    options: {
      userId?: string | null;
      sessionId?: string | null;
      resourceType?: string;
      resourceId?: string;
      req?: Request;
      statusCode?: number;
      errorMessage?: string;
      changes?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    if (!dbInstance) {
      console.warn('Audit database not initialized');
      return;
    }

    const entry: AuditLogEntry = {
      id: uuidv4(),
      userId: options.userId ?? null,
      sessionId: options.sessionId ?? null,
      action,
      resourceType: options.resourceType ?? null,
      resourceId: options.resourceId ?? null,
      ipAddress: options.req ? getClientIp(options.req) : null,
      userAgent: options.req?.headers['user-agent'] ?? null,
      requestMethod: options.req?.method ?? null,
      requestPath: options.req?.path ?? null,
      statusCode: options.statusCode ?? null,
      errorMessage: options.errorMessage ?? null,
      changes: options.changes ?? null,
      metadata: options.metadata ?? null,
      createdAt: new Date().toISOString(),
    };

    try {
      dbInstance
        .prepare(
          `
                INSERT INTO audit_logs (
                    id, user_id, session_id, action, resource_type, resource_id,
                    ip_address, user_agent, request_method, request_path,
                    status_code, error_message, changes, metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        )
        .run(
          entry.id,
          entry.userId,
          entry.sessionId,
          entry.action,
          entry.resourceType,
          entry.resourceId,
          entry.ipAddress,
          entry.userAgent,
          entry.requestMethod,
          entry.requestPath,
          entry.statusCode,
          entry.errorMessage,
          entry.changes ? JSON.stringify(entry.changes) : null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.createdAt
        );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  },

  getLogsForUser(userId: string, limit = 100): AuditLogEntry[] {
    if (!dbInstance) return [];

    return dbInstance
      .prepare(
        `
            SELECT * FROM audit_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `
      )
      .all(userId, limit);
  },

  getSecurityEvents(limit = 100): AuditLogEntry[] {
    if (!dbInstance) return [];

    return dbInstance
      .prepare(
        `
            SELECT * FROM audit_logs 
            WHERE action LIKE 'security.%' OR action LIKE 'auth.%'
            ORDER BY created_at DESC 
            LIMIT ?
        `
      )
      .all(limit);
  },

  getLogsByIp(ipAddress: string, limit = 100): AuditLogEntry[] {
    if (!dbInstance) return [];

    return dbInstance
      .prepare(
        `
            SELECT * FROM audit_logs 
            WHERE ip_address = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `
      )
      .all(ipAddress, limit);
  },

  countFailedLogins(userId: string, minutes = 15): number {
    if (!dbInstance) return 0;

    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const result = dbInstance
      .prepare(
        `
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE user_id = ? 
            AND action = ? 
            AND created_at > ?
        `
      )
      .get(userId, AuditAction.LOGIN_FAILED, since) as { count: number };

    return result?.count ?? 0;
  },

  cleanup(daysToKeep = 90): number {
    if (!dbInstance) return 0;

    const cutoff = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    ).toISOString();
    const result = dbInstance
      .prepare(
        `
            DELETE FROM audit_logs WHERE created_at < ?
        `
      )
      .run(cutoff);

    return result.changes;
  },
};

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}
