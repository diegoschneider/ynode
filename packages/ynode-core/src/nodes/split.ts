import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  arrayPath: z.string().default('data'),
  outputMode: z.enum(['all', 'first']).default('all'),
});

type SplitConfig = z.infer<typeof configSchema>;

export const splitNode = defineNode<SplitConfig>({
  type: 'split',
  label: 'Split',
  description: 'Split an array into individual items',
  category: 'transform',
  icon: 'SplitSquareVertical',
  color: 'brand-pink',

  inputs: [
    {
      id: 'data',
      label: 'Data',
      type: 'any',
      required: true,
      description: 'Data containing array to split',
    },
  ],

  outputs: [
    {
      id: 'items',
      label: 'Items',
      type: 'array',
      description: 'Array of split items with index',
    },
    {
      id: 'item',
      label: 'Item',
      type: 'any',
      description: 'Each individual item (for iteration)',
    },
  ],

  configSchema,
  defaultConfig: {
    arrayPath: 'data',
    outputMode: 'all',
  },

  async execute(ctx: ExecutionContext<SplitConfig>): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;
    const inputData = inputs.data ?? inputs;

    let arrayToSplit: unknown[];

    try {
      if (config.arrayPath === 'data' || config.arrayPath === '') {
        arrayToSplit = Array.isArray(inputData) ? inputData : [inputData];
      } else {
        const pathParts = config.arrayPath.split('.');
        let value: unknown = inputData;

        for (const part of pathParts) {
          if (value && typeof value === 'object' && part in value) {
            value = (value as Record<string, unknown>)[part];
          } else {
            value = undefined;
            break;
          }
        }

        arrayToSplit = Array.isArray(value) ? value : [value];
      }
    } catch {
      arrayToSplit = [inputData];
    }

    log(`Splitting array with ${arrayToSplit.length} items`);

    const items = arrayToSplit.map((item, index) => ({
      index,
      item,
      isFirst: index === 0,
      isLast: index === arrayToSplit.length - 1,
      total: arrayToSplit.length,
    }));

    return {
      data: {
        default: items,
        items,
        item: items[0]?.item,
      },
    };
  },
});
