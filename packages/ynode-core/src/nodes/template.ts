import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  template: z.string().default('Hello, {{name}}!'),
});

type TemplateConfig = z.infer<typeof configSchema>;

export const templateNode = defineNode<TemplateConfig>({
  type: 'template',
  label: 'Template',
  description: 'Render string templates with {{variable}} interpolation',
  category: 'transform',
  icon: 'FileText',
  color: 'brand-emerald',

  inputs: [
    {
      id: 'data',
      label: 'Data',
      type: 'object',
      required: true,
      description: 'Data object for variable substitution',
    },
  ],

  outputs: [
    {
      id: 'result',
      label: 'Result',
      type: 'string',
      description: 'Rendered template string',
    },
  ],

  configSchema,
  defaultConfig: {
    template: 'Hello, {{name}}!',
  },

  async execute(ctx: ExecutionContext<TemplateConfig>): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;
    const data = (inputs.data ?? inputs) as Record<string, unknown>;

    let result = config.template;

    const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = variablePattern.exec(config.template)) !== null) {
      const fullMatch = match[0];
      const path = match[1];

      try {
        const pathParts = path.split('.');
        let value: unknown = data;

        for (const part of pathParts) {
          if (value && typeof value === 'object' && part in value) {
            value = (value as Record<string, unknown>)[part];
          } else {
            value = undefined;
            break;
          }
        }

        const replacement = value !== undefined ? String(value) : '';
        result = result.replace(fullMatch, replacement);
      } catch {
        result = result.replace(fullMatch, '');
      }
    }

    log(
      `Rendered template: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`
    );

    return {
      data: {
        default: result,
        result,
      },
    };
  },
});
