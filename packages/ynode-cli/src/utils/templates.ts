export function getBasicNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

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
            type: 'any',
            required: true,
            description: 'Input data',
        },
    ],

    outputs: [
        {
            id: 'output',
            label: 'Output',
            type: 'any',
            description: 'Output data',
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
            input: inputs.trigger,
            option: config.exampleOption,
        };

        return {
            data: {
                default: result,
                output: result,
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
            type: 'any',
            required: true,
            description: 'Incoming data',
        },
    ],

    outputs: [
        {
            id: 'result',
            label: 'Result',
            type: 'object',
            description: 'API response',
        },
        {
            id: 'error',
            label: 'Error',
            type: 'object',
            description: 'Error if failed',
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

            const result = {
                success: true,
                input: inputs.trigger,
            };

            return {
                data: {
                    default: result,
                    result: result,
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
