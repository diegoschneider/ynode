import { v4 as uuidv4 } from 'uuid';
import type {
  WorkflowNode,
  WorkflowEdge,
  ExecutionLog,
  ExecutionContext,
  NodeOutput,
  WorkflowStatus,
} from '../types';
import { getDecryptedCredential } from '../db/credentials.js';
import { createMemoryAPI } from '../db/memory.js';
import { getNodeExecutor } from './nodes';
import { config } from '../config';

type LogCallback = (log: ExecutionLog) => void;
type NodeStartCallback = (nodeId: string) => void;
type NodeCompleteCallback = (nodeId: string, success: boolean) => void;
type NodeSkipCallback = (nodeId: string) => void;

export interface ExecutionCallbacks {
  onLog: LogCallback;
  onNodeStart?: NodeStartCallback;
  onNodeComplete?: NodeCompleteCallback;
  onNodeSkip?: NodeSkipCallback;
}

export interface ExecutionResult {
  status: WorkflowStatus;
  logs: ExecutionLog[];
  startedAt: string;
  completedAt: string;
}

function findConnectedNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Set<string> {
  const connected = new Set<string>();

  edges.forEach((edge) => {
    connected.add(edge.source);
    connected.add(edge.target);
  });

  return connected;
}

function topologicalSort(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find((n) => n.id === nodeId);
    if (node) sorted.push(node);

    adjacency.get(nodeId)?.forEach((targetId) => {
      const newDegree = (inDegree.get(targetId) || 0) - 1;
      inDegree.set(targetId, newDegree);
      if (newDegree === 0) queue.push(targetId);
    });
  }

  return sorted;
}

function findDownstreamNodes(
  startNodeId: string,
  edges: WorkflowEdge[]
): Set<string> {
  const downstream = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (downstream.has(nodeId)) continue;
    downstream.add(nodeId);

    edges
      .filter((e) => e.source === nodeId)
      .forEach((edge) => {
        if (!downstream.has(edge.target)) {
          queue.push(edge.target);
        }
      });
  }

  return downstream;
}

async function executeNode(
  node: WorkflowNode,
  inputs: Record<string, unknown>,
  variables: Record<string, unknown>,
  callbacks: ExecutionCallbacks,
  frameworkContext: {
    workflowId: string;
    executionId: string;
    userId: string;
  },
  abortSignal?: AbortSignal
): Promise<NodeOutput> {
  const timestamp = new Date().toISOString();
  const logs: ExecutionLog[] = [];

  // Create framework APIs
  const credentialsAPI = {
    get: async (credentialId: string): Promise<Record<string, string>> => {
      const cred = getDecryptedCredential(
        credentialId,
        frameworkContext.userId
      );
      if (!cred) throw new Error(`Credential ${credentialId} not found`);
      return cred;
    },
  };

  const nodeMemory = createMemoryAPI(frameworkContext.workflowId, node.id);
  const workflowMemory = createMemoryAPI(frameworkContext.workflowId, null);

  const context: ExecutionContext = {
    nodeId: node.id,
    config: node.data.config || {},
    inputs,
    variables,
    log: (message: string, data?: unknown) => {
      const log: ExecutionLog = {
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'running',
        message,
        data,
        timestamp: new Date().toISOString(),
      };
      logs.push(log);
      callbacks.onLog(log);
    },
    abortSignal,
    // Framework APIs
    credentials: credentialsAPI,
    memory: nodeMemory,
    workflowMemory: workflowMemory,
    workflowId: frameworkContext.workflowId,
    executionId: frameworkContext.executionId,
  };

  const executor = getNodeExecutor(node.data.type);

  if (!executor) {
    const log: ExecutionLog = {
      id: uuidv4(),
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'error',
      message: `Unknown node type: ${node.data.type}`,
      timestamp,
    };
    callbacks.onLog(log);
    return {
      data: {},
      error: new Error(`Unknown node type: ${node.data.type}`),
    };
  }

  try {
    const result = await executor(context);

    const successLog: ExecutionLog = {
      id: uuidv4(),
      nodeId: node.id,
      nodeName: node.data.label,
      status: result.error ? 'error' : 'success',
      message: result.error ? result.error.message : 'Completed',
      data: result.data,
      timestamp: new Date().toISOString(),
    };
    callbacks.onLog(successLog);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorLog: ExecutionLog = {
      id: uuidv4(),
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
    callbacks.onLog(errorLog);

    return { data: {}, error: error as Error };
  }
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  callbacks: ExecutionCallbacks,
  initialInputs: Record<string, unknown> = {},
  frameworkContext: {
    workflowId: string;
    userId: string;
    executionId: string;
  }
): Promise<ExecutionResult> {
  const startedAt = new Date().toISOString();
  const logs: ExecutionLog[] = [];
  const variables: Record<string, unknown> = {};
  const abortController = new AbortController();

  const wrappedLog: LogCallback = (log) => {
    logs.push(log);
    callbacks.onLog(log);
  };

  const executableNodes = nodes.filter((node) => node.type !== 'comment');

  if (executableNodes.length === 0) {
    wrappedLog({
      id: uuidv4(),
      nodeId: 'system',
      nodeName: 'System',
      status: 'error',
      message: 'No nodes to execute',
      timestamp: startedAt,
    });
    return {
      status: 'error',
      logs,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  const connectedNodeIds = findConnectedNodes(executableNodes, edges);
  const connectedNodes = executableNodes.filter((node) =>
    connectedNodeIds.has(node.id)
  );
  const orphanNodes = executableNodes.filter(
    (node) => !connectedNodeIds.has(node.id)
  );

  if (orphanNodes.length > 0) {
    wrappedLog({
      id: uuidv4(),
      nodeId: 'system',
      nodeName: 'System',
      status: 'success',
      message: `Skipping ${orphanNodes.length} disconnected node(s): ${orphanNodes.map((n) => n.data.label).join(', ')}`,
      timestamp: startedAt,
    });
  }

  if (connectedNodes.length === 0) {
    wrappedLog({
      id: uuidv4(),
      nodeId: 'system',
      nodeName: 'System',
      status: 'error',
      message: 'No connected nodes to execute. Connect your nodes with edges.',
      timestamp: startedAt,
    });
    return {
      status: 'error',
      logs,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  wrappedLog({
    id: uuidv4(),
    nodeId: 'system',
    nodeName: 'System',
    status: 'running',
    message: 'Starting workflow execution...',
    timestamp: startedAt,
  });

  const sortedNodes = topologicalSort(connectedNodes, edges);
  const nodeOutputs = new Map<string, NodeOutput>();
  const skippedNodes = new Set<string>();

  for (const node of sortedNodes) {
    if (skippedNodes.has(node.id)) {
      callbacks.onNodeSkip?.(node.id);
      wrappedLog({
        id: uuidv4(),
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'success',
        message: 'Skipped (branch not taken)',
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    callbacks.onNodeStart?.(node.id);

    const incomingEdges = edges.filter((e) => e.target === node.id);
    let inputs: Record<string, unknown> = { ...initialInputs };

    if (incomingEdges.length > 0) {
      for (const edge of incomingEdges) {
        const sourceOutput = nodeOutputs.get(edge.source);
        if (sourceOutput) {
          const sourceHandle = edge.sourceHandle || 'default';
          const targetHandle = edge.targetHandle || 'trigger';
          const outputData =
            sourceOutput.data[sourceHandle] ?? sourceOutput.data.default ?? sourceOutput.data;

          inputs[targetHandle] = outputData;

          if (!inputs.default) {
            inputs.default = outputData;
          }

          if (typeof outputData === 'object' && outputData !== null) {
            Object.assign(inputs, outputData);
          }
        }
      }
    }

    const output = await executeNode(
      node,
      inputs,
      variables,
      { onLog: wrappedLog },
      frameworkContext,
      abortController.signal
    );
    nodeOutputs.set(node.id, output);

    await new Promise((resolve) =>
      setTimeout(resolve, config.nodeExecutionDelayMs)
    );

    if (output.branch) {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      outgoingEdges.forEach((edge) => {
        if (edge.sourceHandle && edge.sourceHandle !== output.branch) {
          const nodesToSkip = findDownstreamNodes(edge.target, edges);
          nodesToSkip.forEach((id) => skippedNodes.add(id));
        }
      });
    }

    callbacks.onNodeComplete?.(node.id, !output.error);

    if (output.error) {
      wrappedLog({
        id: uuidv4(),
        nodeId: 'system',
        nodeName: 'System',
        status: 'error',
        message: 'Workflow execution stopped due to error',
        timestamp: new Date().toISOString(),
      });
      return {
        status: 'error',
        logs,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }
  }

  wrappedLog({
    id: uuidv4(),
    nodeId: 'system',
    nodeName: 'System',
    status: 'success',
    message: 'Workflow completed successfully!',
    timestamp: new Date().toISOString(),
  });

  return {
    status: 'success',
    logs,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}
