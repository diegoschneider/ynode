/**
 * Node type definitions for the frontend.
 * Re-exported from @ynode/core for consistency.
 */
export type {
  SerializedNodeDefinition,
  ConfigField,
  NodeTypesResponse,
  CredentialRequirement,
} from '@ynode/core';

export type {
  PortDefinition,
  CategoryMetadata,
  NodeCategory,
  PortDataType,
  TypeMetadata,
  PrimitiveDataType,
  StructuredDataType,
  FormatDataType,
  BinaryDataType,
  SpecialDataType,
} from '@ynode/core';

export {
  TYPE_METADATA,
  isTypeCompatible,
  getTypeColor,
  getCompatibleTypes,
} from '@ynode/core';

