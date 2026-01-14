import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  path: z.string().default('/webhook'),
  method: z
    .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ANY'])
    .default('POST'),
  responseMode: z.enum(['onReceived', 'lastNode']).default('onReceived'),
  responseCode: z.number().min(100).max(599).default(200),
});

type WebhookConfig = z.infer<typeof configSchema>;

export const webhookNode = defineNode<WebhookConfig>({
  type: 'webhook',
  label: 'Webhook',
  description:
    'Start workflow when HTTP request is received at the specified path',
  category: 'trigger',
  icon: 'Webhook',
  color: 'brand-purple',

  inputs: [],

  outputs: [
    {
      id: 'request',
      label: 'Request',
      type: 'object',
      description: 'Incoming HTTP request data',
    },
  ],

  configSchema,
  defaultConfig: {
    path: '/webhook',
    method: 'POST',
    responseMode: 'onReceived',
    responseCode: 200,
  },

  requiresNetwork: true,

  async execute(ctx: ExecutionContext<WebhookConfig>): Promise<NodeOutput> {
    const { config, log, inputs } = ctx;
    const timestamp = new Date().toISOString();

    log(`Webhook triggered at ${config.path} (${config.method})`);

    const requestData = {
      method: (inputs.method as string) || config.method,
      path: config.path,
      headers: (inputs.headers as Record<string, string>) || {},
      query: (inputs.query as Record<string, string>) || {},
      body: inputs.body || {},
      timestamp,
    };

    return {
      data: {
        default: requestData,
        request: requestData,
      },
    };
  },
});
