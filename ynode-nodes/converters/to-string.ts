import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

export const anyToStringNode = defineNode({
    type: 'anyToString',
    label: 'To String',
    description: 'Convert any value to string',
    category: 'transform',
    icon: 'Type',
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
            id: 'string',
            label: 'String',
            type: 'string',
        },
    ],

    configSchema: z.object({}),
    defaultConfig: {},

    async execute(ctx: ExecutionContext): Promise<NodeOutput> {
        const { inputs, log } = ctx;

        const value = inputs.value ?? inputs.default ?? inputs.trigger;

        log(`Input received: ${typeof value}`);

        let result: string;

        try {
            if (value === null) {
                result = 'null';
            } else if (value === undefined) {
                result = '';
            } else if (typeof value === 'string') {
                result = value;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                result = String(value);
            } else if (typeof value === 'object') {
                result = JSON.stringify(value);
            } else {
                result = String(value);
            }
        } catch {
            result = '';
        }

        return {
            data: {
                default: result,
                string: result,
            },
        };
    },
});

export default anyToStringNode;
