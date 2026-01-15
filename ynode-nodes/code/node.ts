import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    language: z.enum(['javascript', 'python']).default('javascript'),
    code: z.string().default(`// Available variables:
// $input - The main input data
// inputs - All inputs as object
// outputs - Set your results here
// memory - Node-scoped memory (get/set)
// workflowMemory - Workflow-scoped memory (get/set)

outputs.result = $input;
`),
    timeout: z.number().min(1000).max(120000).default(30000),
    memoryLimit: z.number().min(8).max(512).default(128), // MB
});

type CodeConfig = z.infer<typeof configSchema>;

export const codeNode = defineNode<CodeConfig>({
    type: 'code',
    label: 'Code',
    description: 'Execute JavaScript or Python code in isolated sandbox',
    category: 'utility',
    icon: 'Code',
    color: 'brand-orange',

    inputs: [
        {
            id: 'trigger',
            label: 'Trigger',
            type: 'any',
            required: true,
            description: 'Triggers execution',
        },
        {
            id: 'data',
            label: 'Data',
            type: 'any',
            description: 'Input data available as $input',
        },
    ],

    outputs: [
        {
            id: 'result',
            label: 'Result',
            type: 'any',
            description: 'The outputs.result value',
        },
        {
            id: 'all',
            label: 'All Outputs',
            type: 'object',
            description: 'Complete outputs object',
        },
        {
            id: 'error',
            label: 'Error',
            type: 'object',
            description: 'Error if execution failed',
        },
    ],

    configSchema,
    defaultConfig: {
        language: 'javascript',
        code: `// Available variables:
// $input - The main input data
// inputs - All inputs as object
// outputs - Set your results here
// memory - Node-scoped memory (get/set)
// workflowMemory - Workflow-scoped memory (get/set)

outputs.result = $input;
`,
        timeout: 30000,
        memoryLimit: 128,
    },

    usesMemory: true,
    usesWorkflowMemory: true,

    async execute(ctx: ExecutionContext<CodeConfig>): Promise<NodeOutput> {
        const { config, inputs, log, memory, workflowMemory } = ctx;

        const lang = (config.language || 'javascript').toLowerCase();
        log(`Executing ${lang} code...`);

        if (lang === 'python' || lang === 'py') {
            return {
                data: {
                    error: {
                        message: 'Python execution is not supported in this environment.',
                    },
                },
                error: new Error('Python not supported'),
            };
        }

        try {
            // @ts-ignore
            const ivmModule = await import('isolated-vm');
            const ivm = ivmModule.default || ivmModule;

            // Retrieve memory values
            const memoryKeys = await memory.list();
            const workflowMemoryKeys = await workflowMemory.list();

            const memoryData: Record<string, unknown> = {};
            const workflowMemoryData: Record<string, unknown> = {};

            for (const key of memoryKeys) {
                memoryData[key] = await memory.get(key);
            }
            for (const key of workflowMemoryKeys) {
                workflowMemoryData[key] = await workflowMemory.get(key);
            }

            const $input = inputs.data ?? inputs.trigger ?? null;

            // Create isolated VM instance with memory limit
            const isolate = new ivm.Isolate({
                memoryLimit: config.memoryLimit || 128,
            });

            const context = await isolate.createContext();

            // Create jail (global object in isolated context)
            const jail = context.global;

            // Set input data
            await jail.set('$input', new ivm.ExternalCopy($input).copyInto());
            await jail.set('inputs', new ivm.ExternalCopy(inputs).copyInto());
            await jail.set(
                '_memoryData',
                new ivm.ExternalCopy(memoryData).copyInto()
            );
            await jail.set(
                '_workflowMemoryData',
                new ivm.ExternalCopy(workflowMemoryData).copyInto()
            );

            // Create outputs object in isolate
            await jail.set('outputs', {}, { copy: true });
            await jail.set('_memoryUpdates', {}, { copy: true });
            await jail.set('_workflowMemoryUpdates', {}, { copy: true });

            // Add console logging with callback
            const logMessages: string[] = [];
            await jail.set(
                '_logCallback',
                new ivm.Reference((msg: string) => {
                    logMessages.push(msg);
                    log(msg);
                })
            );

            // Setup safe environment in isolate
            await context.eval(`
                // Setup console
                globalThis.console = {
                    log: (...args) => {
                        const msg = args.map(a => String(a)).join(' ');
                        _logCallback.applySync(undefined, [msg]);
                    },
                    warn: (...args) => {
                        const msg = 'WARN: ' + args.map(a => String(a)).join(' ');
                        _logCallback.applySync(undefined, [msg]);
                    },
                    error: (...args) => {
                        const msg = 'ERROR: ' + args.map(a => String(a)).join(' ');
                        _logCallback.applySync(undefined, [msg]);
                    }
                };

                // Setup memory proxies
                globalThis.memory = {
                    get: (key) => _memoryData[key],
                    set: (key, value) => { _memoryUpdates[key] = value; },
                    delete: (key) => { _memoryUpdates[key] = null; },
                    keys: () => Object.keys(_memoryData)
                };

                globalThis.workflowMemory = {
                    get: (key) => _workflowMemoryData[key],
                    set: (key, value) => { _workflowMemoryUpdates[key] = value; },
                    delete: (key) => { _workflowMemoryUpdates[key] = null; },
                    keys: () => Object.keys(_workflowMemoryData)
                };

                // Safe built-ins available
                globalThis.JSON = JSON;
                globalThis.Math = Math;
                globalThis.Date = Date;
                globalThis.Array = Array;
                globalThis.Object = Object;
                globalThis.String = String;
                globalThis.Number = Number;
                globalThis.Boolean = Boolean;
                globalThis.Map = Map;
                globalThis.Set = Set;
            `);

            // Run user code with timeout
            const timeout = config.timeout || 30000;
            await context.eval(config.code, { timeout });

            // Extract results from isolate
            const outputsRef = await jail.get('outputs');
            const outputs = await outputsRef.copy();

            const memoryUpdatesRef = await jail.get('_memoryUpdates');
            const extractedMemoryUpdates = await memoryUpdatesRef.copy();

            const workflowMemoryUpdatesRef = await jail.get('_workflowMemoryUpdates');
            const extractedWorkflowMemoryUpdates =
                await workflowMemoryUpdatesRef.copy();

            // Persist memory updates
            for (const [key, value] of Object.entries(extractedMemoryUpdates)) {
                if (value === null) {
                    await memory.delete(key);
                } else {
                    await memory.set(key, value);
                }
            }
            for (const [key, value] of Object.entries(
                extractedWorkflowMemoryUpdates
            )) {
                if (value === null) {
                    await workflowMemory.delete(key);
                } else {
                    await workflowMemory.set(key, value);
                }
            }

            // Cleanup
            isolate.dispose();

            log(`Code executed successfully`);

            return {
                data: {
                    default: outputs.result ?? outputs,
                    result: outputs.result ?? outputs,
                    all: outputs,
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

export default codeNode;
