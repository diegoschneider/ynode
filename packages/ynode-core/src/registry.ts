import type { NodeDefinition, NodeCategory } from './types';

class NodeRegistry {
  private definitions = new Map<string, NodeDefinition>();

  register<TConfig>(definition: NodeDefinition<TConfig>): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Node type "${definition.type}" is already registered`);
    }
    this.definitions.set(definition.type, definition as NodeDefinition);
  }

  get(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  getAll(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByCategory(category: NodeCategory): NodeDefinition[] {
    return this.getAll().filter((def) => def.category === category);
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  get size(): number {
    return this.definitions.size;
  }

  clear(): void {
    this.definitions.clear();
  }
}

export const nodeRegistry = new NodeRegistry();
export type { NodeRegistry };
