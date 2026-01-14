import { z } from 'zod';
import { defineNode } from '../types/index.js';
import type { ExecutionContext, NodeOutput } from '../types/index.js';

const configSchema = z.object({
    credentialId: z.string().default(''),
    chatId: z.string().default(''),
    parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2', '']).default(''),
});

type TelegramConfig = z.infer<typeof configSchema>;

export const telegramNode = defineNode<TelegramConfig>({
    type: 'telegram',
    label: 'Telegram',
    description: 'Send messages via Telegram Bot',
    category: 'communication',
    icon: 'Send',
    color: 'brand-cyan',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'any',
            required: true,
            description: 'Triggers execution',
        },
        {
            id: 'message',
            label: 'Message',
            type: 'string',
            required: true,
            description: 'Message text to send',
        },
        {
            id: 'chatIdOverride',
            label: 'Chat ID',
            type: 'string',
            description: 'Override chat ID from config',
        },
    ],

    outputs: [
        {
            id: 'result',
            label: 'Result',
            type: 'object',
            description: 'Telegram API response',
        },
        {
            id: 'error',
            label: 'Error',
            type: 'object',
            description: 'Error if failed',
        },
    ],

    configSchema,
    defaultConfig: {
        credentialId: '',
        chatId: '',
        parseMode: '',
    },

    credentials: [
        {
            type: 'telegram',
            required: true,
            description: 'Telegram Bot Token',
        },
    ],

    requiresNetwork: true,

    async execute(ctx: ExecutionContext<TelegramConfig>): Promise<NodeOutput> {
        const { config, inputs, log, credentials } = ctx;

        if (!config.credentialId) {
            return {
                data: { error: { message: 'No Telegram credential configured' } },
                error: new Error('No Telegram credential configured'),
            };
        }

        const message = inputs.message as string;
        const chatId = (inputs.chatIdOverride as string) || config.chatId;

        if (!message) {
            return {
                data: { error: { message: 'No message provided' } },
                error: new Error('No message provided'),
            };
        }

        if (!chatId) {
            return {
                data: { error: { message: 'No chat ID configured' } },
                error: new Error('No chat ID configured'),
            };
        }

        try {
            const creds = await credentials.get(config.credentialId);
            const botToken = creds.botToken || creds.apiKey;

            log(`Sending message to chat ${chatId}...`);

            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const body: Record<string, unknown> = {
                chat_id: chatId,
                text: message,
            };

            if (config.parseMode) {
                body.parse_mode = config.parseMode;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(
                    `Telegram API error: ${data.error_code} - ${data.description}`
                );
            }

            log(`Message sent successfully`);

            return {
                data: {
                    default: data.result,
                    result: data.result,
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            log(`Error: ${message}`);
            return {
                data: { error: { message } },
                error: error as Error,
            };
        }
    },
});
