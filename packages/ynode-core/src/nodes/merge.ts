import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  mode: z.enum(['waitAll', 'passthrough']).default('waitAll'),
});

type MergeConfig = z.infer<typeof configSchema>;

export const mergeNode = defineNode<MergeConfig>({
  type: 'merge',
  label: 'Merge',
  description: 'Combine multiple inputs into a single output',
  category: 'logic',
  icon: 'Combine',
  color: 'brand-teal',

  inputs: [
    {
      id: 'input1',
      label: 'Input 1',
      type: 'any',
      description: 'First input to merge',
    },
    {
      id: 'input2',
      label: 'Input 2',
      type: 'any',
      description: 'Second input to merge',
    },
    {
      id: 'input3',
      label: 'Input 3',
      type: 'any',
      description: 'Third input to merge (optional)',
    },
  ],

  outputs: [
    {
      id: 'merged',
      label: 'Merged',
      type: 'object',
      description: 'Combined data from all inputs',
    },
  ],

  configSchema,
  defaultConfig: {
    mode: 'waitAll',
  },

  async execute(ctx: ExecutionContext<MergeConfig>): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;

    const mergedData: Record<string, unknown> = {};
    const inputKeys = ['input1', 'input2', 'input3'];
    let inputCount = 0;

    for (const key of inputKeys) {
      if (inputs[key] !== undefined) {
        mergedData[key] = inputs[key];
        inputCount++;
      }
    }

    log(`Merged ${inputCount} inputs (mode: ${config.mode})`);

    return {
      data: {
        default: mergedData,
        merged: mergedData,
      },
    };
  },
});
