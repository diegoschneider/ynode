import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { NodeData, ExecutionLog, NodeStatus } from '@ynode/core';
import { nodeRegistry, registerBuiltinNodes } from '@ynode/core';

registerBuiltinNodes();

type Connection = {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

interface ClipboardContent {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface CommentData {
  text: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

interface WorkflowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: Node<NodeData> | null;
  workflowName: string;
  workflowId: string | null;
  executionLogs: ExecutionLog[];
  isExecuting: boolean;

  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;

  clipboard: ClipboardContent | null;

  nodeExecutionStates: Map<string, NodeStatus>;
  currentExecutingNodeId: string | null;

  comments: Node<CommentData>[];

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  setSelectedNode: (node: Node<NodeData> | null) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowId: (id: string | null) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  clearExecutionLogs: () => void;
  setIsExecuting: (isExecuting: boolean) => void;
  saveWorkflow: () => void;
  loadWorkflow: () => void;
  clearWorkflow: () => void;
  deleteSelectedNodes: () => void;
  deleteEdge: (edgeId: string) => void;
  insertNodeBetweenEdge: (edgeId: string, nodeType: string) => void;

  markDirty: () => void;
  markClean: () => void;
  setSaveStatus: (
    status: 'idle' | 'saving' | 'saved' | 'error',
    error?: string
  ) => void;
  loadFromServer: (workflow: {
    id: string;
    name: string;
    nodes: Node<NodeData>[];
    edges: Edge[];
  }) => void;

  copySelectedNodes: () => void;
  pasteNodes: () => void;
  duplicateSelectedNodes: () => void;

  setNodeExecutionState: (nodeId: string, state: NodeStatus) => void;
  setCurrentExecutingNode: (nodeId: string | null) => void;
  clearExecutionStates: () => void;

  addComment: (
    position: { x: number; y: number },
    size?: { width: number; height: number }
  ) => void;
  updateComment: (commentId: string, data: Partial<CommentData>) => void;
  deleteComment: (commentId: string) => void;
}

import { useNodeTypesStore } from './nodeTypesStore';

const getDefaultNodeData = (type: string): NodeData => {
  const storeNode = useNodeTypesStore.getState().nodes.find(n => n.type === type);

  if (storeNode) {
    return {
      type: storeNode.type,
      label: storeNode.label,
      config: { ...storeNode.defaultConfig },
    };
  }

  const definition = nodeRegistry.get(type);

  if (definition) {
    return {
      type: definition.type,
      label: definition.label,
      config: { ...definition.defaultConfig },
    };
  }

  return {
    type,
    label: type,
    config: {},
  };
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowName: 'Untitled Workflow',
  workflowId: null,
  executionLogs: [],
  isExecuting: false,
  isDirty: false,
  saveStatus: 'idle',
  saveError: null,
  clipboard: null,
  nodeExecutionStates: new Map(),
  currentExecutingNodeId: null,
  comments: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<NodeData>[],
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges), isDirty: true });
  },

  onConnect: (connection) => {
    if (connection.source && connection.target) {
      set({
        edges: addEdge(
          {
            ...connection,
            id: uuidv4(),
            source: connection.source,
            target: connection.target,
          },
          get().edges
        ),
        isDirty: true,
      });
    }
  },

  addNode: (type, position) => {
    const newNode: Node<NodeData> = {
      id: uuidv4(),
      type,
      position,
      data: getDefaultNodeData(type),
    };
    set({ nodes: [...get().nodes, newNode], isDirty: true });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      selectedNode:
        get().selectedNode?.id === nodeId
          ? {
            ...get().selectedNode!,
            data: { ...get().selectedNode!.data, ...data },
          }
          : get().selectedNode,
      isDirty: true,
    });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, ...config },
            },
          }
          : node
      ),
      selectedNode:
        get().selectedNode?.id === nodeId
          ? {
            ...get().selectedNode!,
            data: {
              ...get().selectedNode!.data,
              config: { ...get().selectedNode!.data.config, ...config },
            },
          }
          : get().selectedNode,
      isDirty: true,
    });
  },

  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),

  setWorkflowId: (id) => set({ workflowId: id }),

  addExecutionLog: (log) =>
    set({ executionLogs: [...get().executionLogs, log] }),

  clearExecutionLogs: () => set({ executionLogs: [] }),

  setIsExecuting: (isExecuting) => set({ isExecuting }),

  saveWorkflow: () => {
    const { nodes, edges, workflowName, comments } = get();
    const workflow = {
      nodes,
      edges,
      workflowName,
      comments,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('ynode-workflow', JSON.stringify(workflow));
  },

  loadWorkflow: () => {
    const saved = localStorage.getItem('ynode-workflow');
    if (saved) {
      const { nodes, edges, workflowName, comments = [] } = JSON.parse(saved);
      set({ nodes, edges, workflowName, comments, isDirty: false });
    }
  },

  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      workflowName: 'Untitled Workflow',
      workflowId: null,
      executionLogs: [],
      comments: [],
      nodeExecutionStates: new Map(),
      isDirty: false,
      saveStatus: 'idle',
      saveError: null,
    });
  },

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  setSaveStatus: (status, error) =>
    set({
      saveStatus: status,
      saveError: error || null,
    }),

  loadFromServer: (workflow) => {
    // Merge saved config with current defaults from node definitions
    const mergedNodes = workflow.nodes.map((node) => {
      const nodeType = (node.data?.type || node.type || '') as string;
      const definition = nodeRegistry.get(nodeType);
      if (definition && definition.defaultConfig) {
        return {
          ...node,
          data: {
            ...node.data,
            config: { ...definition.defaultConfig, ...node.data?.config },
          },
        };
      }
      return node;
    });

    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodes: mergedNodes as Node<NodeData>[],
      edges: workflow.edges,
      isDirty: false,
      saveStatus: 'saved',
      saveError: null,
    });
  },

  deleteSelectedNodes: () => {
    const { nodes, edges } = get();
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
    const remainingNodes = nodes.filter((n) => !n.selected);
    const remainingEdges = edges.filter(
      (e) =>
        !selectedNodeIds.includes(e.source) &&
        !selectedNodeIds.includes(e.target)
    );
    set({ nodes: remainingNodes, edges: remainingEdges, selectedNode: null });
  },

  deleteEdge: (edgeId) => {
    set({ edges: get().edges.filter((e) => e.id !== edgeId), isDirty: true });
  },

  insertNodeBetweenEdge: (edgeId, nodeType) => {
    const { nodes, edges } = get();
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;

    const newNodeId = uuidv4();
    const newNode: Node<NodeData> = {
      id: newNodeId,
      type: nodeType,
      position: { x: midX, y: midY },
      data: getDefaultNodeData(nodeType),
    };

    const newEdge1: Edge = {
      id: uuidv4(),
      source: edge.source,
      target: newNodeId,
      sourceHandle: edge.sourceHandle,
    };
    const newEdge2: Edge = {
      id: uuidv4(),
      source: newNodeId,
      target: edge.target,
      targetHandle: edge.targetHandle,
    };

    set({
      nodes: [...nodes, newNode],
      edges: edges.filter((e) => e.id !== edgeId).concat([newEdge1, newEdge2]),
      isDirty: true,
    });
  },

  copySelectedNodes: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);

    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    const relevantEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    set({
      clipboard: {
        nodes: selectedNodes,
        edges: relevantEdges,
      },
    });
  },

  pasteNodes: () => {
    const { clipboard, nodes, edges } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;

    const idMap = new Map<string, string>();
    clipboard.nodes.forEach((node) => {
      idMap.set(node.id, uuidv4());
    });

    const offset = { x: 50, y: 50 };

    const newNodes: Node<NodeData>[] = clipboard.nodes.map((node) => ({
      ...node,
      id: idMap.get(node.id)!,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: true,
      data: { ...node.data },
    }));

    const newEdges: Edge[] = clipboard.edges.map((edge) => ({
      ...edge,
      id: uuidv4(),
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
    }));

    const updatedNodes = nodes.map((n) => ({ ...n, selected: false }));

    set({
      nodes: [...updatedNodes, ...newNodes],
      edges: [...edges, ...newEdges],
    });
  },

  duplicateSelectedNodes: () => {
    const { copySelectedNodes, pasteNodes } = get();
    copySelectedNodes();
    pasteNodes();
  },

  setNodeExecutionState: (nodeId, state) => {
    const newStates = new Map(get().nodeExecutionStates);
    newStates.set(nodeId, state);
    set({ nodeExecutionStates: newStates });
  },

  setCurrentExecutingNode: (nodeId) => {
    set({ currentExecutingNodeId: nodeId });
  },

  clearExecutionStates: () => {
    set({
      nodeExecutionStates: new Map(),
      currentExecutingNodeId: null,
    });
  },

  addComment: (position, size = { width: 300, height: 150 }) => {
    const newComment: Node<CommentData> = {
      id: `comment-${uuidv4()}`,
      type: 'comment',
      position,
      data: {
        text: 'Add your comment here...',
        width: size.width,
        height: size.height,
      },
      zIndex: -1,
    };
    set({ nodes: [...get().nodes, newComment as any] });
  },

  updateComment: (commentId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === commentId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ) as Node<NodeData>[],
    });
  },

  deleteComment: (commentId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== commentId) as Node<NodeData>[],
    });
  },
}));
