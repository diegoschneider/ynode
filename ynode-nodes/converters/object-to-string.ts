import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    pretty: z.boolean().default(false),
});

type Config = z.infer<typeof configSchema>;

export const objectToStringNode = defineNode<Config>({
    type: 'objectToString',
    label: 'Object → String',
    description: 'Convert object to JSON string',
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
            id: 'string',
            label: 'String',
            type: 'string',
        },
    ],

    configSchema,
    defaultConfig: {
        pretty: false,
    },

    async execute(ctx: ExecutionContext<Config>): Promise<NodeOutput> {
        const { inputs, config } = ctx;

        const obj = inputs.object;

        if (obj === undefined) {
            return {
                data: {
                    default: 'undefined',
                    string: 'undefined',
                },
            };
        }

        if (obj === null) {
            return {
                data: {
                    default: 'null',
                    string: 'null',
                },
            };
        }

        const str = config.pretty
            ? JSON.stringify(obj, null, 2)
            : JSON.stringify(obj);

        return {
            data: {
                default: str,
                string: str,
            },
        };
    },
});

export default objectToStringNode;
