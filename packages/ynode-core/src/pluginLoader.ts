import type { NodeDefinition } from './types/index.js';
import { nodeRegistry } from './registry.js';

export interface PluginManifest {
  name: string;
  version: string;
  nodes: string[];
  author?: string;
  description?: string;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  nodes: NodeDefinition[];
  loadedAt: string;
}

export interface PluginMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
  nodeCount: number;
  nodeTypes: string[];
  loadedAt: string;
}

export async function loadPlugin(packageName: string): Promise<LoadedPlugin> {
  try {
    const module = await import(packageName);

    const nodes: NodeDefinition[] = [];
    const nodeTypes: string[] = [];

    for (const key of Object.keys(module)) {
      const exported = module[key];
      if (isNodeDefinition(exported)) {
        nodes.push(exported);
        nodeTypes.push(exported.type);
      }
    }

    const manifest: PluginManifest = module.manifest || {
      name: packageName,
      version: '0.0.0',
      nodes: nodeTypes,
    };

    return { manifest, nodes, loadedAt: new Date().toISOString() };
  } catch (error) {
    throw new Error(
      `Failed to load plugin "${packageName}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function registerPlugin(plugin: LoadedPlugin): void {
  for (const node of plugin.nodes) {
    if (nodeRegistry.has(node.type)) {
      console.warn(
        `Node type "${node.type}" from plugin "${plugin.manifest.name}" already registered, skipping`
      );
      continue;
    }
    nodeRegistry.register(node);
  }
}

export async function loadAndRegisterPlugin(
  packageName: string
): Promise<LoadedPlugin> {
  const plugin = await loadPlugin(packageName);
  registerPlugin(plugin);
  return plugin;
}

export function isNodeDefinition(obj: unknown): obj is NodeDefinition {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.execute === 'function' &&
    Array.isArray(candidate.inputs) &&
    Array.isArray(candidate.outputs)
  );
}

class PluginManager {
  private loadedPlugins = new Map<string, LoadedPlugin>();

  async load(packageName: string): Promise<LoadedPlugin> {
    if (this.loadedPlugins.has(packageName)) {
      throw new Error(`Plugin "${packageName}" is already loaded`);
    }

    const plugin = await loadPlugin(packageName);

    for (const node of plugin.nodes) {
      if (nodeRegistry.has(node.type)) {
        throw new Error(
          `Node type "${node.type}" conflicts with an existing node`
        );
      }
    }

    registerPlugin(plugin);

    this.loadedPlugins.set(packageName, plugin);

    return plugin;
  }

  unload(packageName: string): boolean {
    return this.loadedPlugins.delete(packageName);
  }

  has(packageName: string): boolean {
    return this.loadedPlugins.has(packageName);
  }

  get(packageName: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(packageName);
  }

  getAll(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getMetadata(): PluginMetadata[] {
    return this.getAll().map((plugin) => ({
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      author: plugin.manifest.author,
      description: plugin.manifest.description,
      nodeCount: plugin.nodes.length,
      nodeTypes: plugin.nodes.map((n) => n.type),
      loadedAt: plugin.loadedAt,
    }));
  }

  get size(): number {
    return this.loadedPlugins.size;
  }

  clear(): void {
    this.loadedPlugins.clear();
  }
}

export const pluginManager = new PluginManager();
export type { PluginManager };
