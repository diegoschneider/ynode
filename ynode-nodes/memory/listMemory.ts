import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({});

type ListMemoryConfig = z.infer<typeof configSchema>;

export const listMemoryNode = defineNode<ListMemoryConfig>({
    type: 'listMemory',
    label: 'List Memory',
    description: 'List all keys in workflow memory',
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
    ],

    outputs: [
        {
            id: 'keys',
            label: 'Keys',
            type: 'array',
            description: 'List of all memory keys',
        },
        {
            id: 'count',
            label: 'Count',
            type: 'number',
            description: 'Number of keys',
        },
    ],

    configSchema,
    defaultConfig: {},

    usesWorkflowMemory: true,

    async execute(ctx: ExecutionContext<ListMemoryConfig>): Promise<NodeOutput> {
        const { log, workflowMemory } = ctx;

        log('Listing all keys in workflow memory');

        const keys = await workflowMemory.list();

        log(`Found ${keys.length} keys in memory`);

        return {
            data: {
                default: keys,
                keys: keys,
                count: keys.length,
            },
        };
    },
});

export default listMemoryNode;
