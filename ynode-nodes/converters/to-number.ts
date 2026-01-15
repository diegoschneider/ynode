import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

export const toNumberNode = defineNode({
    type: 'toNumber',
    label: 'To Number',
    description: 'Convert string to number',
    category: 'transform',
    icon: 'Shuffle',
    color: 'brand-purple',

    inputs: [
        {
            id: 'value',
            label: 'Value',
            type: 'any',
            required: true,
        },
    ],

    outputs: [
        {
            id: 'number',
            label: 'Number',
            type: 'number',
        },
    ],

    configSchema: z.object({}),
    defaultConfig: {},

    async execute(ctx: ExecutionContext): Promise<NodeOutput> {
        const { inputs } = ctx;
        const num = Number(inputs.value);

        return {
            data: {
                default: num,
                number: num,
            },
        };
    },
});

export default toNumberNode;
