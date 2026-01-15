export function getBasicNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

/**
 * Available Port Types:
 * - Primitives: 'string' | 'number' | 'boolean' | 'null'
 * - Structured: 'object' | 'array' | 'json'
 * - Format: 'datetime' | 'date' | 'time' | 'uuid' | 'url' | 'email' | 'regex' | 'base64' | 'markdown' | 'html' | 'xml' | 'yaml' | 'csv'
 * - Binary: 'binary' | 'image' | 'audio' | 'video' | 'pdf'
 * - Special: 'any' | 'trigger'
 */

const configSchema = z.object({
    exampleOption: z.string().default('default value'),
});

type ${name}Config = z.infer<typeof configSchema>;

export const ${className}Node = defineNode<${name}Config>({
    type: '${nodeType}',
    label: '${name}',
    description: 'Description of your ${name} node',
    category: '${category}',
    icon: 'Box',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'trigger',  // Use 'trigger' for flow control, or specific types like 'string', 'object'
            required: true,
            description: 'Triggers execution',
        },
        {
            id: 'data',
            label: 'Data',
            type: 'string',  // Specify the expected input type
            description: 'Input data to process',
        },
    ],

    outputs: [
        {
            id: 'result',
            label: 'Result',
            type: 'object',  // Specify output type for connection validation
            description: 'Processed result',
        },
    ],

    configSchema,
    defaultConfig: {
        exampleOption: 'default value',
    },

    async execute(ctx: ExecutionContext<${name}Config>): Promise<NodeOutput> {
        const { config, inputs, log } = ctx;

        log(\`Executing ${name} with option: \${config.exampleOption}\`);

        const result = {
            processed: true,
            input: inputs.data,
            option: config.exampleOption,
        };

        return {
            data: {
                default: result,
                result: result,
            },
        };
    },
});

export default ${className}Node;
`;
}

export function getIntegrationNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

/**
 * Available Port Types:
 * - Primitives: 'string' | 'number' | 'boolean' | 'null'
 * - Structured: 'object' | 'array' | 'json'
 * - Format: 'datetime' | 'date' | 'time' | 'uuid' | 'url' | 'email' | 'regex' | 'base64' | 'markdown' | 'html' | 'xml' | 'yaml' | 'csv'
 * - Binary: 'binary' | 'image' | 'audio' | 'video' | 'pdf'
 * - Special: 'any' | 'trigger'
 */

const configSchema = z.object({
    credentialId: z.string().default(''),
});

type ${name}Config = z.infer<typeof configSchema>;

export const ${className}Node = defineNode<${name}Config>({
    type: '${nodeType}',
    label: '${name}',
    description: 'Integration node for ${name}',
    category: '${category}',
    icon: 'Plug',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'trigger',  // Flow trigger
            required: true,
            description: 'Triggers API call',
        },
        {
            id: 'payload',
            label: 'Payload',
            type: 'json',  // Expects JSON data
            description: 'Request payload',
        },
    ],

    outputs: [
        {
            id: 'response',
            label: 'Response',
            type: 'json',  // API returns JSON
            description: 'Full API response',
        },
        {
            id: 'data',
            label: 'Data',
            type: 'object',  // Parsed data object
            description: 'Response data',
        },
        {
            id: 'error',
            label: 'Error',
            type: 'object',
            description: 'Error if request failed',
        },
    ],

    configSchema,
    defaultConfig: {
        credentialId: '',
    },

    credentials: [
        {
            type: '${nodeType}',
            required: true,
            description: 'API credentials for ${name}',
        },
    ],

    requiresNetwork: true,

    async execute(ctx: ExecutionContext<${name}Config>): Promise<NodeOutput> {
        const { config, inputs, log, credentials } = ctx;

        if (!config.credentialId) {
            return {
                data: { error: { message: 'No credential configured' } },
                error: new Error('No credential configured'),
            };
        }

        try {
            const creds = await credentials.get(config.credentialId);
            log(\`Using credential: \${config.credentialId}\`);

            // YOUR INTEGRATION LOGIC HERE
            // const response = await fetch('https://api.example.com', { ... });
            // const data = await response.json();

            const result = {
                success: true,
                payload: inputs.payload,
            };

            return {
                data: {
                    default: result,
                    response: result,
                    data: result,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            log(\`Error: \${message}\`);
            return {
                data: { error: { message } },
                error: error as Error,
            };
        }
    },
});

export default ${className}Node;
`;
}
