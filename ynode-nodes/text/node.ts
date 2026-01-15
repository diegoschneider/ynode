import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    text: z.string().default(''),
});

type TextConfig = z.infer<typeof configSchema>;

export const textNode = defineNode<TextConfig>({
    type: 'text',
    label: 'Text',
    description: 'Static text input - outputs configured text value',
    category: 'transform',
    icon: 'Type',
    color: 'brand-blue',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'any',
            required: true,
            description: 'Triggers output',
        },
    ],

    outputs: [
        {
            id: 'text',
            label: 'Text',
            type: 'string',
            description: 'The configured text value',
        },
    ],

    configSchema,
    defaultConfig: {
        text: '',
    },

    async execute(ctx: ExecutionContext<TextConfig>): Promise<NodeOutput> {
        const { config, log } = ctx;

        log(
            `Outputting text: "${config.text.substring(0, 50)}${config.text.length > 50 ? '...' : ''}"`
        );

        return {
            data: {
                default: config.text,
                text: config.text,
            },
        };
    },
});

export default textNode;
