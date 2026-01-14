export function getBasicNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod'
import { defineNode } from '@ynode/core'
import type { ExecutionContext, NodeOutput } from '@ynode/core'

const configSchema = z.object({
    exampleOption: z.string().default('default value'),
})

type ${name}Config = z.infer<typeof configSchema>

export const ${className}Node = defineNode<${name}Config>({
    type: '${nodeType}',
    label: '${name}',
    description: 'Description of your ${name} node',
    category: '${category}',
    icon: 'Box', // Use Lucide icon name

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
        const { config, inputs, log } = ctx

        log(\`Executing ${name} with option: \${config.exampleOption}\`)

        // Your node logic here
        const result = {
            processed: true,
            input: inputs.trigger,
            option: config.exampleOption,
        }

        return {
            data: {
                default: result,
                output: result,
            },
        }
    },
})
`;
}

export function getIntegrationNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod'
import { defineNode } from '@ynode/core'
import type { ExecutionContext, NodeOutput } from '@ynode/core'

const configSchema = z.object({
    // Add your configuration options here
    endpoint: z.string().default(''),
})

type ${name}Config = z.infer<typeof configSchema>

export const ${className}Node = defineNode<${name}Config>({
    type: '${nodeType}',
    label: '${name}',
    description: 'Integration node for ${name}',
    category: '${category}',
    icon: 'Plug', // Use Lucide icon name

    inputs: [
        {
            id: 'data',
            label: 'Data',
            type: 'any',
            required: true,
            description: 'Data to process',
        },
    ],

    outputs: [
        {
            id: 'response',
            label: 'Response',
            type: 'object',
            description: 'API response',
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
        endpoint: '',
    },

    // Declare credential requirements
    credentials: [
        {
            type: '${nodeType}',
            required: true,
            description: 'API credentials for ${name}',
        },
    ],

    requiresNetwork: true,

    async execute(ctx: ExecutionContext<${name}Config>): Promise<NodeOutput> {
        const { config, inputs, log, credentials } = ctx

        log(\`Executing ${name} integration\`)

        try {
            // Get credentials
            const creds = await credentials.get('credential_${nodeType}')
            
            // Your integration logic here
            log(\`Connecting to: \${config.endpoint}\`)

            const result = {
                success: true,
                data: inputs.data,
            }

            return {
                data: {
                    default: result,
                    response: result,
                },
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            log(\`Error: \${message}\`)
            return {
                data: { error: { message } },
                error: error as Error,
            }
        }
    },
})
`;
}

export function getInternalNodeTemplate(
    name: string,
    className: string,
    nodeType: string,
    category: string
): string {
    return `import { z } from 'zod'
import { defineNode } from '../types/index.js'
import type { ExecutionContext, NodeOutput } from '../types/index.js'

const configSchema = z.object({
    exampleOption: z.string().default(''),
})

type ${name}Config = z.infer<typeof configSchema>

export const ${className}Node = defineNode<${name}Config>({
    type: '${nodeType}',
    label: '${name}',
    description: '${name} node',
    category: '${category}',
    icon: 'Box',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'any',
            required: true,
        },
    ],

    outputs: [
        {
            id: 'output',
            label: 'Output',
            type: 'any',
        },
    ],

    configSchema,
    defaultConfig: {
        exampleOption: '',
    },

    async execute(ctx: ExecutionContext<${name}Config>): Promise<NodeOutput> {
        const { config, inputs, log } = ctx

        log(\`Executing ${name}\`)

        return {
            data: {
                output: {
                    input: inputs.trigger,
                    option: config.exampleOption,
                },
            },
        }
    },
})
`;
}
