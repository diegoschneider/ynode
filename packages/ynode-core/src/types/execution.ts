export interface CredentialAPI {
  get(credentialId: string): Promise<Record<string, string>>;
}

export interface MemoryAPI {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

export interface ExecutionContext<TConfig = any> {
  nodeId: string;
  config: TConfig;
  inputs: Record<string, unknown>;
  variables: Record<string, unknown>;
  log: (message: string, data?: unknown) => void;
  abortSignal?: AbortSignal;

  // Framework API
  credentials: CredentialAPI;
  memory: MemoryAPI;
  workflowMemory: MemoryAPI;
  workflowId: string;
  executionId: string;
}

export interface NodeOutput {
  data: Record<string, unknown>;
  branch?: string;
  error?: Error;
}

export type WorkflowStatus = 'running' | 'success' | 'error' | 'pending';
export type NodeStatus =
  | 'running'
  | 'success'
  | 'error'
  | 'pending'
  | 'skipped';

export interface ExecutionLog {
  id: string;
  nodeId: string;
  nodeName: string;
  status: NodeStatus;
  message: string;
  data?: unknown;
  timestamp: string;
}

export interface NodeExecutionState {
  nodeId: string;
  status: NodeStatus;
  startedAt?: string;
  completedAt?: string;
  output?: NodeOutput;
  error?: string;
}

export interface WorkflowExecutionState {
  executionId: string;
  workflowId: string;
  status: WorkflowStatus;
  nodes: Record<string, NodeExecutionState>;
  startedAt: string;
  completedAt?: string;
}
