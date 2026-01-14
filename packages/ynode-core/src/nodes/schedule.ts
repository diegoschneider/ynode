import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  cronExpression: z.string().default('0 * * * *'),
  timezone: z.string().default('UTC'),
  description: z.string().optional(),
});

type ScheduleConfig = z.infer<typeof configSchema>;

export const scheduleNode = defineNode<ScheduleConfig>({
  type: 'schedule',
  label: 'Schedule',
  description: 'Start workflow on a scheduled interval using cron expressions',
  category: 'trigger',
  icon: 'Clock',
  color: 'brand-amber',

  inputs: [],

  outputs: [
    {
      id: 'trigger',
      label: 'Trigger',
      type: 'object',
      description: 'Schedule trigger data with timestamp',
    },
  ],

  configSchema,
  defaultConfig: {
    cronExpression: '0 * * * *',
    timezone: 'UTC',
  },

  async execute(ctx: ExecutionContext<ScheduleConfig>): Promise<NodeOutput> {
    const { config, log } = ctx;
    const timestamp = new Date().toISOString();

    log(
      `Schedule triggered (cron: ${config.cronExpression}, timezone: ${config.timezone})`
    );

    const triggerData = {
      triggered: true,
      type: 'schedule',
      cronExpression: config.cronExpression,
      timezone: config.timezone,
      scheduledTime: timestamp,
      timestamp,
    };

    return {
      data: {
        default: triggerData,
        trigger: triggerData,
      },
    };
  },
});
