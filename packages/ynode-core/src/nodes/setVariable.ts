import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  variableName: z.string().default('myVariable'),
  ttlSeconds: z.number().min(0).optional(),
});

type SetVariableConfig = z.infer<typeof configSchema>;

export const setVariableNode = defineNode<SetVariableConfig>({
  type: 'setVariable',
  label: 'Set Variable',
  description: 'Store a value in workflow memory for later retrieval',
  category: 'data',
  icon: 'Variable',
  color: 'brand-blue',

  inputs: [
    {
      id: 'value',
      label: 'Value',
      type: 'any',
      required: true,
      description: 'Value to store in the variable',
    },
  ],

  outputs: [
    {
      id: 'output',
      label: 'Output',
      type: 'any',
      description: 'Passes through the stored value',
    },
  ],

  configSchema,
  defaultConfig: {
    variableName: 'myVariable',
  },

  usesWorkflowMemory: true,

  async execute(ctx: ExecutionContext<SetVariableConfig>): Promise<NodeOutput> {
    const { config, inputs, log, workflowMemory } = ctx;
    const value = inputs.value ?? inputs;

    await workflowMemory.set(config.variableName, value, config.ttlSeconds);

    log(
      `Set variable "${config.variableName}" = ${JSON.stringify(value).substring(0, 50)}`
    );

    return {
      data: {
        default: value,
        output: value,
      },
    };
  },
});
