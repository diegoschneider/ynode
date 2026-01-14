import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  mapping: z.record(z.string(), z.string()).default({}),
});

type JsonTransformConfig = z.infer<typeof configSchema>;

export const jsonTransformNode = defineNode<JsonTransformConfig>({
  type: 'jsonTransform',
  label: 'JSON Transform',
  description: 'Transform JSON data using path expressions',
  category: 'transform',
  icon: 'Braces',
  color: 'brand-indigo',

  inputs: [
    {
      id: 'data',
      label: 'Data',
      type: 'any',
      required: true,
      description: 'JSON data to transform',
    },
  ],

  outputs: [
    {
      id: 'result',
      label: 'Result',
      type: 'object',
      description: 'Transformed JSON data',
    },
  ],

  configSchema,
  defaultConfig: {
    mapping: {},
  },

  async execute(
    ctx: ExecutionContext<JsonTransformConfig>
  ): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;
    const data = inputs.data ?? inputs;

    const result: Record<string, unknown> = {};

    for (const [outputKey, pathExpr] of Object.entries(config.mapping)) {
      try {
        const pathParts = pathExpr.split('.');
        let value: unknown = data;

        for (const part of pathParts) {
          if (value && typeof value === 'object' && part in value) {
            value = (value as Record<string, unknown>)[part];
          } else {
            value = undefined;
            break;
          }
        }

        result[outputKey] = value;
        log(`Mapped ${pathExpr} → ${outputKey}: ${JSON.stringify(value)}`);
      } catch (error) {
        log(
          `Error mapping ${pathExpr}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        result[outputKey] = undefined;
      }
    }

    return {
      data: {
        default: result,
        result,
      },
    };
  },
});
