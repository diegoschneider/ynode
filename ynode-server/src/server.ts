import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

import { config } from './config';
import {
  setupWebSocket,
  broadcastNodeStart,
  broadcastNodeComplete,
  broadcastNodeSkip,
  broadcastLog,
  broadcastWorkflowComplete,
} from './websocket/handler';
import {
  authMiddleware,
  registerUser,
  loginUser,
  changePassword,
  setAuthDatabase,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
} from './middleware/auth';
import {
  rateLimiter,
  globalRateLimiter,
  RateLimitTiers,
} from './middleware/rateLimit';
import { applySecurityMiddleware } from './middleware/security';
import {
  validate,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from './validation/schemas';
import { auditService, AuditAction } from './services/auditService';
import {
  db,
  getWorkflowsByUserId,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  createExecution,
  updateExecution,
  getExecutionsByWorkflowId,
  getRecentExecutionsByUserId,
  getExecutionById,
  incrementUserExecutions,
} from './db';
import {
  createCredential,
  getCredentialsByUserId,
  deleteCredential,
} from './db/credentials.js';
import { executeWorkflow } from './executor/index.js';
import {
  registerBuiltinNodes,
  serializeNodeTypes,
  pluginManager,
} from '@ynode/core';
import { loadIntegrationNodes } from './nodes/loader.js';

registerBuiltinNodes();

// Async initialization
(async () => {
  await loadIntegrationNodes();

  interface WorkflowRow {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    nodes: string;
    edges: string;
    settings: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
  }

  interface ExecutionRow {
    id: string;
    workflow_id: string;
    user_id: string;
    status: string;
    trigger_type: string;
    logs: string | null;
    error_message: string | null;
    duration_ms: number | null;
    started_at: string;
    completed_at: string | null;
  }

  interface WorkflowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }

  interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }

  function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
  }

  const app = express();
  const server = createServer(app);

  setAuthDatabase(db);

  setupWebSocket(server);

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Request-ID',
      ],
    })
  );

  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  applySecurityMiddleware(app);

  app.use(globalRateLimiter(200, 60000));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      security: 'enhanced',
    });
  });

  /**
   * GET /api/node-types
   * Returns all registered node definitions for the frontend.
   * This includes built-in nodes and any loaded community plugins.
   * No authentication required - nodes are public metadata.
   */
  app.get('/api/node-types', (_req, res) => {
    try {
      const response = serializeNodeTypes('2.1.0');
      res.json(response);
    } catch (error) {
      console.error('GET /api/node-types error:', error);
      res.status(500).json({ error: 'Failed to fetch node types' });
    }
  });

  /**
   * GET /api/plugins
   * Returns metadata for all loaded community plugins.
   * No authentication required.
   */
  app.get('/api/plugins', (_req, res) => {
    try {
      const plugins = pluginManager.getMetadata();
      res.json({ plugins, count: plugins.length });
    } catch (error) {
      console.error('GET /api/plugins error:', error);
      res.status(500).json({ error: 'Failed to fetch plugins' });
    }
  });

  /**
   * POST /api/plugins/load
   * Load a community plugin by npm package name.
   * Requires authentication (admin only in production).
   */
  app.post('/api/plugins/load', authMiddleware, async (req, res) => {
    try {
      const { packageName } = req.body;

      if (!packageName || typeof packageName !== 'string') {
        return res.status(400).json({ error: 'Package name is required' });
      }

      if (pluginManager.has(packageName)) {
        return res
          .status(409)
          .json({ error: `Plugin "${packageName}" is already loaded` });
      }

      const plugin = await pluginManager.load(packageName);

      res.status(201).json({
        message: `Plugin "${plugin.manifest.name}" loaded successfully`,
        plugin: {
          name: plugin.manifest.name,
          version: plugin.manifest.version,
          nodeCount: plugin.nodes.length,
          nodeTypes: plugin.nodes.map((n) => n.type),
        },
      });
    } catch (error) {
      console.error('POST /api/plugins/load error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to load plugin';
      res.status(500).json({ error: message });
    }
  });

  app.post(
    '/api/auth/register',
    rateLimiter(RateLimitTiers.AUTH_REGISTER),
    validate(registerSchema),
    async (req, res) => {
      try {
        const { email, password, name } = req.body;
        const result = await registerUser(email, password, name, req);
        res.status(201).json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({ error: message });
      }
    }
  );

  app.post(
    '/api/auth/login',
    rateLimiter(RateLimitTiers.AUTH_LOGIN),
    validate(loginSchema),
    async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await loginUser(email, password, req);
        res.json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ error: message });
      }
    }
  );

  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    if (req.sessionId) {
      revokeSession(req.sessionId, 'user_logout');
      auditService.log(AuditAction.LOGOUT, { userId: req.userId, req });
    }
    res.json({ message: 'Logged out successfully' });
  });

  app.post(
    '/api/auth/change-password',
    authMiddleware,
    validate(changePasswordSchema),
    async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        await changePassword(req.userId!, currentPassword, newPassword, req);
        res.json({ message: 'Password changed successfully' });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Password change failed';
        res.status(400).json({ error: message });
      }
    }
  );

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/sessions', authMiddleware, (req, res) => {
    const sessions = getUserSessions(req.userId!);
    res.json(
      sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        createdAt: s.created_at,
        lastActiveAt: s.last_active_at,
        current: s.id === req.sessionId,
      }))
    );
  });

  app.delete('/api/sessions/:id', authMiddleware, (req, res) => {
    const sessionId = getParam(req.params.id);
    revokeSession(sessionId, 'user_revoked');
    auditService.log(AuditAction.SESSION_REVOKED, {
      userId: req.userId,
      req,
      resourceType: 'session',
      resourceId: sessionId,
    });
    res.json({ message: 'Session revoked' });
  });

  app.delete('/api/sessions', authMiddleware, (req, res) => {
    const count = revokeAllUserSessions(req.userId!, 'user_revoked_all');
    auditService.log(AuditAction.ALL_SESSIONS_REVOKED, {
      userId: req.userId,
      req,
    });
    res.json({ message: `${count} sessions revoked` });
  });

  function rowToApiWorkflow(row: WorkflowRow) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      nodes: JSON.parse(row.nodes),
      edges: JSON.parse(row.edges),
      settings: row.settings ? JSON.parse(row.settings) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function rowToApiExecution(row: ExecutionRow) {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      status: row.status,
      triggerType: row.trigger_type,
      logs: row.logs ? JSON.parse(row.logs) : [],
      errorMessage: row.error_message,
      durationMs: row.duration_ms,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }

  app.get('/api/workflows', authMiddleware, (req, res) => {
    try {
      const rows = getWorkflowsByUserId(req.userId!) as WorkflowRow[];
      const workflows = rows.map(rowToApiWorkflow);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  });

  app.get('/api/workflows/:id', authMiddleware, (req, res) => {
    try {
      const workflowId = getParam(req.params.id);
      const row = getWorkflowById(workflowId) as WorkflowRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      if (row.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json(rowToApiWorkflow(row));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workflow' });
    }
  });

  app.post(
    '/api/workflows',
    authMiddleware,
    rateLimiter(RateLimitTiers.API_WORKFLOW_CREATE),
    async (req, res) => {
      try {
        const { name, description, nodes, edges, settings } = req.body;
        const id = uuidv4();

        createWorkflow({
          id,
          user_id: req.userId!,
          name: name || 'Untitled Workflow',
          description,
          nodes: JSON.stringify(nodes || []),
          edges: JSON.stringify(edges || []),
          settings: settings ? JSON.stringify(settings) : null,
        });

        auditService.log(AuditAction.WORKFLOW_CREATED, {
          userId: req.userId,
          req,
          resourceType: 'workflow',
          resourceId: id,
        });

        const row = getWorkflowById(id) as WorkflowRow;
        res.status(201).json(rowToApiWorkflow(row));
      } catch (error) {
        res.status(500).json({ error: 'Failed to create workflow' });
      }
    }
  );

  app.put('/api/workflows/:id', authMiddleware, async (req, res) => {
    try {
      const workflowId = getParam(req.params.id);
      const row = getWorkflowById(workflowId) as WorkflowRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      if (row.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { name, description, nodes, edges, settings } = req.body;

      updateWorkflow(workflowId, {
        name: name ?? row.name,
        description: description ?? row.description,
        nodes: nodes ? JSON.stringify(nodes) : row.nodes,
        edges: edges ? JSON.stringify(edges) : row.edges,
        settings: settings ? JSON.stringify(settings) : row.settings,
      });

      auditService.log(AuditAction.WORKFLOW_UPDATED, {
        userId: req.userId,
        req,
        resourceType: 'workflow',
        resourceId: workflowId,
      });

      const updated = getWorkflowById(workflowId) as WorkflowRow;
      res.json(rowToApiWorkflow(updated));
    } catch (error) {
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  });

  app.delete('/api/workflows/:id', authMiddleware, (req, res) => {
    try {
      const workflowId = getParam(req.params.id);
      const row = getWorkflowById(workflowId) as WorkflowRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      if (row.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      deleteWorkflow(workflowId);

      auditService.log(AuditAction.WORKFLOW_DELETED, {
        userId: req.userId,
        req,
        resourceType: 'workflow',
        resourceId: workflowId,
      });

      res.json({ message: 'Workflow deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete workflow' });
    }
  });

  app.post(
    '/api/workflows/:id/run',
    authMiddleware,
    rateLimiter(RateLimitTiers.API_WORKFLOW_EXECUTE),
    async (req, res) => {
      try {
        const workflowId = getParam(req.params.id);
        const workflowRow = getWorkflowById(workflowId) as
          | WorkflowRow
          | undefined;

        if (!workflowRow) {
          return res.status(404).json({ error: 'Workflow not found' });
        }

        if (workflowRow.user_id !== req.userId) {
          return res.status(403).json({ error: 'Not authorized' });
        }

        const executionId = uuidv4();
        const startTime = Date.now();

        createExecution({
          id: executionId,
          workflow_id: workflowId,
          user_id: req.userId!,
          status: 'running',
          trigger_type: 'manual',
        });

        incrementUserExecutions(req.userId!);

        const nodes = JSON.parse(workflowRow.nodes);
        const edges = JSON.parse(workflowRow.edges);

        auditService.log(AuditAction.WORKFLOW_EXECUTED, {
          userId: req.userId,
          req,
          resourceType: 'workflow',
          resourceId: workflowId,
          metadata: { executionId },
        });

        const result = await executeWorkflow(
          nodes,
          edges,
          {
            onNodeStart: (nodeId: string) =>
              broadcastNodeStart(workflowRow.id, nodeId),
            onNodeComplete: (nodeId: string, success: boolean) =>
              broadcastNodeComplete(workflowRow.id, nodeId, success),
            onNodeSkip: (nodeId: string) =>
              broadcastNodeSkip(workflowRow.id, nodeId),
            onLog: (log: any) => broadcastLog(workflowRow.id, log),
          },
          req.body?.inputData || {},
          {
            workflowId,
            userId: req.userId!,
            executionId,
          }
        );

        const durationMs = Date.now() - startTime;
        const isSuccess = result.status === 'success';

        updateExecution(executionId, {
          status: isSuccess ? 'success' : 'error',
          logs: JSON.stringify(result.logs),
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        });

        broadcastWorkflowComplete(
          workflowRow.id,
          isSuccess ? 'success' : 'error'
        );

        res.json({
          executionId,
          success: isSuccess,
          logs: result.logs,
          durationMs,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Execution failed';
        res.status(500).json({ error: message });
      }
    }
  );

  app.get('/api/executions', authMiddleware, (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const rows = getRecentExecutionsByUserId(
        req.userId!,
        limit
      ) as (ExecutionRow & {
        workflow_name: string;
      })[];

      const executions = rows.map((row) => ({
        ...rowToApiExecution(row),
        workflowName: row.workflow_name,
      }));

      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch executions' });
    }
  });

  app.get('/api/workflows/:id/executions', authMiddleware, (req, res) => {
    try {
      const workflowId = getParam(req.params.id);
      const workflowRow = getWorkflowById(workflowId) as WorkflowRow | undefined;

      if (!workflowRow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      if (workflowRow.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const rows = getExecutionsByWorkflowId(workflowId, limit) as ExecutionRow[];

      res.json(rows.map(rowToApiExecution));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch executions' });
    }
  });

  app.get('/api/executions/:id', authMiddleware, (req, res) => {
    try {
      const executionId = getParam(req.params.id);
      const row = getExecutionById(executionId) as ExecutionRow | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (row.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json(rowToApiExecution(row));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch execution' });
    }
  });

  app.all(
    '/webhook/:workflowId{/:webhookPath}',
    rateLimiter(RateLimitTiers.WEBHOOK_INCOMING),
    async (req, res) => {
      try {
        const workflowId = getParam(req.params.workflowId);
        const webhookPath = getParam(req.params.webhookPath);
        const workflowRow = getWorkflowById(workflowId) as
          | WorkflowRow
          | undefined;

        if (!workflowRow) {
          return res.status(404).json({ error: 'Webhook not found' });
        }

        const executionId = uuidv4();

        createExecution({
          id: executionId,
          workflow_id: workflowId,
          user_id: workflowRow.user_id,
          status: 'running',
          trigger_type: 'webhook',
        });

        incrementUserExecutions(workflowRow.user_id);

        const nodes = JSON.parse(workflowRow.nodes);
        const edges = JSON.parse(workflowRow.edges);

        const inputData = {
          webhook: {
            method: req.method,
            path: webhookPath,
            query: req.query,
            headers: req.headers,
            body: req.body,
          },
        };

        auditService.log(AuditAction.WEBHOOK_TRIGGERED, {
          userId: workflowRow.user_id,
          req,
          resourceType: 'workflow',
          resourceId: workflowId,
          metadata: { executionId, path: webhookPath },
        });

        const result = await executeWorkflow(
          nodes,
          edges,
          {
            onNodeStart: (nodeId: string) =>
              broadcastNodeStart(workflowId, nodeId),
            onNodeComplete: (nodeId: string, success: boolean) =>
              broadcastNodeComplete(workflowId, nodeId, success),
            onNodeSkip: (nodeId: string) => broadcastNodeSkip(workflowId, nodeId),
            onLog: (log: any) => broadcastLog(workflowId, log),
          },
          inputData,
          {
            workflowId,
            userId: workflowRow.user_id,
            executionId,
          }
        );

        const isSuccess = result.status === 'success';

        updateExecution(executionId, {
          status: isSuccess ? 'success' : 'error',
          logs: JSON.stringify(result.logs),
          completed_at: new Date().toISOString(),
        });

        broadcastWorkflowComplete(workflowId, isSuccess ? 'success' : 'error');

        res.json({
          success: isSuccess,
          executionId,
        });
      } catch (error) {
        res.status(500).json({ error: 'Webhook execution failed' });
      }
    }
  );

  app.get('/api/credentials', authMiddleware, (req, res) => {
    try {
      const credentials = getCredentialsByUserId(req.userId!);
      res.json(credentials);
    } catch (error) {
      console.error('GET /api/credentials error:', error);
      res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  });

  app.post('/api/credentials', authMiddleware, (req, res) => {
    try {
      const { name, type, data } = req.body;
      if (!name || !type || !data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const credential = createCredential(req.userId!, { name, type, data });
      const { encrypted_data, ...safeCredential } = credential;

      auditService.log(AuditAction.CREDENTIAL_CREATED, {
        userId: req.userId,
        req,
        resourceType: 'credential',
        resourceId: credential.id,
      });

      res.json(safeCredential);
    } catch (error) {
      console.error('POST /api/credentials error:', error);
      res.status(500).json({ error: 'Failed to create credential' });
    }
  });

  app.delete('/api/credentials/:id', authMiddleware, (req, res) => {
    try {
      const id = getParam(req.params.id);
      const success = deleteCredential(id, req.userId!);

      if (!success) {
        return res.status(404).json({ error: 'Credential not found' });
      }

      auditService.log(AuditAction.CREDENTIAL_DELETED, {
        userId: req.userId,
        req,
        resourceType: 'credential',
        resourceId: id,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete credential' });
    }
  });

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('Server error:', err);

      const message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message;

      res.status(500).json({ error: message });
    }
  );

  server.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  ynode server                                              ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${config.port}                                                ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

})();
