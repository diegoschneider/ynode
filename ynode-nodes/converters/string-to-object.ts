import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

export const stringToObjectNode = defineNode({
    type: 'stringToObject',
    label: 'String → Object',
    description: 'Parse JSON string to object',
    category: 'transform',
    icon: 'Shuffle',
    color: 'brand-purple',

    inputs: [
        {
            id: 'string',
            label: 'String',
            type: 'string',
            required: true,
        },
    ],

    outputs: [
        {
            id: 'object',
            label: 'Object',
            type: 'object',
        },
        {
            id: 'error',
            label: 'Error',
            type: 'string',
        },
    ],

    configSchema: z.object({}),
    defaultConfig: {},

    async execute(ctx: ExecutionContext): Promise<NodeOutput> {
        const { inputs } = ctx;

        try {
            const obj = JSON.parse(inputs.string as string);
            return {
                data: {
                    default: obj,
                    object: obj,
                },
            };
        } catch (error) {
            return {
                data: {
                    error: 'Invalid JSON',
                },
                error: error as Error,
            };
        }
    },
});

export default stringToObjectNode;
