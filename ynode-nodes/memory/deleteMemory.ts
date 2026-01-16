import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    key: z.string().default('myKey'),
});

type DeleteMemoryConfig = z.infer<typeof configSchema>;

export const deleteMemoryNode = defineNode<DeleteMemoryConfig>({
    type: 'deleteMemory',
    label: 'Delete Memory',
    description: 'Delete a key from workflow memory',
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
            id: 'deleted',
            label: 'Deleted',
            type: 'boolean',
            description: 'Whether delete was successful',
        },
        {
            id: 'key',
            label: 'Key',
            type: 'string',
            description: 'The key that was deleted',
        },
    ],

    configSchema,
    defaultConfig: {
        key: 'myKey',
    },

    usesWorkflowMemory: true,

    async execute(ctx: ExecutionContext<DeleteMemoryConfig>): Promise<NodeOutput> {
        const { config, inputs, log, workflowMemory } = ctx;

        const key = (inputs.keyOverride as string) || config.key;

        if (!key) {
            return {
                data: { error: { message: 'No key specified' } },
                error: new Error('No key specified'),
            };
        }

        log(`Deleting key from memory: ${key}`);

        await workflowMemory.delete(key);

        log(`Key deleted: ${key}`);

        return {
            data: {
                default: true,
                deleted: true,
                key: key,
            },
        };
    },
});

export default deleteMemoryNode;
