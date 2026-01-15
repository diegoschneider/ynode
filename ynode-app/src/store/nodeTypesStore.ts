import { create } from 'zustand';
import type {
  SerializedNodeDefinition,
  CategoryMetadata,
} from '../types/nodeTypes';
import { fetchNodeTypes as fetchNodeTypesApi } from '../api/nodeTypesApi';

interface NodeTypesState {
  // Data
  nodes: SerializedNodeDefinition[];
  categories: Record<string, CategoryMetadata>;
  version: string | null;

  // Status
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchNodeTypes: (forceRefresh?: boolean) => Promise<void>;
  getNodeDefinition: (type: string) => SerializedNodeDefinition | undefined;
  getNodesByCategory: (category: string) => SerializedNodeDefinition[];
}

export const useNodeTypesStore = create<NodeTypesState>((set, get) => ({
  // Initial state
  nodes: [],
  categories: {},
  version: null,
  isLoading: false,
  isLoaded: false,
  error: null,

  // Actions
  fetchNodeTypes: async (_forceRefresh = false) => {
    // Skip only if currently loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const data = await fetchNodeTypesApi(true); // Always force refresh
      set({
        nodes: data.nodes,
        categories: data.categories,
        version: data.version,
        isLoading: false,
        isLoaded: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load node types',
      });
      throw error;
    }
  },

  getNodeDefinition: (type: string) => {
    return get().nodes.find((node) => node.type === type);
  },

  getNodesByCategory: (category: string) => {
    return get().nodes.filter((node) => node.category === category);
  },
}));

/**
 * Hook to ensure node types are loaded before using them
 */
export function useNodeTypes() {
  const { nodes, categories, isLoading, isLoaded, error, fetchNodeTypes } =
    useNodeTypesStore();

  // Fetch on first use if not loaded
  if (!isLoaded && !isLoading && !error) {
    fetchNodeTypes();
  }

  return {
    nodes,
    categories,
    isLoading,
    isLoaded,
    error,
    refetch: () => fetchNodeTypes(true),
  };
}

/**
 * Get a node definition by type (direct access, must be after nodes are loaded)
 */
export function useNodeDefinition(type: string) {
  const getNodeDefinition = useNodeTypesStore(
    (state) => state.getNodeDefinition
  );
  return getNodeDefinition(type);
}
