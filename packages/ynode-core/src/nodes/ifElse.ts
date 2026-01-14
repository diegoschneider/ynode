import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  condition: z.string().default('data.value > 0'),
});

type IfElseConfig = z.infer<typeof configSchema>;

export const ifElseNode = defineNode<IfElseConfig>({
  type: 'ifElse',
  label: 'If/Else',
  description: 'Branch workflow based on a condition',
  category: 'logic',
  icon: 'Split',
  color: 'brand-rose',

  inputs: [
    {
      id: 'data',
      label: 'Data',
      type: 'any',
      required: true,
      description: 'Data to evaluate condition against',
    },
  ],

  outputs: [
    {
      id: 'true',
      label: 'True',
      type: 'any',
      description: 'Output when condition is true',
    },
    {
      id: 'false',
      label: 'False',
      type: 'any',
      description: 'Output when condition is false',
    },
  ],

  configSchema,
  defaultConfig: {
    condition: 'data.value > 0',
  },

  async execute(ctx: ExecutionContext<IfElseConfig>): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;
    const data = inputs.data ?? inputs;

    if (!config.condition) {
      log('No condition specified, defaulting to true branch');
      return {
        data: { default: data, true: data },
        branch: 'true',
      };
    }

    log(`Evaluating: ${config.condition}`);

    try {
      const fn = new Function('data', `return ${config.condition};`);
      const result = fn(data);
      const branch = result ? 'true' : 'false';

      log(`Condition result: ${result} → ${branch} branch`);

      return {
        data: {
          [branch]: data,
        },
        branch,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log(`Error evaluating condition: ${message}`);
      return {
        data: { false: data },
        branch: 'false',
        error: error as Error,
      };
    }
  },
});
