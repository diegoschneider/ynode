import { create } from 'zustand';
import {
  fetchWorkflows,
  fetchWorkflow,
  deleteWorkflow,
  type Workflow,
} from '../api/workflowApi';

interface WorkflowDataState {
  workflows: Workflow[];
  workflowsLoading: boolean;
  workflowsError: string | null;
  lastFetched: number | null;

  workflowCache: Map<string, Workflow>;

  fetchAllWorkflows: (force?: boolean) => Promise<void>;
  fetchWorkflowById: (id: string, force?: boolean) => Promise<Workflow | null>;
  getWorkflowById: (id: string) => Workflow | undefined;
  deleteWorkflow: (id: string) => Promise<void>;
  invalidateWorkflows: () => void;
  updateWorkflowInCache: (workflow: Workflow) => void;
}

const STALE_TIME = 30 * 1000;

export const useWorkflowDataStore = create<WorkflowDataState>((set, get) => ({
  workflows: [],
  workflowsLoading: false,
  workflowsError: null,
  lastFetched: null,
  workflowCache: new Map(),

  fetchAllWorkflows: async (force = false) => {
    const { lastFetched, workflowsLoading } = get();

    if (workflowsLoading) return;

    if (!force && lastFetched && Date.now() - lastFetched < STALE_TIME) {
      return;
    }

    set({ workflowsLoading: true, workflowsError: null });

    try {
      const workflows = await fetchWorkflows();

      const cache = new Map(get().workflowCache);
      workflows.forEach((w) => cache.set(w.id, w));

      set({
        workflows,
        workflowsLoading: false,
        lastFetched: Date.now(),
        workflowCache: cache,
      });
    } catch (error) {
      set({
        workflowsLoading: false,
        workflowsError:
          error instanceof Error ? error.message : 'Failed to fetch workflows',
      });
    }
  },

  fetchWorkflowById: async (id: string, force = false) => {
    const { workflowCache } = get();

    if (!force && workflowCache.has(id)) {
      return workflowCache.get(id)!;
    }

    try {
      const workflow = await fetchWorkflow(id);

      const cache = new Map(get().workflowCache);
      cache.set(id, workflow);
      set({ workflowCache: cache });

      const workflows = get().workflows.map((w) =>
        w.id === id ? workflow : w
      );
      set({ workflows });

      return workflow;
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
      return null;
    }
  },

  getWorkflowById: (id: string) => {
    return get().workflowCache.get(id);
  },

  deleteWorkflow: async (id: string) => {
    try {
      await deleteWorkflow(id);

      const { workflows, workflowCache } = get();

      const cache = new Map(workflowCache);
      cache.delete(id);

      set({
        workflows: workflows.filter((w) => w.id !== id),
        workflowCache: cache,
      });
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw error;
    }
  },

  invalidateWorkflows: () => {
    set({ lastFetched: null });
  },

  updateWorkflowInCache: (workflow: Workflow) => {
    const cache = new Map(get().workflowCache);
    cache.set(workflow.id, workflow);

    const workflows = get().workflows.map((w) =>
      w.id === workflow.id ? workflow : w
    );

    if (!workflows.find((w) => w.id === workflow.id)) {
      workflows.unshift(workflow);
    }

    set({ workflowCache: cache, workflows });
  },
}));
