import type { PortDefinition, NodeCategory, CategoryMetadata } from './port.js';
import type { CredentialRequirement } from './node.js';

export type { CredentialRequirement } from './node.js';

export interface ConfigField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  required: boolean;
  default?: unknown;
  enumValues?: string[];
  min?: number;
  max?: number;
}

export interface SerializedNodeDefinition {
  type: string;
  label: string;
  description?: string;
  category: NodeCategory;
  icon: string;
  color?: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultConfig: Record<string, unknown>;
  configFields: ConfigField[];
  credentials?: CredentialRequirement[];
  usesMemory?: boolean;
  usesWorkflowMemory?: boolean;
  requiresNetwork?: boolean;
}

export interface NodeTypesResponse {
  nodes: SerializedNodeDefinition[];
  categories: Record<NodeCategory, CategoryMetadata>;
  version: string;
}
