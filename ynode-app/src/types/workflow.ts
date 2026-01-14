import type { NodeData } from '@ynode/core';

export type { NodeData } from '@ynode/core';

export interface WorkflowNode<TConfig = Record<string, unknown>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData<TConfig>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  nodeId: string;
  nodeName: string;
  status: 'running' | 'success' | 'error';
  message: string;
  data?: unknown;
  details?: unknown;
  timestamp: string;
}

export interface ExecutionResult {
  workflowId: string;
  status: 'running' | 'success' | 'error';
  logs: ExecutionLog[];
  startedAt: string;
  completedAt?: string;
}

export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface CodeConfig {
  code: string;
  language?: 'javascript';
}

export interface SetConfig {
  values: Record<string, unknown>;
  mode?: 'set' | 'merge';
}

export interface IfElseConfig {
  condition: string;
}

export interface TriggerConfig {
  triggerType: 'manual' | 'scheduled' | 'webhook';
  description?: string;
}
