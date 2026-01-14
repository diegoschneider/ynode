import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  triggerType: z.enum(['manual', 'scheduled', 'webhook']).default('manual'),
  description: z.string().optional(),
});

type TriggerConfig = z.infer<typeof configSchema>;

export const triggerNode = defineNode<TriggerConfig>({
  type: 'trigger',
  label: 'Trigger',
  description:
    'Starting point for workflow execution.\nClick the play button to run.',
  category: 'trigger',
  icon: 'Zap',
  color: 'brand-green',

  inputs: [],

  outputs: [
    {
      id: 'trigger',
      label: 'Trigger',
      type: 'object',
      description: 'Trigger data including timestamp',
    },
  ],

  configSchema,
  defaultConfig: {
    triggerType: 'manual',
  },

  async execute(ctx: ExecutionContext<TriggerConfig>): Promise<NodeOutput> {
    const { config, log, inputs } = ctx;
    const timestamp = new Date().toISOString();

    log(`Trigger activated (${config.triggerType})`);

    return {
      data: {
        default: {
          triggered: true,
          type: config.triggerType,
          timestamp,
          ...inputs,
        },
        trigger: {
          triggered: true,
          type: config.triggerType,
          timestamp,
        },
      },
    };
  },
});
