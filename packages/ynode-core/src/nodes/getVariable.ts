import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const configSchema = z.object({
  variableName: z.string().default('myVariable'),
  defaultValue: z.unknown().optional(),
});

type GetVariableConfig = z.infer<typeof configSchema>;

export const getVariableNode = defineNode<GetVariableConfig>({
  type: 'getVariable',
  label: 'Get Variable',
  description: 'Retrieve a previously stored value from workflow memory',
  category: 'data',
  icon: 'Variable',
  color: 'brand-cyan',

  inputs: [
    {
      id: 'trigger',
      label: 'Trigger',
      type: 'any',
      description: 'Trigger to retrieve the variable',
    },
  ],

  outputs: [
    {
      id: 'value',
      label: 'Value',
      type: 'any',
      description: 'The retrieved variable value',
    },
  ],

  configSchema,
  defaultConfig: {
    variableName: 'myVariable',
  },

  usesWorkflowMemory: true,

  async execute(ctx: ExecutionContext<GetVariableConfig>): Promise<NodeOutput> {
    const { config, log, workflowMemory } = ctx;

    const value = await workflowMemory.get(config.variableName);
    const finalValue = value ?? config.defaultValue;

    if (value !== null) {
      log(
        `Retrieved variable "${config.variableName}" = ${JSON.stringify(finalValue).substring(0, 50)}`
      );
    } else {
      log(`Variable "${config.variableName}" not found, using default value`);
    }

    return {
      data: {
        default: finalValue,
        value: finalValue,
      },
    };
  },
});
