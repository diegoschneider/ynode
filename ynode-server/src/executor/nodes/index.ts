import type { ExecutionContext, NodeOutput, NodeDefinition } from '@ynode/core';
import { nodeRegistry, registerBuiltinNodes } from '@ynode/core';

registerBuiltinNodes();

type NodeExecutor = (context: ExecutionContext) => Promise<NodeOutput>;

export function getNodeExecutor(nodeType: string): NodeExecutor | undefined {
  const definition = nodeRegistry.get(nodeType) as NodeDefinition | undefined;
  if (!definition) return undefined;

  return (context: ExecutionContext) => definition.execute(context);
}

export function getSupportedNodeTypes(): string[] {
  return nodeRegistry.getAll().map((def) => def.type);
}
