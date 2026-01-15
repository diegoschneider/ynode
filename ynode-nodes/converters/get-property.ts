import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    path: z.string().default(''),
});

type Config = z.infer<typeof configSchema>;

export const getPropertyNode = defineNode<Config>({
    type: 'getProperty',
    label: 'Get Property',
    description: 'Extract property from object (supports nested paths)',
    category: 'transform',
    icon: 'Shuffle',
    color: 'brand-purple',

    inputs: [
        {
            id: 'object',
            label: 'Object',
            type: 'object',
            required: true,
        },
    ],

    outputs: [
        {
            id: 'value',
            label: 'Value',
            type: 'any',
        },
    ],

    configSchema,
    defaultConfig: {
        path: '',
    },

    async execute(ctx: ExecutionContext<Config>): Promise<NodeOutput> {
        const { inputs, config } = ctx;
        const obj = inputs.object as any;
        const path = config.path;

        if (!path) {
            return {
                data: {
                    default: obj,
                    value: obj,
                },
            };
        }

        // Support dot notation: "address.city" or "data[0].name"
        const keys = path.split('.');
        let result = obj;

        for (const key of keys) {
            if (result && typeof result === 'object') {
                // Handle array notation like "data[0]"
                const arrayMatch = key.match(/(.+)\[(\d+)\]/);
                if (arrayMatch) {
                    const [, arrayKey, index] = arrayMatch;
                    result = result[arrayKey]?.[parseInt(index)];
                } else {
                    result = result[key];
                }
            } else {
                result = undefined;
                break;
            }
        }

        return {
            data: {
                default: result,
                value: result,
            },
        };
    },
});

export default getPropertyNode;
