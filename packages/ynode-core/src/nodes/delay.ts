import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  duration: z.number().min(0).max(300000).default(1000),
  unit: z.enum(['ms', 'seconds', 'minutes']).default('ms'),
});

type DelayConfig = z.infer<typeof configSchema>;

export const delayNode = defineNode<DelayConfig>({
  type: 'delay',
  label: 'Delay',
  description: 'Pause workflow execution for a specified duration',
  category: 'logic',
  icon: 'Timer',
  color: 'brand-slate',

  inputs: [
    {
      id: 'trigger',
      label: 'Trigger',
      type: 'any',
      required: true,
      description: 'Input that triggers the delay',
    },
  ],

  outputs: [
    {
      id: 'output',
      label: 'Output',
      type: 'any',
      description: 'Passes through input after delay',
    },
  ],

  configSchema,
  defaultConfig: {
    duration: 1000,
    unit: 'ms',
  },

  async execute(ctx: ExecutionContext<DelayConfig>): Promise<NodeOutput> {
    const { config, inputs, log, abortSignal } = ctx;

    let delayMs = config.duration;
    switch (config.unit) {
      case 'seconds':
        delayMs = config.duration * 1000;
        break;
      case 'minutes':
        delayMs = config.duration * 60 * 1000;
        break;
    }

    log(`Delaying for ${config.duration} ${config.unit} (${delayMs}ms)`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, delayMs);

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Delay cancelled'));
        });
      }
    });

    const passthrough = inputs.trigger ?? inputs;

    log(`Delay completed`);

    return {
      data: {
        default: passthrough,
        output: passthrough,
      },
    };
  },
});
