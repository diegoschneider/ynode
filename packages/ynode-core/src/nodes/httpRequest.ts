import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  url: z.string().default(''),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().min(1000).max(60000).default(30000),
});

type HttpRequestConfig = z.infer<typeof configSchema>;

export const httpRequestNode = defineNode<HttpRequestConfig>({
  type: 'httpRequest',
  label: 'HTTP Request',
  description: 'Make HTTP requests to external APIs and services',
  category: 'integration',
  icon: 'Globe',
  color: 'brand-cyan',

  inputs: [
    {
      id: 'trigger',
      label: 'Trigger',
      type: 'any',
      required: true,
      description: 'Incoming data from previous node',
    },
    {
      id: 'urlOverride',
      label: 'URL Override',
      type: 'string',
      description: 'Dynamically override the configured URL',
    },
    {
      id: 'bodyData',
      label: 'Body Data',
      type: 'object',
      description: 'Data to send in request body',
    },
  ],

  outputs: [
    {
      id: 'response',
      label: 'Response',
      type: 'object',
      description: 'HTTP response with status and data',
    },
    {
      id: 'error',
      label: 'Error',
      type: 'object',
      description: 'Error information if request failed',
    },
  ],

  configSchema,
  defaultConfig: {
    url: '',
    method: 'GET',
    timeout: 30000,
  },

  async execute(ctx: ExecutionContext<HttpRequestConfig>): Promise<NodeOutput> {
    const { config, inputs, log, abortSignal } = ctx;

    const url = (inputs.urlOverride as string) || config.url;

    if (!url) {
      const error = new Error('URL is required');
      log('Error: URL is required');
      return {
        data: { error: { message: error.message } },
        error,
      };
    }

    log(`Making ${config.method} request to ${url}`);

    try {
      const headers: Record<string, string> = {};
      if (config.headers && typeof config.headers === 'object') {
        for (const [key, value] of Object.entries(config.headers)) {
          if (typeof value === 'string' && value.trim()) {
            headers[key] = value;
          }
        }
      }

      const fetchOptions: RequestInit = {
        method: config.method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        signal: abortSignal,
      };

      if (config.method !== 'GET') {
        const bodyData = inputs.bodyData ?? config.body;
        if (bodyData) {
          fetchOptions.body =
            typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
        }
      }

      const response = await fetch(url, fetchOptions);

      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const output = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };

      log(`Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        return {
          data: { error: output, default: output, response: output },
          error: new Error(`HTTP ${response.status}: ${response.statusText}`),
        };
      }

      return {
        data: {
          default: output,
          response: output,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log(`Error: ${message}`);
      return {
        data: { error: { message } },
        error: error as Error,
      };
    }
  },
});
