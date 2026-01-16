import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    key: z.string().default('myKey'),
    ttlSeconds: z.number().min(0).default(0),
});

type SetMemoryConfig = z.infer<typeof configSchema>;

export const setMemoryNode = defineNode<SetMemoryConfig>({
    type: 'setMemory',
    label: 'Set Memory',
    description: 'Store a value in workflow memory',
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
            id: 'value',
            label: 'Value',
            type: 'any',
            required: true,
            description: 'Value to store in memory',
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
            id: 'stored',
            label: 'Stored Value',
            type: 'any',
            description: 'The stored value (passthrough)',
        },
        {
            id: 'key',
            label: 'Key',
            type: 'string',
            description: 'The key that was used',
        },
    ],

    configSchema,
    defaultConfig: {
        key: 'myKey',
        ttlSeconds: 0,
    },

    usesWorkflowMemory: true,

    async execute(ctx: ExecutionContext<SetMemoryConfig>): Promise<NodeOutput> {
        const { config, inputs, log, workflowMemory } = ctx;

        const key = (inputs.keyOverride as string) || config.key;
        const value = inputs.value;

        if (!key) {
            return {
                data: { error: { message: 'No key specified' } },
                error: new Error('No key specified'),
            };
        }

        log(`Storing value in memory with key: ${key}`);

        const ttl = config.ttlSeconds > 0 ? config.ttlSeconds : undefined;
        await workflowMemory.set(key, value, ttl);

        if (ttl) {
            log(`Value stored with TTL: ${ttl} seconds`);
        } else {
            log(`Value stored (no expiry)`);
        }

        return {
            data: {
                default: value,
                stored: value,
                key: key,
            },
        };
    },
});

export default setMemoryNode;
