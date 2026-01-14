import type { NodeDefinition } from './types/node.js';
import type {
  ConfigField,
  SerializedNodeDefinition,
  NodeTypesResponse,
} from './types/serialization.js';
import { nodeRegistry } from './registry.js';
import { CategoryMeta } from './types/port.js';

export function extractConfigFields(schema: unknown): ConfigField[] {
  const zodSchema = schema as {
    _def?: { typeName?: string; shape?: () => Record<string, unknown> };
  };
  if (!zodSchema || !zodSchema._def) return [];

  const fields: ConfigField[] = [];

  if (zodSchema._def.typeName === 'ZodObject' && zodSchema._def.shape) {
    const shape = zodSchema._def.shape();
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = parseZodField(key, fieldSchema);
      if (field) fields.push(field);
    }
  }

  return fields;
}

function parseZodField(name: string, schema: unknown): ConfigField | null {
  const zodField = schema as {
    _def?: {
      typeName?: string;
      innerType?: unknown;
      defaultValue?: () => unknown;
      checks?: Array<{ kind: string; value: number }>;
    };
  };
  if (!zodField || !zodField._def) return null;

  let currentSchema = zodField;
  let isOptional = false;
  let defaultValue: unknown = undefined;

  while (currentSchema._def?.typeName === 'ZodDefault') {
    defaultValue = currentSchema._def.defaultValue?.();
    currentSchema = currentSchema._def.innerType as typeof zodField;
  }

  while (currentSchema._def?.typeName === 'ZodOptional') {
    isOptional = true;
    currentSchema = currentSchema._def.innerType as typeof zodField;
  }

  const typeName = currentSchema._def?.typeName;

  const baseField: ConfigField = {
    name,
    type: 'string',
    required: !isOptional,
    default: defaultValue,
  };

  switch (typeName) {
    case 'ZodString':
      return { ...baseField, type: 'string' };

    case 'ZodNumber': {
      const checks = currentSchema._def?.checks || [];
      const minCheck = checks.find((c) => c.kind === 'min');
      const maxCheck = checks.find((c) => c.kind === 'max');
      return {
        ...baseField,
        type: 'number',
        min: minCheck?.value,
        max: maxCheck?.value,
      };
    }

    case 'ZodBoolean':
      return { ...baseField, type: 'boolean' };

    case 'ZodEnum': {
      const enumSchema = currentSchema as { _def?: { values?: string[] } };
      return {
        ...baseField,
        type: 'enum',
        enumValues: enumSchema._def?.values,
      };
    }

    case 'ZodRecord':
    case 'ZodObject':
      return { ...baseField, type: 'object' };

    case 'ZodArray':
      return { ...baseField, type: 'array' };

    default:
      return { ...baseField, type: 'string' };
  }
}

export function serializeNode(
  definition: NodeDefinition
): SerializedNodeDefinition {
  return {
    type: definition.type,
    label: definition.label,
    description: definition.description,
    category: definition.category,
    icon: definition.icon,
    color: definition.color,
    inputs: definition.inputs,
    outputs: definition.outputs,
    defaultConfig: definition.defaultConfig as Record<string, unknown>,
    configFields: extractConfigFields(definition.configSchema),
    credentials: definition.credentials,
    usesMemory: definition.usesMemory,
    usesWorkflowMemory: definition.usesWorkflowMemory,
    requiresNetwork: definition.requiresNetwork,
  };
}

export function serializeRegistry(): SerializedNodeDefinition[] {
  return nodeRegistry.getAll().map(serializeNode);
}

export function serializeNodeTypes(
  version: string = '1.0.0'
): NodeTypesResponse {
  return {
    nodes: serializeRegistry(),
    categories: CategoryMeta,
    version,
  };
}
