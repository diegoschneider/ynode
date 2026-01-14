// Re-export core types from @ynode/core
export type {
  NodeData,
  NodeStatus,
  WorkflowStatus,
  ExecutionLog,
  NodeOutput,
  ExecutionContext,
} from '@ynode/core';

// Server-specific types

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: string;
    config: Record<string, unknown>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export type TriggerType = 'manual' | 'webhook' | 'schedule';

export interface ExecutionResult {
  status: 'running' | 'success' | 'error';
  logs: import('@ynode/core').ExecutionLog[];
  startedAt: string;
  completedAt: string;
}

// Database row types

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  executions_this_month: number;
  last_reset_at: string;
  created_at: string;
}

export interface WorkflowRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: string;
  edges: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ExecutionRow {
  id: string;
  workflow_id: string;
  user_id: string;
  status: 'running' | 'success' | 'error';
  logs: string;
  trigger_type: TriggerType;
  started_at: string;
  completed_at: string | null;
}

export interface WebhookRow {
  id: string;
  workflow_id: string;
  path: string;
  method: string;
  created_at: string;
}

export interface ScheduleRow {
  id: string;
  workflow_id: string;
  cron_expression: string;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  is_active: number;
}

// API response types

export interface ApiWorkflow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error';
  logs: import('@ynode/core').ExecutionLog[];
  triggerType: TriggerType;
  startedAt: string;
  completedAt: string | null;
}

export interface ApiUser {
  id: string;
  email: string;
  executionsThisMonth: number;
  createdAt: string;
}

// WebSocket message types

export type WsClientMessage =
  | { type: 'subscribe'; workflowId: string }
  | { type: 'unsubscribe'; workflowId: string }
  | {
      type: 'workflow:create';
      requestId: string;
      name: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    }
  | {
      type: 'workflow:update';
      requestId: string;
      workflowId: string;
      name: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    };

export type WsServerMessage =
  | { type: 'node:start'; workflowId: string; nodeId: string }
  | {
      type: 'node:complete';
      workflowId: string;
      nodeId: string;
      success: boolean;
    }
  | { type: 'node:skip'; workflowId: string; nodeId: string }
  | {
      type: 'workflow:complete';
      workflowId: string;
      status: 'running' | 'success' | 'error';
    }
  | { type: 'log'; workflowId: string; log: import('@ynode/core').ExecutionLog }
  | { type: 'error'; message: string }
  | {
      type: 'workflow:saved';
      requestId: string;
      workflow: ApiWorkflow;
      isNew: boolean;
    }
  | { type: 'workflow:save_error'; requestId: string; message: string };
