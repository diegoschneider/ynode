import { ExecutionContext, NodeOutput } from './execution.js';
import { PortDefinition, NodeCategory } from './port.js';

export function defineNode<TConfig>(
  definition: NodeDefinition<TConfig>
): NodeDefinition<TConfig> {
  return definition;
}

export interface CredentialRequirement {
  type: string;
  required: boolean;
  description?: string;
}

export interface NodeDefinition<TConfig = any> {
  type: string;
  label: string;
  description?: string;
  category: NodeCategory;
  icon: string;
  color?: string;

  inputs: PortDefinition[];
  outputs: PortDefinition[];

  configSchema?: any;
  defaultConfig: TConfig;

  // Framework Requirements
  credentials?: CredentialRequirement[];
  usesMemory?: boolean;
  usesWorkflowMemory?: boolean;
  requiresNetwork?: boolean;

  execute(context: ExecutionContext<TConfig>): Promise<NodeOutput>;
}

export type NodeStyle = {
  color: string;
  icon: string;
  width?: number;
  height?: number;
};

export interface NodeData<TConfig = Record<string, unknown>> {
  label?: string;
  config?: TConfig;
  [key: string]: unknown;
}
