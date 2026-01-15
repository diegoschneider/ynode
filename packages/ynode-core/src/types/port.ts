// =============================================================================
// Port Data Types - Type System
// =============================================================================

// Tier 1: Primitive Types
export type PrimitiveDataType = 'string' | 'number' | 'boolean' | 'null';

// Tier 2: Structured Types
export type StructuredDataType = 'object' | 'array' | 'json';

// Tier 3: Format-Specific Types (strings with format)
export type FormatDataType =
  | 'datetime'
  | 'date'
  | 'time'
  | 'uuid'
  | 'url'
  | 'email'
  | 'regex'
  | 'base64'
  | 'markdown'
  | 'html'
  | 'xml'
  | 'yaml'
  | 'csv';

// Tier 4: Binary/Media Types
export type BinaryDataType = 'binary' | 'image' | 'audio' | 'video' | 'pdf';

// Special Types
export type SpecialDataType = 'any' | 'trigger';

// Complete Port Data Type Union
export type PortDataType =
  | SpecialDataType
  | PrimitiveDataType
  | StructuredDataType
  | FormatDataType
  | BinaryDataType;

// =============================================================================
// Type Metadata - Colors & Compatibility
// =============================================================================

export interface TypeMetadata {
  label: string;
  color: string; // Hex color for connections/ports
  description: string;
  category: 'special' | 'primitive' | 'structured' | 'format' | 'binary';
  compatibleWith: PortDataType[]; // Types this can connect TO
}

export const TYPE_METADATA: Record<PortDataType, TypeMetadata> = {
  // Special Types
  any: {
    label: 'Any',
    color: '#FFFFFF',
    description: 'Accepts any type',
    category: 'special',
    compatibleWith: [], // 'any' as OUTPUT can connect to anything (handled in logic)
  },
  trigger: {
    label: 'Trigger',
    color: '#FFFFFF',
    description: 'Execution flow trigger',
    category: 'special',
    compatibleWith: ['trigger', 'any'],
  },

  // Primitive Types
  string: {
    label: 'String',
    color: '#F472B6', // Pink
    description: 'Text value',
    category: 'primitive',
    compatibleWith: [
      'string',
      'any',
      'markdown',
      'html',
      'xml',
      'yaml',
      'csv',
    ],
  },
  number: {
    label: 'Number',
    color: '#4ADE80', // Green
    description: 'Numeric value (integer or float)',
    category: 'primitive',
    compatibleWith: ['number', 'any', 'string'],
  },
  boolean: {
    label: 'Boolean',
    color: '#F87171', // Red
    description: 'True or false',
    category: 'primitive',
    compatibleWith: ['boolean', 'any', 'string', 'number'],
  },
  null: {
    label: 'Null',
    color: '#A1A1AA', // Gray
    description: 'Null/empty value',
    category: 'primitive',
    compatibleWith: ['null', 'any'],
  },

  // Structured Types
  object: {
    label: 'Object',
    color: '#38BDF8', // Cyan/Sky blue
    description: 'Key-value dictionary',
    category: 'structured',
    compatibleWith: ['object', 'any', 'json'],
  },
  array: {
    label: 'Array',
    color: '#A78BFA', // Purple
    description: 'List/collection of items',
    category: 'structured',
    compatibleWith: ['array', 'any', 'json'],
  },
  json: {
    label: 'JSON',
    color: '#FB923C', // Orange
    description: 'JSON-parseable data',
    category: 'structured',
    compatibleWith: ['json', 'any', 'object', 'array', 'string'],
  },

  // Format-Specific Types
  datetime: {
    label: 'DateTime',
    color: '#FBBF24', // Amber
    description: 'ISO 8601 datetime',
    category: 'format',
    compatibleWith: ['datetime', 'any', 'string', 'date', 'time'],
  },
  date: {
    label: 'Date',
    color: '#FCD34D', // Yellow
    description: 'Date only (YYYY-MM-DD)',
    category: 'format',
    compatibleWith: ['date', 'any', 'string', 'datetime'],
  },
  time: {
    label: 'Time',
    color: '#FDE68A', // Light yellow
    description: 'Time only (HH:mm:ss)',
    category: 'format',
    compatibleWith: ['time', 'any', 'string', 'datetime'],
  },
  uuid: {
    label: 'UUID',
    color: '#C084FC', // Violet
    description: 'Universally unique identifier',
    category: 'format',
    compatibleWith: ['uuid', 'any', 'string'],
  },
  url: {
    label: 'URL',
    color: '#60A5FA', // Blue
    description: 'URL/URI string',
    category: 'format',
    compatibleWith: ['url', 'any', 'string'],
  },
  email: {
    label: 'Email',
    color: '#34D399', // Emerald
    description: 'Email address',
    category: 'format',
    compatibleWith: ['email', 'any', 'string'],
  },
  regex: {
    label: 'Regex',
    color: '#F97316', // Orange-red
    description: 'Regular expression pattern',
    category: 'format',
    compatibleWith: ['regex', 'any', 'string'],
  },
  base64: {
    label: 'Base64',
    color: '#14B8A6', // Teal
    description: 'Base64 encoded data',
    category: 'format',
    compatibleWith: ['base64', 'any', 'string', 'binary'],
  },
  markdown: {
    label: 'Markdown',
    color: '#EC4899', // Pink (darker)
    description: 'Markdown formatted text',
    category: 'format',
    compatibleWith: ['markdown', 'any', 'string', 'html'],
  },
  html: {
    label: 'HTML',
    color: '#F43F5E', // Rose
    description: 'HTML content',
    category: 'format',
    compatibleWith: ['html', 'any', 'string'],
  },
  xml: {
    label: 'XML',
    color: '#10B981', // Green-teal
    description: 'XML document',
    category: 'format',
    compatibleWith: ['xml', 'any', 'string'],
  },
  yaml: {
    label: 'YAML',
    color: '#8B5CF6', // Purple-violet
    description: 'YAML document',
    category: 'format',
    compatibleWith: ['yaml', 'any', 'string', 'json'],
  },
  csv: {
    label: 'CSV',
    color: '#22C55E', // Green
    description: 'Comma-separated values',
    category: 'format',
    compatibleWith: ['csv', 'any', 'string', 'array'],
  },

  // Binary/Media Types
  binary: {
    label: 'Binary',
    color: '#6366F1', // Indigo
    description: 'Raw binary data',
    category: 'binary',
    compatibleWith: ['binary', 'any', 'base64'],
  },
  image: {
    label: 'Image',
    color: '#0EA5E9', // Sky
    description: 'Image file (jpeg, png, gif, etc.)',
    category: 'binary',
    compatibleWith: ['image', 'any', 'binary', 'base64'],
  },
  audio: {
    label: 'Audio',
    color: '#06B6D4', // Cyan
    description: 'Audio file',
    category: 'binary',
    compatibleWith: ['audio', 'any', 'binary', 'base64'],
  },
  video: {
    label: 'Video',
    color: '#0891B2', // Cyan-dark
    description: 'Video file',
    category: 'binary',
    compatibleWith: ['video', 'any', 'binary', 'base64'],
  },
  pdf: {
    label: 'PDF',
    color: '#DC2626', // Red
    description: 'PDF document',
    category: 'binary',
    compatibleWith: ['pdf', 'any', 'binary', 'base64'],
  },
};

// =============================================================================
// Type Compatibility Functions
// =============================================================================

/**
 * Check if a source port type can connect to a target port type
 * @param sourceType - The output port's data type
 * @param targetType - The input port's data type
 * @returns true if connection is valid
 */
export function isTypeCompatible(
  sourceType: PortDataType,
  targetType: PortDataType
): boolean {
  // 'any' as target accepts everything
  if (targetType === 'any') return true;

  // 'any' as source can connect to anything
  if (sourceType === 'any') return true;

  // Exact match
  if (sourceType === targetType) return true;

  // Check compatibility map
  const sourceMeta = TYPE_METADATA[sourceType];
  return sourceMeta.compatibleWith.includes(targetType);
}

/**
 * Get the display color for a port type
 */
export function getTypeColor(type: PortDataType): string {
  return TYPE_METADATA[type]?.color ?? '#FFFFFF';
}

/**
 * Get all types that are compatible with a given type (for UI hints)
 */
export function getCompatibleTypes(type: PortDataType): PortDataType[] {
  if (type === 'any') {
    return Object.keys(TYPE_METADATA) as PortDataType[];
  }
  return TYPE_METADATA[type]?.compatibleWith ?? [];
}

// =============================================================================
// Port Definition
// =============================================================================

export interface PortDefinition {
  id: string;
  label: string;
  type: PortDataType;
  required?: boolean;
  description?: string;

  // Extended metadata
  mimeType?: string; // For binary types (e.g., 'image/png')
  itemType?: PortDataType; // For arrays (e.g., array of strings)
  schema?: object; // Optional JSON schema for object validation
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
