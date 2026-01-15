import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const FREE_MODELS = [
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'mistralai/devstral-2512:free',
    'tngtech/tng-r1t-chimera:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'openai/gpt-oss-120b:free',
    'openai/gpt-oss-20b:free',
    'z-ai/glm-4.5-air:free',
    'qwen/qwen3-coder:free',
    'moonshotai/kimi-k2:free',
    'google/gemma-3n-e2b-it:free',
    'google/gemma-3n-e4b-it:free',
    'google/gemma-3-4b-it:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-vl-7b-instruct:free',
    'meta-llama/llama-3.1-405b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
] as const;

const configSchema = z.object({
    credentialId: z.string().default(''),
    model: z
        .enum(FREE_MODELS)
        .default('mistralai/devstral-2512:free'),
    systemPrompt: z.string().default('You are a helpful assistant.'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(16384).default(2048),
});

type OpenRouterConfig = z.infer<typeof configSchema>;

export const openRouterNode = defineNode<OpenRouterConfig>({
    type: 'openRouter',
    label: 'OpenRouter',
    description: 'Access 300+ LLMs via OpenRouter API (includes free models)',
    category: 'ai',
    icon: 'Sparkles',
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
            id: 'prompt',
            label: 'Prompt',
            type: 'string',
            required: true,
            description: 'The prompt to send',
        },
        {
            id: 'modelOverride',
            label: 'Model Override',
            type: 'string',
            description: 'Override model from config',
        },
    ],

    outputs: [
        {
            id: 'response',
            label: 'Response',
            type: 'object',
            description: 'Full API response',
        },
        {
            id: 'text',
            label: 'Text',
            type: 'string',
            description: 'Just the response text',
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
        model: 'mistralai/devstral-2512:free',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        maxTokens: 2048,
    },

    credentials: [
        {
            type: 'openrouter',
            required: true,
            description: 'OpenRouter API key',
        },
    ],

    requiresNetwork: true,

    async execute(ctx: ExecutionContext<OpenRouterConfig>): Promise<NodeOutput> {
        const { config, inputs, log, credentials } = ctx;

        if (!config.credentialId) {
            return {
                data: { error: { message: 'No OpenRouter credential configured' } },
                error: new Error('No OpenRouter credential configured'),
            };
        }

        const prompt = inputs.prompt as string;
        if (!prompt) {
            return {
                data: { error: { message: 'No prompt provided' } },
                error: new Error('No prompt provided'),
            };
        }

        const model = (inputs.modelOverride as string) || config.model;

        try {
            const creds = await credentials.get(config.credentialId);
            const apiKey = creds.apiKey;

            log(`Calling OpenRouter: ${model}...`);

            const response = await fetch(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: config.systemPrompt },
                            { role: 'user', content: prompt },
                        ],
                        temperature: config.temperature,
                        max_tokens: config.maxTokens,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            log(`Response received (${data.usage?.total_tokens || 0} tokens)`);

            return {
                data: {
                    default: { content, usage: data.usage, model },
                    response: { content, usage: data.usage, model, id: data.id },
                    text: content,
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

export const OPENROUTER_FREE_MODELS = FREE_MODELS;
export default openRouterNode;
