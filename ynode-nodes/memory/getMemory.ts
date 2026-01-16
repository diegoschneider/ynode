import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    key: z.string().default('myKey'),
    defaultValue: z.any().default(null),
});

type GetMemoryConfig = z.infer<typeof configSchema>;

export const getMemoryNode = defineNode<GetMemoryConfig>({
    type: 'getMemory',
    label: 'Get Memory',
    description: 'Retrieve a value from workflow memory',
    category: 'data',
    icon: 'Database',
    color: 'brand-purple',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'any',
            required: true,
            description: 'Triggers execution',
        },
        {
            id: 'keyOverride',
            label: 'Key Override',
            type: 'string',
            description: 'Dynamic key (overrides config)',
        },
    ],

    outputs: [
        {
            id: 'value',
            label: 'Value',
            type: 'any',
            description: 'Retrieved value',
        },
        {
            id: 'exists',
            label: 'Exists',
            type: 'boolean',
            description: 'Whether the key exists',
        },
    ],

    configSchema,
    defaultConfig: {
        key: 'myKey',
        defaultValue: null,
    },

    usesWorkflowMemory: true,

    async execute(ctx: ExecutionContext<GetMemoryConfig>): Promise<NodeOutput> {
        const { config, inputs, log, workflowMemory } = ctx;

        const key = (inputs.keyOverride as string) || config.key;

        if (!key) {
            return {
                data: { error: { message: 'No key specified' } },
                error: new Error('No key specified'),
            };
        }

        log(`Retrieving value from memory with key: ${key}`);

        const value = await workflowMemory.get(key);
        const exists = value !== null && value !== undefined;

        if (exists) {
            log(`Value found for key: ${key}`);
        } else {
            log(`Key not found: ${key}, using default value`);
        }

        const result = exists ? value : config.defaultValue;

        return {
            data: {
                default: result,
                value: result,
                exists: exists,
            },
        };
    },
});

export default getMemoryNode;
