export type PortDataType =
  | 'any'
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

export interface PortDefinition {
  id: string;
  label: string;
  type: PortDataType;
  required?: boolean;
  description?: string;
}

export type NodeCategory =
  | 'trigger'
  | 'logic'
  | 'transform'
  | 'integration'
  | 'ai'
  | 'communication'
  | 'data'
  | 'utility'
  | 'custom';

export interface CategoryMetadata {
  label: string;
  icon: string;
  description: string;
}

export const CategoryMeta: Record<NodeCategory, CategoryMetadata> = {
  trigger: { label: 'Triggers', icon: 'Zap', description: 'Start workflows' },
  logic: { label: 'Logic', icon: 'Split', description: 'Control flow' },
  transform: {
    label: 'Transform',
    icon: 'Shuffle',
    description: 'Modify data',
  },
  integration: {
    label: 'Integrations',
    icon: 'Globe',
    description: 'Connect services',
  },
  ai: { label: 'AI', icon: 'Brain', description: 'Artificial Intelligence' },
  communication: {
    label: 'Communication',
    icon: 'MessageSquare',
    description: 'Send messages',
  },
  data: { label: 'Data', icon: 'Database', description: 'Store & Retrieve' },
  utility: { label: 'Utilities', icon: 'Wrench', description: 'Helper tools' },
  custom: { label: 'Custom', icon: 'Code', description: 'User defined' },
};
