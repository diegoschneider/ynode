import { z } from 'zod';
import { defineNode } from '../types';
import type { ExecutionContext, NodeOutput } from '../types';

const caseSchema = z.object({
  value: z.string(),
  output: z.string(),
});

const configSchema = z.object({
  dataPath: z.string().default('data.value'),
  cases: z.array(caseSchema).default([]),
  defaultOutput: z.string().default('default'),
});

type SwitchConfig = z.infer<typeof configSchema>;

export const switchNode = defineNode<SwitchConfig>({
  type: 'switch',
  label: 'Switch',
  description: 'Route to different outputs based on input value matching',
  category: 'logic',
  icon: 'GitBranch',
  color: 'brand-orange',

  inputs: [
    {
      id: 'data',
      label: 'Data',
      type: 'any',
      required: true,
      description: 'Data containing the value to match',
    },
  ],

  outputs: [
    {
      id: 'case0',
      label: 'Case 1',
      type: 'any',
      description: 'First case output',
    },
    {
      id: 'case1',
      label: 'Case 2',
      type: 'any',
      description: 'Second case output',
    },
    {
      id: 'case2',
      label: 'Case 3',
      type: 'any',
      description: 'Third case output',
    },
    {
      id: 'default',
      label: 'Default',
      type: 'any',
      description: 'Default output when no case matches',
    },
  ],

  configSchema,
  defaultConfig: {
    dataPath: 'data.value',
    cases: [],
    defaultOutput: 'default',
  },

  async execute(ctx: ExecutionContext<SwitchConfig>): Promise<NodeOutput> {
    const { config, inputs, log } = ctx;
    const data = inputs.data ?? inputs;

    let valueToMatch: unknown;
    try {
      const pathParts = config.dataPath.split('.');
      valueToMatch = pathParts.reduce((obj: unknown, key) => {
        if (obj && typeof obj === 'object' && key in obj) {
          return (obj as Record<string, unknown>)[key];
        }
        return undefined;
      }, data);
    } catch {
      valueToMatch = data;
    }

    log(`Evaluating switch on value: ${JSON.stringify(valueToMatch)}`);

    for (let i = 0; i < config.cases.length; i++) {
      const caseItem = config.cases[i];
      if (String(valueToMatch) === caseItem.value) {
        const output = caseItem.output || `case${i}`;
        log(`Matched case: "${caseItem.value}" → ${output}`);
        return {
          data: { [output]: data },
          branch: output,
        };
      }
    }

    log(`No case matched, using default output`);
    return {
      data: { default: data },
      branch: 'default',
    };
  },
});
