import type { ZodSchema } from 'zod';
import type {
  NodeDefinition,
  ExecutionContext,
  CredentialRequirement,
} from './types';

export class ValidationError extends Error {
  public readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(`Validation failed: ${issues.map((i) => i.message).join(', ')}`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
  code: 'invalid_config' | 'missing_credential' | 'invalid_type';
}

export interface ValidationResult {
  success: boolean;
  issues: ValidationIssue[];
  data?: unknown;
}

export function validateNodeConfig(
  definition: NodeDefinition,
  config: unknown
): ValidationResult {
  if (!definition.configSchema) {
    return { success: true, issues: [], data: config };
  }

  const schema = definition.configSchema as ZodSchema;
  const result = schema.safeParse(config);

  if (result.success) {
    return { success: true, issues: [], data: result.data };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: 'invalid_config' as const,
  }));

  return { success: false, issues };
}

export function validateCredentialRequirements(
  definition: NodeDefinition,
  nodeConfig: Record<string, unknown>
): ValidationResult {
  const requirements = definition.credentials || [];
  const issues: ValidationIssue[] = [];

  for (const req of requirements) {
    if (req.required) {
      const credentialId = nodeConfig[`credential_${req.type}`] as
        | string
        | undefined;

      if (!credentialId) {
        issues.push({
          path: `credentials.${req.type}`,
          message: `Required credential "${req.type}" is not configured`,
          code: 'missing_credential',
        });
      }
    }
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

export function validateNode(
  definition: NodeDefinition,
  config: unknown
): ValidationResult {
  const configResult = validateNodeConfig(definition, config);
  if (!configResult.success) {
    return configResult;
  }

  const credentialResult = validateCredentialRequirements(
    definition,
    (config as Record<string, unknown>) || {}
  );

  if (!credentialResult.success) {
    return credentialResult;
  }

  return { success: true, issues: [], data: configResult.data };
}

export async function validateCredentialAccess(
  requirements: CredentialRequirement[],
  context: ExecutionContext,
  nodeConfig: Record<string, unknown>
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  for (const req of requirements) {
    if (req.required) {
      const credentialId = nodeConfig[`credential_${req.type}`] as
        | string
        | undefined;

      if (!credentialId) {
        issues.push({
          path: `credentials.${req.type}`,
          message: `Required credential "${req.type}" is not configured`,
          code: 'missing_credential',
        });
        continue;
      }

      try {
        await context.credentials.get(credentialId);
      } catch {
        issues.push({
          path: `credentials.${req.type}`,
          message: `Credential "${req.type}" (${credentialId}) could not be accessed`,
          code: 'missing_credential',
        });
      }
    }
  }

  return {
    success: issues.length === 0,
    issues,
  };
}
